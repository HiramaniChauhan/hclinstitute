import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { verifyToken, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

const router = Router();

// Duration is stored as a plain integer = number of months
// e.g. 6 = 6 months, 12 = 1 year, 24 = 2 years
export const parseDuration = (duration: string | number, fromDate: Date = new Date()): string | null => {
    const months = parseInt(String(duration));
    if (isNaN(months) || months <= 0) return null;
    const date = new Date(fromDate);
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
};

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId === "your_razorpay_key_id_here") {
        return null;
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// POST /api/payments/create-order
// Creates a Razorpay order for a given course
router.post("/create-order", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { courseId } = req.body;
        if (!courseId) return res.status(400).json({ error: "courseId is required" });

        // Fetch the course to get the price
        const course = await getItem<any>(TABLES.COURSES, { id: courseId });
        if (!course) return res.status(404).json({ error: "Course not found" });

        const priceInPaise = Math.round(Number(course.price) * 100); // Razorpay uses paise

        // Free course — skip payment, enroll directly
        if (priceInPaise === 0) {
            const enrolledAt = new Date().toISOString();
            const enrollment = {
                enrollmentId: generateId(),
                userId: req.user.id,
                courseId,
                enrolledAt,
                expiresAt: parseDuration(course.duration) || null,
                status: "active",
                paymentId: "free",
                amount: 0,
                batchId: "direct",
            };
            await createItem(TABLES.ENROLLMENTS, enrollment);

            // Create a $0 fee record for free enrollment
            const feeRecord = {
                feeId: generateId("fee"),
                userId: req.user.id,
                courseId,
                description: `Free Enrollment: ${course.title}`,
                amount: 0,
                status: "paid",
                category: "tuition" as const,
                paymentId: "free",
                createdAt: enrolledAt,
                createdBy: req.user.id,
                dueDate: enrolledAt,
                paidAt: enrolledAt,
            };
            await createItem(TABLES.FEES, feeRecord);

            return res.json({ free: true, enrollment });
        }

        const razorpay = getRazorpay();
        if (!razorpay) {
            return res.status(503).json({ error: "Payment gateway not configured. Please add Razorpay API keys to your .env file." });
        }

        const receipt = `rcpt_${Date.now().toString(36)}`.substring(0, 40);
        const order = await razorpay.orders.create({
            amount: priceInPaise,
            currency: "INR",
            receipt: receipt,
            notes: {
                courseId,
                userId: req.user.id,
                courseName: course.title,
            },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            courseName: course.title,
        });
    } catch (error: any) {
        console.error("Create order error:", error);
        res.status(500).json({ error: error.message || "Failed to create order" });
    }
});

// POST /api/payments/verify
// Verifies Razorpay payment signature and enrolls the student
router.post("/verify", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
            return res.status(400).json({ error: "Missing payment verification fields" });
        }

        // Verify HMAC signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid payment signature. Payment verification failed." });
        }

        // Create enrollment record with expiry based on course duration
        const enrolledCourse = await getItem<any>(TABLES.COURSES, { id: courseId });
        const enrolledAt = new Date().toISOString();
        const amountInRupees = Number(req.body.amount) / 100; // Razorpay uses paise, we store rupees

        const enrollment = {
            enrollmentId: generateId(),
            userId: req.user.id,
            courseId,
            enrolledAt,
            expiresAt: enrolledCourse ? parseDuration(enrolledCourse.duration) : null,
            status: "active",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: amountInRupees,
            batchId: "payment",
        };
        await createItem(TABLES.ENROLLMENTS, enrollment);

        // Log payment record
        const paymentRecord = {
            feeId: generateId("fee"),
            userId: req.user.id,
            courseId,
            description: `Payment for course: ${enrolledCourse?.title || 'Unknown Course'}`,
            amount: amountInRupees,
            status: "paid",
            category: "tuition",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paidAt: enrolledAt,
            createdAt: enrolledAt,
            createdBy: req.user.id,
            dueDate: enrolledAt,
        };
        await createItem(TABLES.FEES, paymentRecord);

        res.json({ success: true, enrollment });
    } catch (error: any) {
        console.error("Verify payment error:", error);
        res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
});

export default router;
