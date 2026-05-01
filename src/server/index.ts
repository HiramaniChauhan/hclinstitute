import dotenv from "dotenv";
dotenv.config();
import { validate, registerSchema, loginSchema, otpRequestSchema, resetPasswordSchema } from "./middleware/validate";
import { getJwtSecret } from "./config-service";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { docClient, TABLES, isMemory } from "./db-wrapper";
import { PutCommand, ScanCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { errorHandler } from "./middleware/errorHandler";
import { verifyToken, requireAdmin } from "./middleware/auth";
import { queryItems } from "./utils/db-helpers";
import coursesRouter from "./routes/courses";
import batchesRouter from "./routes/batches";
import announcementsRouter from "./routes/announcements";
import lecturesRouter from "./routes/lectures";
import profileRouter from "./routes/profile";
import testsRouter from "./routes/tests";
import resultsRouter from "./routes/results";
import notesRouter from "./routes/notes";
import adminRouter from "./routes/admin";
import enrollmentsRouter from "./routes/enrollments";
import notificationsRouter from "./routes/notifications";
import feesRouter from "./routes/fees";
import chatRouter from "./routes/chat";
import selectedStudentsRouter from "./routes/selected-students";
import chapterTestsRouter from "./routes/chapter-tests";
import videosRouter from "./routes/videos";
import paymentsRouter from "./routes/payments";
import aboutRouter from "./routes/about";
import termsRouter from "./routes/terms";
import reviewsRouter from "./routes/reviews";

const app = express();
const port = process.env.PORT || 5001;

// ── Security Headers (helmet) ────────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow localhost in dev, locked to production domain in prod ────────
const rawOrigins = process.env.ALLOWED_ORIGIN || "";
const allowedOrigins = rawOrigins.split(",").map(o => o.trim().replace(/\/$/, "")).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server (no origin header) — e.g. curl, mobile apps
        if (!origin) return callback(null, true);
        
        // Strip trailing slash from origin just in case
        const cleanOrigin = origin.replace(/\/$/, "");

        // Allow any localhost port — ONLY in development
        if (process.env.NODE_ENV !== 'production') {
            if (cleanOrigin.startsWith("http://localhost:") || cleanOrigin.startsWith("http://127.0.0.1:")) {
                return callback(null, true);
            }
        }
        
        // Allow if exact match with one of the configured origins
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }

        callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Global: max 100 requests per minute per IP across all API routes
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many login attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP / Registration: max 5 per 10 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: "Too many requests. Please try again in 10 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

import fs from 'fs';
import path from 'path';

// Helper for OTP generation (cryptographically secure)
import crypto from 'crypto';
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Email Setup 
const testAccountInfo: any = null;
export const sendOtpEmail = async (toEmail: string, otp: string, subject: string) => {
    try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'noreply@hclins.com';
        const senderName = 'HCL Institute';

        let logoBase64 = "";
        try {
            const logoPath = path.join(process.cwd(), "public", "logo.png");
            if (fs.existsSync(logoPath)) {
                logoBase64 = fs.readFileSync(logoPath, "base64");
            }
        } catch (e) {
            console.warn("Could not load logo.png for email");
        }

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 600px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td align="center" style="background-color: #000000; padding: 25px 0 20px 0; border-bottom: 4px solid #e6873c;">
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    ${logoBase64 ? '<td valign="middle" style="padding-right: 15px;"><img src="cid:logo.png" alt="Logo" style="width: 55px; height: 55px; border-radius: 50%; display: block;"></td>' : ''}
                                    <td valign="middle">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">HCL Institute</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Here is your OTP</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                You recently requested a One-Time Password to securely access or modify your HCL Institute account. Please use the verification code below:
                            </p>
                            <div style="background-color: #f4f8fb; border: 2px dashed #225675; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #225675; margin: 0; font-size: 42px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
                            </div>
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                                Note: This code is valid for <strong>10 minutes</strong>.<br/>
                                Please do not share this OTP with anyone. If you didn't request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color: #f1f5f9; padding: 20px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                &copy; ${(new Date()).getFullYear()} HCL Institute. All rights reserved.
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

        // 1. Try Brevo REST API (Preferred - bypasses SMTP blocking)
        if (process.env.BREVO_API_KEY) {
            // console.log(`[Email] Attempting Brevo REST API to ${toEmail}`);

            const reqBody: any = {
                sender: { email: senderEmail, name: senderName },
                to: [{ email: toEmail }],
                subject,
                htmlContent: htmlTemplate
            };

            if (logoBase64) {
                reqBody.attachment = [{
                    content: logoBase64,
                    name: "logo.png"
                }];
            }

            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY
                },
                body: JSON.stringify(reqBody)
            });

            if (response.ok) {
                // console.log(`[Email Sent] Brevo REST API: ${toEmail}`);
                return true;
            } else {
                const errorData = await response.json();
                console.error("[Email Error] Brevo REST API failed:", errorData);
                // Fall through to SMTP if REST fails? No, usually REST is more reliable.
            }
        }

        // 2. Fallback to SMTP
        if (process.env.SMTP_USER) {
            // console.log(`[Email] Attempting SMTP to ${toEmail}`);
            const host = process.env.SMTP_HOST;
            const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
            const secure = port === 465;
            const auth = {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            };

            const transporter = nodemailer.createTransport({ host, port, secure, auth } as any);
            const mailOptions: any = {
                from: `"${senderName}" <${senderEmail}>`,
                to: toEmail,
                subject,
                text: `Your One-Time Password (OTP) is: ${otp}\n\nIt is valid for 10 minutes.`,
                html: htmlTemplate
            };

            if (logoBase64) {
                mailOptions.attachments = [{
                    filename: 'logo.png',
                    content: logoBase64,
                    encoding: 'base64',
                    cid: 'logo.png'
                }];
            }

            await transporter.sendMail(mailOptions);
            // console.log(`[Email Sent]SMTP: ${toEmail}`);
            return true;
        }

        // 3. Last resort: Mock logging
        /*
        console.log("-----------------------------------------");
        console.log("No Email Config found, showing Mock OTP");
        console.log(`[Mock Email] To: ${toEmail} | Subject: ${subject}`);
        console.log("[Mock Email] OTP has been sent (not logged for security).");
        console.log("-----------------------------------------");
        */
        return true;
    } catch (error) {
        console.error("Failed to send OTP Email:", error);
        return false;
    }
};

// OTP Endpoints
// Forgot Password Endpoints
app.post("/api/auth/forgot-password/request", otpLimiter, validate(otpRequestSchema), async (req, res) => {
    const { email, role } = req.body;

    try {
        // Check if user exists using efficient Query indexed by email
        const users = await queryItems<any>(
            TABLES.USERS,
            "EmailIndex",
            "email = :email",
            { ":email": email }
        );
        const user = users.find(u => u.role === role);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const otp = generateOTP();
        await docClient.send(new PutCommand({
            TableName: TABLES.OTPS,
            Item: {
                email,
                otp,
                expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 mins
            },
        }));

        await sendOtpEmail(email, otp, "Password Reset OTP - HCL Institute");
        res.json({ message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to process request" });
    }
});

app.post("/api/auth/forgot-password/verify", otpLimiter, async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        const storedOtp = result.Item;
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        res.json({ message: "OTP verified" });
    } catch (error) {
        res.status(500).json({ error: "Verification failed" });
    }
});

app.post("/api/auth/forgot-password/reset", otpLimiter, validate(resetPasswordSchema), async (req, res) => {
    const { email, otp, newPassword, role } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
        // Verify OTP again for security
        const otpResult = await docClient.send(new GetCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        const storedOtp = otpResult.Item;
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: "Invalid or expired session" });
        }

        // Get user using index
        const users = await queryItems<any>(
            TABLES.USERS,
            "EmailIndex",
            "email = :email",
            { ":email": email }
        );
        const user = users.find(u => u.role === role);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await docClient.send(new PutCommand({
            TableName: TABLES.USERS,
            Item: {
                ...user,
                password: hashedPassword,
                updatedAt: new Date().toISOString()
            },
        }));

        // Clean up OTP
        await docClient.send(new DeleteCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ error: "Password reset failed" });
    }
});

app.post("/api/auth/send-otp", otpLimiter, validate(otpRequestSchema), async (req, res) => {
    const { email, purpose } = req.body;

    try {
        const otp = generateOTP();
        await docClient.send(new PutCommand({
            TableName: TABLES.OTPS,
            Item: {
                email,
                otp,
                expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 mins
            },
        }));

        const subject = purpose ? `${purpose} OTP - HCL Institute` : "Registration OTP - HCL Institute";
        const isSent = await sendOtpEmail(email, otp, subject);
        if (isSent) {
            res.json({ message: "OTP sent successfully" });
        } else {
            res.status(500).json({ error: "Failed to send OTP email" });
        }
    } catch (error) {
        console.error("Failed to process send-otp request", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

app.post("/api/auth/verify-otp", otpLimiter, async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        const storedOtp = result.Item;
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await docClient.send(new DeleteCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        res.json({ message: "OTP verified" });
    } catch (error) {
        res.status(500).json({ error: "OTP verification failed" });
    }
});

// Admin Secret Key Endpoints
import { maskEmail } from "./utils/maskEmail";
const ADMIN_AUTHORIZED_EMAIL = process.env.VITE_SUPER_ADMIN_EMAIL!;

app.post("/api/auth/admin-secret-otp", otpLimiter, async (req, res) => {
    const { email } = req.body;
    if (email !== ADMIN_AUTHORIZED_EMAIL) {
        return res.status(403).json({ error: "Unauthorized email for admin operations" });
    }

    const otp = generateOTP();
    try {
        await docClient.send(new PutCommand({
            TableName: TABLES.OTPS,
            Item: {
                email,
                otp,
                expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 mins
            },
        }));

        await sendOtpEmail(email, otp, "Master Admin Secret Reset OTP");
        res.json({
            message: `OTP sent to ${maskEmail(ADMIN_AUTHORIZED_EMAIL)}`,
            maskedEmail: maskEmail(ADMIN_AUTHORIZED_EMAIL)
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to send Admin OTP" });
    }
});

app.post("/api/auth/update-admin-secret", otpLimiter, async (req, res) => {
    const { email, otp, newSecret } = req.body;
    if (email !== ADMIN_AUTHORIZED_EMAIL) {
        return res.status(403).json({ error: "Unauthorized email" });
    }

    if (!newSecret || newSecret.length < 6) {
        return res.status(400).json({ error: "Secret must be at least 6 characters" });
    }

    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        const storedOtp = result.Item;
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await docClient.send(new DeleteCommand({
            TableName: TABLES.OTPS,
            Key: { email },
        }));

        await docClient.send(new PutCommand({
            TableName: TABLES.CONFIG,
            Item: {
                id: "ADMIN_SECRET",
                value: newSecret,
                updatedAt: new Date().toISOString()
            }
        }));

        res.json({ message: "Admin secret updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

// Helper to check Admin Secret — always reads from DB, no hardcoded fallback
async function verifyAdminSecret(providedSecret: string): Promise<boolean> {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { id: "ADMIN_SECRET" }
        }));
        const expectedSecret = result.Item?.value;

        if (!expectedSecret) {
            console.warn("[Admin Auth] CRITICAL: No ADMIN_SECRET found in DB. Please seed it via init-db.");
            return false;
        }

        const isValid = providedSecret === expectedSecret;
        if (!isValid) {
            console.warn("[Admin Auth] Secret mismatch — invalid admin secret provided.");
        }
        return isValid;
    } catch (error) {
        console.error("[Admin Auth] Error verifying secret:", error);
        return false;
    }
}

// Auth Routes
app.post("/api/auth/register", otpLimiter, validate(registerSchema), async (req, res) => {
    const {
        firstName, lastName, email, password, role, adminSecret,
        phone, dateOfBirth, gender, address, city, state, pincode,
        qualification, institute, parentName, parentPhone, emergencyContact
    } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (role === "admin") {
        // Verify Admin Secret if role is admin
        const isValidAdmin = await verifyAdminSecret(adminSecret);
        if (!isValidAdmin) {
            return res.status(401).json({ error: "Invalid Admin Secret Code" });
        }
    }

    try {
        // Check for existing user first using index
        const users = await queryItems<any>(
            TABLES.USERS,
            "EmailIndex",
            "email = :email",
            { ":email": email }
        );
        const existingUser = users.find(u => u.role === (role || "student"));

        let userId = Date.now().toString();
        let createdAt = new Date().toISOString();

        if (existingUser) {
            if (!existingUser.isDeleted) {
                return res.status(409).json({ error: "Email already in use" });
            }
            // For a deleted user, restore their account (keep their ID)
            userId = existingUser.id;
            createdAt = existingUser.createdAt || createdAt;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName} `;

        const newUser = {
            ...existingUser,
            id: userId,
            name: fullName,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || "student",
            phone,
            dateOfBirth,
            gender,
            address,
            city,
            state,
            pincode,
            qualification,
            institute,
            parentName,
            parentPhone,
            emergencyContact,
            isVerified: false,
            provider: "local",
            isDeleted: false,
            createdAt,
            updatedAt: new Date().toISOString()
        };
        delete newUser.deletedAt;

        await docClient.send(new PutCommand({
            TableName: TABLES.USERS,
            Item: newUser,
        }));

        res.status(201).json({
            message: "User registered successfully",
            isVerified: false
        });
    } catch (error: any) {
        console.error("[Register] Error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/api/auth/login", loginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password, role, adminSecret } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (role === 'admin') {
        const isValid = await verifyAdminSecret(adminSecret);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid Admin Secret Code" });
        }
    }

    try {
        const users = await queryItems<any>(
            TABLES.USERS,
            "EmailIndex",
            "email = :email",
            { ":email": email }
        );
        const user = users.find(u => u.role === role);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (user.isDeleted) {
            return res.status(403).json({ error: "Your account has been deleted. Please register again to restore your account." });
        }

        if (user.provider === "local") {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
        }

        const sessionId = Date.now().toString();
        const updatedUser = { ...user, sessionId };
        await docClient.send(new PutCommand({
            TableName: TABLES.USERS,
            Item: updatedUser
        }));

        const jwtSecret = await getJwtSecret();
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, sessionId },
            jwtSecret,
            { expiresIn: "24h" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
        });
    } catch (error) {
        console.error("[Login] error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login Secure Verification
app.post("/api/auth/google", loginLimiter, async (req, res) => {
    const { credential, role, isSignup } = req.body;

    if (role === 'admin') {
        return res.status(403).json({ error: "Google login is restricted for administrators." });
    }

    try {
        // Verify the Google ID Token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ error: "Invalid Google token" });
        }

        const { email, name, sub } = payload;

        const users = await queryItems<any>(
            TABLES.USERS,
            "EmailIndex",
            "email = :email",
            { ":email": email }
        );
        const requestedRole = role || "student";
        const user = users.find((u: any) => u.role === requestedRole);

        if (user && user.isDeleted) {
            return res.status(403).json({ error: "Your account has been deleted. Please register again to restore your account." });
        }

        if (user && user.role && user.role.toLowerCase() === 'admin') {
            console.warn(`[Google Auth] SECURITY BLOCK: Admin user ${email} attempted login via Google OAuth(Requested Role: ${role})`);
            return res.status(403).json({ error: "Google login is strictly prohibited for administrator accounts for security reasons." });
        }

        if (!user) {
            // If user doesn't exist and it's a signup request, return the info to pre-fill the form
            if (isSignup) {
                return res.json({
                    user: { email, name, sub: sub, role: requestedRole }
                });
            }

            // For students logging in without an account, we still require registration
            if (requestedRole === "student") {
                return res.status(404).json({ error: "No student account found. Please register first." });
            }
        }

        const sessionId = Date.now().toString();
        const updatedUser = { ...user, sessionId };
        await docClient.send(new PutCommand({
            TableName: TABLES.USERS,
            Item: updatedUser
        }));

        const jwtSecret = await getJwtSecret();
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, sessionId },
            jwtSecret,
            { expiresIn: "24h" }
        );

        const { password: _, sessionId: __, ...safeUser } = updatedUser;
        res.json({ token, user: safeUser });
    } catch (error) {
        console.error("[Google Auth] Error:", error);
        res.status(500).json({ error: "Google auth failed" });
    }
});

// API Routes
app.use("/api/courses", coursesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/lectures", lecturesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/tests", testsRouter);
app.use("/api/results", resultsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/fees", feesRouter);
app.use("/api/chat", verifyToken, chatRouter);
app.use("/api/selected-students", selectedStudentsRouter);
app.use("/api/chapter-tests", chapterTestsRouter);
app.use("/api/videos", videosRouter);
app.use("/api/reviews", reviewsRouter);

// debug-secret endpoint removed for security

// Lecture Structure Config Endpoints
app.get("/api/config/lecture-structure", verifyToken, async (req, res) => {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { id: "LECTURE_STRUCTURE" }
        }));
        res.json(result.Item?.value || {
            Mathematics: { portions: [] },
            Reasoning: { portions: [] },
            Computer: { portions: [] }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch lecture structure" });
    }
});

app.post("/api/config/lecture-structure", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { structure } = req.body;
        await docClient.send(new PutCommand({
            TableName: TABLES.CONFIG,
            Item: {
                id: "LECTURE_STRUCTURE",
                value: structure,
                updatedAt: new Date().toISOString()
            }
        }));
        res.json({ message: "Lecture structure updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update lecture structure" });
    }
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/about", aboutRouter);
app.use("/api/terms", termsRouter);

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
// Trigger restart for new .env variables
