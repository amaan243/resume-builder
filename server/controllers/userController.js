import User from "../models/User.js";
import TempSignup from "../models/TempSignup.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../models/Resume.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { generateVerificationCode, getVerificationExpiry } from "../utils/otpGenerator.js";

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
        
        // Check if user already exists (verified)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Check if email is already in temp signup (pending verification)
        const pendingSignup = await TempSignup.findOne({ email });
        if (pendingSignup) {
            return res.status(400).json({ message: "Email already registered. Please check your inbox for verification code." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = getVerificationExpiry();
        
        // Create temporary signup record (not a full user yet)
        const tempSignup = await TempSignup.create({
            name,
            email,
            password: hashedPassword,
            verificationCode: String(verificationCode),
            verificationExpires,
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error("[REGISTER] Email sending failed:", emailError.message);
            // Still continue - user can request resend
        }

        // Return response WITHOUT token - user must verify first
        return res.status(201).json({
            message: "Verification code sent to your email. Please verify to complete signup.", 
            email,
            requiresVerification: true
        });
        
    } catch (error) {
       return res.status(400).json({ message: error.message });
    }
}

//controller for login user
//POST api/users/login

export const loginUser = async (req, res) => {
    try {
        const {  email, password } = req.body;
       
        // Check if user exists (only verified users exist in User collection)
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        //verify password
        if(!user.comparePassword(password)){
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // User is automatically verified since they only exist after email verification
        const token = genrateToken(user._id);
        user.password = undefined;

        return res.status(200).json({message: "User logged in successfully", user, token});
        
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

//controller for resending verification code
// POST api/users/resend-verification

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find temporary signup
        const tempSignup = await TempSignup.findOne({ email });

        if (!tempSignup) {
            return res.status(404).json({ message: "Verification request not found. Please sign up again." });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = getVerificationExpiry();

        tempSignup.verificationCode = String(verificationCode);
        tempSignup.verificationExpires = verificationExpires;
        await tempSignup.save();

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationCode);
            return res.status(200).json({ message: "Verification code sent to your email" });
        } catch (emailError) {
            console.error("[RESEND] Email sending failed:", emailError.message);
            return res.status(500).json({ message: "Failed to send verification email. Please try again." });
        }
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//controller for verifying email
// POST api/users/verify-email

export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: "Email and code are required" });
        }

        // Find temporary signup (not completed user)
        const tempSignup = await TempSignup.findOne({ email });

        if (!tempSignup) {
            return res.status(404).json({ message: "Verification request not found. Please sign up again." });
        }

        // Check if code matches
        const storedCode = String(tempSignup.verificationCode).trim();
        const providedCode = String(code).trim();
        
        if (storedCode !== providedCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Check if code has expired
        if (new Date() > tempSignup.verificationExpires) {
            return res.status(400).json({ message: "Verification code has expired. Please sign up again." });
        }

        // Now create the actual user account
        const newUser = await User.create({
            name: tempSignup.name,
            email: tempSignup.email,
            password: tempSignup.password,
            isVerified: true, // Account is verified immediately
        });

        // Delete temporary signup
        await TempSignup.deleteOne({ _id: tempSignup._id });

        return res.status(200).json({ message: "Email verified successfully. Your account is ready to use!" });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
