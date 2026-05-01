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

        // Fetch user details before creating the order
        const user = await getItem<any>(TABLES.USERS, { id: req.user.id });
        const purchaseDate = new Date().toISOString();

        const receipt = `rcpt_${Date.now().toString(36)}`.substring(0, 40);
        const order = await razorpay.orders.create({
            amount: priceInPaise,
            currency: "INR",
            receipt: receipt,
            payment_capture: 1 as any,
            notes: {
                // Student details
                studentName: user?.name || user?.firstName || req.user.email,
                studentEmail: user?.email || req.user.email,
                studentPhone: user?.phone || "N/A",
                // Course details
                courseId,
                courseName: course.title,
                coursePrice: `₹${course.price}`,
                // Purchase details
                purchaseDate,
                userId: req.user.id,
            },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            courseName: course.title,
            userName: user?.name || "",
            userEmail: user?.email || req.user.email || "",
            userPhone: user?.phone || "",
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
            console.error(`[Payment] Signature mismatch for order ${razorpay_order_id}. Expected: ${expectedSignature.substring(0,10)}... Got: ${razorpay_signature.substring(0,10)}...`);
            return res.status(400).json({ error: "Invalid payment signature. Payment verification failed." });
        }

        console.log(`[Payment] Signature verified for order ${razorpay_order_id}, payment ${razorpay_payment_id}`);

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

        // ── Update Razorpay payment notes with full purchase details ──────────
        try {
            const razorpay = getRazorpay();
            const student = await getItem<any>(TABLES.USERS, { id: req.user.id });
            if (razorpay && student) {
                await (razorpay.payments as any).edit(razorpay_payment_id, {
                    notes: {
                        studentName:  student.name || student.firstName || req.user.email,
                        studentEmail: student.email || req.user.email,
                        studentPhone: student.phone || "N/A",
                        courseName:   enrolledCourse?.title || "Unknown Course",
                        amountPaid:   `₹${amountInRupees}`,
                        purchaseDate: enrolledAt,
                        orderId:      razorpay_order_id,
                        paymentId:    razorpay_payment_id,
                    }
                });
                console.log(`[Payment] Razorpay notes updated for payment ${razorpay_payment_id}`);
            }
        } catch (noteErr: any) {
            // Non-fatal — enrollment already saved, just log the warning
            console.warn(`[Payment] Could not update Razorpay notes: ${noteErr.message}`);
        }

        res.json({ success: true, enrollment });
    } catch (error: any) {
        console.error("Verify payment error:", error);
        res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
});

// POST /api/payments/webhook
// Razorpay Webhook listener for delayed/background payment capture
router.post("/webhook", async (req: AuthRequest, res: Response) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.warn("[Webhook] Razorpay webhook called but no RAZORPAY_WEBHOOK_SECRET configured.");
            return res.status(400).json({ error: "Webhook secret not configured" });
        }

        const signature = req.headers["x-razorpay-signature"] as string;
        if (!signature) {
            return res.status(400).json({ error: "Missing signature" });
        }

        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(payload)
            .digest("hex");

        if (expectedSignature !== signature) {
            return res.status(400).json({ error: "Invalid webhook signature" });
        }

        const event = req.body.event;
        if (event === "order.paid" || event === "payment.captured") {
            const payment = req.body.payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id;
            const amountInRupees = payment.amount / 100;
            const notes = payment.notes || {};
            const courseId = notes.courseId;
            const userId = notes.userId;

            if (!courseId || !userId) {
                console.warn(`[Webhook] Ignored payment ${paymentId} - missing courseId or userId in notes`);
                return res.status(200).json({ status: "ignored" });
            }

            // Check if enrollment already exists (to prevent duplicates if frontend handler also fired)
            const existingEnrollments = await getAllItems<any>(TABLES.ENROLLMENTS, "orderId = :orderId", { ":orderId": orderId });
            if (existingEnrollments.length > 0) {
                console.log(`[Webhook] Enrollment for order ${orderId} already exists. Skipping.`);
                return res.status(200).json({ status: "already_processed" });
            }

            const enrolledCourse = await getItem<any>(TABLES.COURSES, { id: courseId });
            const enrolledAt = new Date().toISOString();

            const enrollment = {
                enrollmentId: generateId(),
                userId,
                courseId,
                enrolledAt,
                expiresAt: enrolledCourse ? parseDuration(enrolledCourse.duration) : null,
                status: "active",
                paymentId,
                orderId,
                amount: amountInRupees,
                batchId: "payment",
            };
            await createItem(TABLES.ENROLLMENTS, enrollment);

            const paymentRecord = {
                feeId: generateId("fee"),
                userId,
                courseId,
                description: `Payment for course: ${enrolledCourse?.title || 'Unknown Course'}`,
                amount: amountInRupees,
                status: "paid",
                category: "tuition",
                paymentId,
                orderId,
                paidAt: enrolledAt,
                createdAt: enrolledAt,
                createdBy: userId,
                dueDate: enrolledAt,
            };
            await createItem(TABLES.FEES, paymentRecord);

            console.log(`[Webhook] Successfully enrolled user ${userId} to course ${courseId} via webhook.`);
        }

        res.status(200).json({ status: "ok" });
    } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
});

export default router;
