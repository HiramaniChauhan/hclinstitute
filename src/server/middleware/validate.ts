import { z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Express middleware factory — validates req.body against a Zod schema.
 * Returns 400 with detailed errors if validation fails.
 */
export function validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map(e => ({
                field: e.path.join("."),
                message: e.message,
            }));
            return res.status(400).json({ error: "Validation failed", details: errors });
        }
        req.body = result.data; // Replace with cleaned data (strips unknown fields)
        next();
    };
}

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email format").max(200),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    phone: z.string().max(20).optional(),
    role: z.enum(["student", "admin"]).optional().default("student"),
    adminSecret: z.string().optional(),
    aadharNumber: z.string().max(20).optional(),
    aadharPhoto: z.string().optional(),
    marksheet10th: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["student", "admin"]).optional(),
    adminSecret: z.string().optional(),
});

export const otpRequestSchema = z.object({
    email: z.string().email("Invalid email format"),
    purpose: z.string().max(100).optional(),
});

export const otpVerifySchema = z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters").max(128),
});

// ─── Chat Schema ──────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
    studentId: z.string().max(100).optional(),
    text: z.string().min(1, "Message text is required").max(5000),
    type: z.enum(["text", "image", "file"]).optional().default("text"),
    attachmentUrl: z.string().url().optional().nullable(),
});

// ─── Fee Schema ───────────────────────────────────────────────────────────────

export const createFeeSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    amount: z.number().positive("Amount must be positive").max(10000000),
    description: z.string().min(1).max(500),
    dueDate: z.string().min(1, "Due date is required"),
    category: z.string().max(100).optional(),
});

// ─── Notification Schema ──────────────────────────────────────────────────────

export const broadcastSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    message: z.string().min(1, "Message is required").max(2000),
    type: z.string().max(50).optional(),
});

// ─── Review Schema ────────────────────────────────────────────────────────────

export const submitReviewSchema = z.object({
    targetId: z.string().min(1),
    targetType: z.string().min(1),
    answers: z.array(z.object({
        questionId: z.string(),
        rating: z.number().min(1).max(5),
    })).min(1, "At least one answer is required"),
    overallRating: z.number().min(1).max(5),
    comment: z.string().max(2000).optional(),
});

export const reviewQuestionSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1, "Question text is required").max(500),
    type: z.enum(["test", "lecture"]),
    isActive: z.boolean().optional().default(true),
});

// ─── Course Schema ────────────────────────────────────────────────────────────

export const createCourseSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    price: z.number().min(0).optional().default(0),
    duration: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    image: z.string().optional(),
}).passthrough(); // Allow extra fields for flexibility

// ─── Test Schema ──────────────────────────────────────────────────────────────

export const createTestSchema = z.object({
    title: z.string().min(1, "Title is required").max(300),
    courseId: z.string().optional(),
    duration: z.number().positive().optional(),
    totalMarks: z.number().positive().optional(),
    passingMarks: z.number().min(0).optional(),
}).passthrough(); // Tests have dynamic question structures
