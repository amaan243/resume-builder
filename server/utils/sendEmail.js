import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS (false for port 587, true for 465)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certificates
    }
});

export const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: "Email Verification Code - Resume Builder",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p style="font-size: 16px; color: #555;">Thank you for signing up! Please verify your email address using the code below:</p>
                    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0; font-size: 48px; font-weight: bold;">${verificationCode}</h1>
                    </div>
                    <p style="font-size: 14px; color: #888;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #888;">If you didn't sign up for this account, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa;">Resume Builder - Professional Resume Creation Platform</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("[EMAIL ERROR] Failed to send email:", error.message);
        console.error("[EMAIL ERROR] Email config - USER:", process.env.EMAIL_USER);
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
};
