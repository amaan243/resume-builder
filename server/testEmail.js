import nodemailer from "nodemailer";
import 'dotenv/config';

console.log("========================================");
console.log("Gmail SMTP Connection Test");
console.log("========================================\n");

console.log("📧 Configuration:");
console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'}`);
console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("\n❌ ERROR: EMAIL_USER or EMAIL_PASS not set in .env file");
    console.error("\nPlease add these to your .env file:");
    console.error("EMAIL_USER=your-gmail@gmail.com");
    console.error("EMAIL_PASS=your-app-specific-password");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

console.log("\n🔍 Testing SMTP connection...\n");

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Connection Failed!");
        console.error("Error:", error.message);
        console.error("\n📋 TROUBLESHOOTING:\n");
        console.error("1. Check Gmail credentials in .env");
        console.error("2. Verify 2FA is ENABLED on Gmail account");
        console.error("3. Create App Password at: https://myaccount.google.com/apppasswords");
        console.error("4. Use 16-character app password (remove spaces if pasted)");
        console.error("5. Check internet connection");
        console.error("6. Make sure Less Secure Apps access is enabled\n");
        
        // Try to parse the error for more info
        if (error.message.includes("ECONNREFUSED")) {
            console.error("⚠️  ECONNREFUSED: Cannot reach Gmail SMTP server");
            console.error("   - Check internet connection");
            console.error("   - Firewall may be blocking port 587");
        } else if (error.message.includes("ENOTFOUND")) {
            console.error("⚠️  ENOTFOUND: DNS cannot resolve smtp.gmail.com");
            console.error("   - Check internet connection");
            console.error("   - Try changing DNS servers");
        } else if (error.message.includes("Invalid login")) {
            console.error("⚠️  Invalid login credentials");
            console.error("   - Wrong email or app password");
            console.error("   - App password must be 16 characters (with spaces)");
        }
        
        process.exit(1);
    } else {
        console.log("✅ SMTP connection successful!\n");
        console.log("📬 Sending test email...\n");
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "[TEST] Resume Builder - Email Verification Test",
            html: `
                <h2>Test Email</h2>
                <p>This is a test email from Resume Builder.</p>
                <p>If you received this, your email setup is working! ✅</p>
                <p style="color: #888; font-size: 12px;">Sent at: ${new Date().toString()}</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Email sending failed!");
                console.error("Error:", error.message);
                process.exit(1);
            } else {
                console.log("✅ Test email sent successfully!");
                console.log(`   Response: ${info.response}`);
                console.log("\n✨ Your email configuration is working!\n");
                process.exit(0);
            }
        });
    }
});
