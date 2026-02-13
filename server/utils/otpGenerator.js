// Generate 6-digit verification code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate expiry time (10 minutes from now)
export const getVerificationExpiry = () => {
    const now = new Date();
    return new Date(now.getTime() + 10 * 60 * 1000);
};
