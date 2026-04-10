import { Router } from "express";
import { maskEmail } from "../utils/maskEmail";
import { docClient, TABLES } from "../db-wrapper";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyToken } from "../middleware/auth";
import { sendOtpEmail } from "../index";

const router = Router();
const SUPER_ADMIN_EMAIL = process.env.VITE_SUPER_ADMIN_EMAIL!;
let termsOtpStore: { [key: string]: { otp: string, expires: number, attempts: number } } = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sanitize text input: strip HTML tags to prevent XSS
function sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<[^>]*>/g, '')  // Remove HTML tags
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')  // Decode common entities
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script blocks
        .trim();
}

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};

// GET /api/terms - Fetch the terms and conditions
router.get("/", async (req: any, res: any) => {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { id: "terms_and_conditions" }
        }));

        const item = result.Item || { sections: [], content: "" };
        res.json(item);
    } catch (error) {
        console.error("Error fetching terms:", error);
        res.status(500).json({ error: "Failed to fetch terms" });
    }
});

// POST /api/terms/update-otp - Request OTP to update terms
router.post("/update-otp", verifyToken, isAdmin, async (req: any, res: any) => {
    try {
        const otp = generateOTP();
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

        termsOtpStore["update_terms"] = { otp, expires, attempts: 0 };

        await sendOtpEmail(
            SUPER_ADMIN_EMAIL,
            otp,
            "OTP for Terms & Conditions Update - HCL Institute"
        );

        res.json({ message: `OTP sent to ${maskEmail(SUPER_ADMIN_EMAIL)}`, maskedEmail: maskEmail(SUPER_ADMIN_EMAIL) });
    } catch (error) {
        console.error("Error sending update terms OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// PUT /api/terms - Update the terms and conditions
router.put("/", verifyToken, isAdmin, async (req: any, res: any) => {
    try {
        const { sections, otp } = req.body;

        if (!otp) {
            return res.status(400).json({ error: "OTP is required to update terms and conditions." });
        }

        const storedOtpData = termsOtpStore["update_terms"];

        if (!storedOtpData) {
            return res.status(400).json({ error: "No OTP request found. Please request a new OTP." });
        }

        if (Date.now() > storedOtpData.expires) {
            delete termsOtpStore["update_terms"];
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Brute-force protection: max 5 attempts
        if (storedOtpData.attempts >= 5) {
            delete termsOtpStore["update_terms"];
            return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
        }

        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts += 1;
            return res.status(400).json({ error: "Invalid OTP." });
        }

        // OTP verified successfully, proceed with update
        delete termsOtpStore["update_terms"]; // clear OTP after successful use

        // Validate and sanitize sections data
        const rawSections = Array.isArray(sections) ? sections : [];
        const sanitizedSections = rawSections
            .filter((s: any) => s && typeof s === 'object')
            .map((s: any) => ({
                id: typeof s.id === 'string' ? s.id.substring(0, 50) : `sect_${Date.now()}`,
                heading: sanitizeText(String(s.heading || '')).substring(0, 200),
                content: sanitizeText(String(s.content || '')).substring(0, 10000),
            }));

        // Build a plain-text content from sections for backward compatibility
        const plainContent = sanitizedSections.map((s: any) => `${s.heading}\n${s.content}`).join("\n\n");

        const termsDoc = {
            id: "terms_and_conditions",
            sections: sanitizedSections,
            content: plainContent,
            updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.CONFIG,
            Item: termsDoc
        }));

        res.json(termsDoc);
    } catch (error) {
        console.error("Error updating terms:", error);
        res.status(500).json({ error: "Failed to update terms" });
    }
});

export default router;

