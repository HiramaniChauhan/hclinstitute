import dotenv from "dotenv";
dotenv.config();
import { ADMIN_SECRET } from "./constants";

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { docClient, TABLES, isMemory } from "./db-wrapper";
import { PutCommand, ScanCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { errorHandler } from "./middleware/errorHandler";
import { verifyToken, requireAdmin, JWT_SECRET } from "./middleware/auth";
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
import attendanceRouter from "./routes/attendance";
import feesRouter from "./routes/fees";
import chatRouter from "./routes/chat";
import selectedStudentsRouter from "./routes/selected-students";
import chapterTestsRouter from "./routes/chapter-tests";
import videosRouter from "./routes/videos";

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper for OTP generation
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Email Setup 
let testAccountInfo: any = null;
export const sendOtpEmail = async (toEmail: string, otp: string, subject: string) => {
    try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'noreply@hclins.com';
        const senderName = 'HCL Institute';

        // 1. Try Brevo REST API (Preferred - bypasses SMTP blocking)
        if (process.env.BREVO_API_KEY) {
            console.log(`[Email] Attempting Brevo REST API to ${toEmail}`);
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY
                },
                body: JSON.stringify({
                    sender: { email: senderEmail, name: senderName },
                    to: [{ email: toEmail }],
                    subject,
                    htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>HCL Institute Secure Access</h2>
                            <p>Your One-Time Password (OTP) is:</p>
                            <h1 style="color: #4f46e5; letter-spacing: 2px;">${otp}</h1>
                            <p>It is valid for 10 minutes. Please do not share this code.</p>
                           </div>`
                })
            });

            if (response.ok) {
                console.log(`[Email Sent] Brevo REST API: ${toEmail}`);
                return true;
            } else {
                const errorData = await response.json();
                console.error("[Email Error] Brevo REST API failed:", errorData);
                // Fall through to SMTP if REST fails? No, usually REST is more reliable.
            }
        }

        // 2. Fallback to SMTP
        if (process.env.SMTP_USER) {
            console.log(`[Email] Attempting SMTP to ${toEmail}`);
            const host = process.env.SMTP_HOST;
            const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
            const secure = port === 465;
            const auth = {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            };

            const transporter = nodemailer.createTransport({ host, port, secure, auth } as any);
            await transporter.sendMail({
                from: `"${senderName}" <${senderEmail}>`,
                to: toEmail,
                subject,
                text: `Your One-Time Password (OTP) is: ${otp}\n\nIt is valid for 10 minutes.`,
                html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>HCL Institute Secure Access</h2>
                        <p>Your One-Time Password (OTP) is:</p>
                        <h1 style="color: #4f46e5; letter-spacing: 2px;">${otp}</h1>
                        <p>It is valid for 10 minutes. Please do not share this code.</p>
                       </div>`
            });
            console.log(`[Email Sent] SMTP: ${toEmail}`);
            return true;
        }

        // 3. Last resort: Mock logging
        console.log("-----------------------------------------");
        console.log("No Email Config found, showing Mock OTP");
        console.log(`[Mock Email] To: ${toEmail} | Subject: ${subject}`);
        console.log(`[Mock Email] OTP: ${otp}`);
        console.log("-----------------------------------------");
        return true;
    } catch (error) {
        console.error("Failed to send OTP Email:", error);
        return false;
    }
};

// OTP Endpoints
// Forgot Password Endpoints
app.post("/api/auth/forgot-password/request", async (req, res) => {
    const { email, role } = req.body;

    try {
        // Check if user exists
        const scanResult = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS,
            FilterExpression: "email = :email AND #r = :role",
            ExpressionAttributeValues: { ":email": email, ":role": role },
            ExpressionAttributeNames: { "#r": "role" }
        }));

        if (!scanResult.Items || scanResult.Items.length === 0) {
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

app.post("/api/auth/forgot-password/verify", async (req, res) => {
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

app.post("/api/auth/forgot-password/reset", async (req, res) => {
    const { email, otp, newPassword, role } = req.body;

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

        // Get user
        const scanResult = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS,
            FilterExpression: "email = :email AND #r = :role",
            ExpressionAttributeValues: { ":email": email, ":role": role },
            ExpressionAttributeNames: { "#r": "role" }
        }));

        const user = scanResult.Items?.[0];
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

app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;

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

        const isSent = await sendOtpEmail(email, otp, "Registration OTP - HCL Institute");
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

app.post("/api/auth/verify-otp", async (req, res) => {
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
const ADMIN_AUTHORIZED_EMAIL = "hiramanichauhan2399@gmail.com";

app.post("/api/auth/admin-secret-otp", async (req, res) => {
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
            message: "Admin OTP sent successfully"
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to send Admin OTP" });
    }
});

app.post("/api/auth/update-admin-secret", async (req, res) => {
    const { email, otp, newSecret } = req.body;
    if (email !== ADMIN_AUTHORIZED_EMAIL) {
        return res.status(403).json({ error: "Unauthorized email" });
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
                key: "ADMIN_SECRET",
                value: newSecret,
                updatedAt: new Date().toISOString()
            }
        }));

        res.json({ message: "Admin secret updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

// Helper to check Admin Secret
async function verifyAdminSecret(providedSecret: string): Promise<boolean> {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { key: "ADMIN_SECRET" }
        }));
        const storedSecret = result.Item?.value;
        const expectedSecret = storedSecret || ADMIN_SECRET;

        if (!expectedSecret) {
            console.warn("[Admin Auth] CRITICAL: No ADMIN_SECRET configured in DB or .env!");
            return false;
        }

        const isValid = providedSecret === expectedSecret;
        if (!isValid) {
            console.warn(`[Admin Auth] Secret mismatch. Provided: ${providedSecret}, Expected: ${expectedSecret}`);
        }
        return isValid;
    } catch (error) {
        console.error("[Admin Auth] Error verifying secret:", error);
        return false;
    }
}

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
    const {
        firstName, lastName, email, password, role, aadharNumber, tenthResultName, adminSecret,
        phone, dateOfBirth, gender, address, city, state, pincode,
        qualification, institute, parentName, parentPhone, emergencyContact
    } = req.body;

    if (role === "admin") {
        console.log(`[Register] Verifying Admin Secret for ${email}`);
        const isValidAdmin = await verifyAdminSecret(adminSecret);
        if (!isValidAdmin) {
            return res.status(401).json({ error: "Invalid Admin Secret Code" });
        }
    }

    try {
        console.log(`[Register] Request for ${email} as ${role}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString();
        const fullName = `${firstName} ${lastName}`;

        // Auto-verify if name matches tenthResultName (simulated logic)
        const isVerified = tenthResultName && tenthResultName.toLowerCase().includes(fullName.toLowerCase());

        const newUser = {
            id: userId,
            name: fullName,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || "student",
            aadharNumber,
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
            isVerified: !!isVerified,
            provider: "local",
            createdAt: new Date().toISOString(),
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.USERS,
            Item: newUser,
        }));

        console.log(`[Register] Success: ${email} registered as ${role}`);
        res.status(201).json({
            message: "User registered successfully",
            isVerified: !!isVerified
        });
    } catch (error: any) {
        console.error("[Register] Error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password, role, adminSecret } = req.body;
    console.log(`[Login] Attempt: ${email} as ${role}`);

    if (role === 'admin') {
        const isValid = await verifyAdminSecret(adminSecret);
        if (!isValid) {
            console.log(`[Login] Failure: Admin Secret mismatch for ${email}`);
            return res.status(401).json({ error: "Invalid Admin Secret Code" });
        }
    }

    try {
        const scanResult = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS,
            FilterExpression: "email = :email AND #r = :role",
            ExpressionAttributeValues: { ":email": email, ":role": role },
            ExpressionAttributeNames: { "#r": "role" }
        }));

        const user = scanResult.Items?.[0];

        if (!user) {
            console.log(`[Login] Failure: User not found for ${email} with role ${role}`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (user.provider === "local") {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log(`[Login] Failure: Password mismatch for ${email}`);
                return res.status(401).json({ error: "Invalid credentials" });
            }
        }

        console.log(`[Login] Sign Check:
            Secret Length: ${JWT_SECRET.length}
            Signing with payload: ${{ id: user.id, role: user.role }}
            Time: ${new Date().toISOString()}
        `);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );
        console.log("[Login] Token Signed. Start:", token.substring(0, 10));

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

// Google Login Mock
app.post("/api/auth/google", async (req, res) => {
    const { email, name, sub, role, adminSecret, isSignup } = req.body;
    console.log(`[Google Auth] Attempt: ${email} as ${role} (isSignup: ${isSignup})`);

    if (role === 'admin') {
        const isValidAdmin = await verifyAdminSecret(adminSecret);
        if (!isValidAdmin) {
            return res.status(401).json({ error: "Invalid Admin Secret Code" });
        }
    }

    try {
        const scanResult = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: { ":email": email },
        }));

        let user = scanResult.Items?.[0];
        const requestedRole = role || "student";

        if (!user) {
            // If user doesn't exist and it's a signup request, return the info to pre-fill the form
            if (isSignup) {
                console.log(`[Google Auth] User not found, returning profile for signup: ${email}`);
                return res.json({
                    user: { email, name, sub, role: requestedRole }
                });
            }

            // For students logging in without an account, we still require registration
            if (requestedRole === "student") {
                console.log(`[Google Auth] Student account not found: ${email}`);
                return res.status(404).json({ error: "No student account found. Please register first." });
            }

            // For admins (or other cases if added), we can auto-register if the secret is valid
            console.log(`[Google Auth] Creating new admin account via Google: ${email}`);
            user = {
                id: sub,
                name,
                email,
                role: requestedRole,
                provider: "google",
                createdAt: new Date().toISOString(),
                isVerified: requestedRole === 'admin' // Admins verified by secret key
            };
            await docClient.send(new PutCommand({
                TableName: TABLES.USERS,
                Item: user,
            }));
        }

        console.log(`[Google Auth] Success: ${email} authenticated as ${user.role}`);
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token, user });
    } catch (error) {
        console.error("[Google Auth] Error:", error);
        res.status(500).json({ error: "Google auth failed" });
    }
});

// API Routes
app.use("/api/courses", coursesRouter);
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
app.use("/api/attendance", attendanceRouter);
app.use("/api/fees", feesRouter);
app.use("/api/chat", verifyToken, chatRouter);
app.use("/api/selected-students", selectedStudentsRouter);
app.use("/api/chapter-tests", chapterTestsRouter);
app.use("/api/videos", videosRouter);

app.get("/api/auth/debug-secret", (req, res) => {
    res.json({
        secretStart: JWT_SECRET.substring(0, 4),
        envSecretStart: process.env.JWT_SECRET?.substring(0, 4) || "MISSING",
        nodeEnv: process.env.NODE_ENV || "not set"
    });
});

// Lecture Structure Config Endpoints
app.get("/api/config/lecture-structure", async (req, res) => {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { key: "LECTURE_STRUCTURE" }
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
                key: "LECTURE_STRUCTURE",
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

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
// Trigger restart for new .env variables
