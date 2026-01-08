import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../models/Resume.js";

const genrateToken = (userId) => {
   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
   });
   return token;
}

//POST api/users/register
export const registerUser =async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validate input
        if (!name || !email || !password) { 
            return res.status(400).json({ message: "All fields are required" });
        }
        // Check if user already exists
        const user=await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const newUser =  await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const token= genrateToken(newUser._id);
        newUser.password=undefined;

       return  res.status(201).json({message:"User registered successfully", user:newUser, token});
        
    } catch (error) {
       return res.status(400).json({ message: error.message });
    }
}

//controller for login user
//POST api/users/login

export const loginUser = async (req, res) => {
    try {
        const {  email, password } = req.body;
       
        // Check if user already exists
        const user=await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        //verify password
        if(!user.comparePassword(password)){
            return res.status(400).json({ message: "Invalid email or password" });
        }
        
    
      //successful login
        const token= genrateToken(user._id);
        user.password=undefined;

       return  res.status(200).json({message:"User logged in successfully", user, token});
        
    } catch (error) {
       return res.status(400).json({ message: error.message });
    }
}

//controller for getting user data by id
// GET api/users/data

export const getUserById = async (req, res) => {
    try {
        const userId = req.userId;
       
        // Check if user already exists
        const user=await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        //return user
    
        user.password=undefined;
        return res.status(200).json({user});
        
    } catch (error) {
       return res.status(400).json({ message: error.message });
    }
}

//controller for getting user resume
// GET api/users/resumes

export const getUserResumes = async (req, res) => {
    try {
        const userId = req.userId;

        const resumes=await Resume.find({userId});
       
        return res.status(200).json({resumes});
    } catch (error) {
       return res.status(400).json({ message: error.message });
    }
}
