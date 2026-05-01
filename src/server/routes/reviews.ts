import express from "express";
import { TABLES } from "../db-wrapper";
import { verifyToken, requireAdmin } from "../middleware/auth";
import { getAllItems, getItem, createItem, deleteItem, queryByField } from "../utils/db-helpers";
import { validate, submitReviewSchema, reviewQuestionSchema } from "../middleware/validate";

const router = express.Router();

async function checkValidEnrollment(userId: string): Promise<boolean> {
    const enrollments = await queryByField<any>(TABLES.ENROLLMENTS, "userId", userId);
    if (!enrollments || enrollments.length === 0) return false;

    const courses = await getAllItems<any>(TABLES.COURSES);
    const existingCourseIds = new Set(courses.map((c: any) => c.id));

    return enrollments.some((e: any) =>
        e.status === "active" && e.courseId && existingCourseIds.has(e.courseId)
    );
}

// Get questions (Admin can see all, others see active only)
router.get("/questions", verifyToken, async (req: any, res) => {
    try {
        let questions = await getAllItems<any>(TABLES.REVIEW_QUESTIONS);

        if (req.user.role !== 'admin') {
            const isValid = await checkValidEnrollment(req.user.id);
            if (!isValid) {
                return res.status(403).json({ error: "Not enrolled in any active courses" });
            }
            questions = questions.filter((q: any) => q.isActive !== false);
        }

        res.json(questions);
    } catch (error) {
        console.error("Error fetching review questions:", error);
        res.status(500).json({ error: "Failed to fetch review questions" });
    }
});

// Admin: Create or update a review question
router.post("/questions", verifyToken, requireAdmin, validate(reviewQuestionSchema), async (req, res) => {
    try {
        const { id, text, type, isActive } = req.body;

        if (!text || !type) {
            return res.status(400).json({ error: "Text and type are required" });
        }

        const questionId = id || Date.now().toString();

        let createdAt = new Date().toISOString();
        if (id) {
            const existing = await getItem<any>(TABLES.REVIEW_QUESTIONS, { id });
            if (existing?.createdAt) {
                createdAt = existing.createdAt;
            }
        }

        const question = {
            id: questionId,
            text,
            type, // 'test' | 'lecture'
            isActive: isActive !== false,
            createdAt,
            updatedAt: new Date().toISOString()
        };

        await createItem(TABLES.REVIEW_QUESTIONS, question);
        res.json({ message: id ? "Question updated" : "Question created", question });
    } catch (error) {
        console.error("Error saving review question:", error);
        res.status(500).json({ error: "Failed to save review question" });
    }
});

// Admin: Delete a review question
router.delete("/questions/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await deleteItem(TABLES.REVIEW_QUESTIONS, { id: req.params.id });
        res.json({ message: "Question deleted successfully" });
    } catch (error) {
        console.error("Error deleting review question:", error);
        res.status(500).json({ error: "Failed to delete review question" });
    }
});

// Student: Get their own review
router.get("/mine", verifyToken, async (req: any, res) => {
    try {
        if (req.user.role !== 'admin') {
            const isValid = await checkValidEnrollment(req.user.id);
            if (!isValid) {
                return res.status(403).json({ error: "Not enrolled in any active courses" });
            }
        }

        const reviews = await queryByField<any>(TABLES.REVIEWS, "studentId", req.user.id);
        res.json(reviews?.[0] || null);
    } catch (error) {
        console.error("Error fetching my review:", error);
        res.status(500).json({ error: "Failed to fetch your review" });
    }
});

// Student: Submit a review
router.post("/", verifyToken, validate(submitReviewSchema), async (req: any, res) => {
    try {
        const { targetId, targetType, answers, overallRating, comment } = req.body;
        const studentId = req.user.id;

        if (!targetId || !targetType || !answers || !overallRating) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Fetch student details to store with review
        const user = await getItem<any>(TABLES.USERS, { id: studentId });

        const isValid = await checkValidEnrollment(studentId);
        if (!isValid) {
            return res.status(403).json({ error: "Only actively enrolled students can submit a review" });
        }

        // Check if review already exists
        const existingReviews = await queryByField<any>(TABLES.REVIEWS, "studentId", studentId);

        let reviewId = Date.now().toString();
        let createdAt = new Date().toISOString();
        if (existingReviews && existingReviews.length > 0) {
            reviewId = existingReviews[0].id;
            createdAt = existingReviews[0].createdAt;
        }

        const review = {
            id: reviewId,
            studentId,
            studentName: user ? user.name : "Anonymous",
            targetId,
            targetType,
            answers, // Array of { questionId, rating }
            overallRating,
            comment,
            createdAt
        };

        await createItem(TABLES.REVIEWS, review);
        res.status(201).json({ message: "Review saved successfully", review });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

// Public: Get reviews for Home Page
router.get("/public", async (req, res) => {
    try {
        const [reviews, questions, users] = await Promise.all([
            getAllItems<any>(TABLES.REVIEWS),
            getAllItems<any>(TABLES.REVIEW_QUESTIONS),
            getAllItems<any>(TABLES.USERS),
        ]);

        const qMap = new Map();
        questions.forEach(q => qMap.set(q.id, q.type));

        const activeUsers = new Set(
            users.filter((u: any) => u.isActive !== false).map((u: any) => u.id)
        );

        let filteredReviews = reviews.filter((r: any) => activeUsers.has(r.studentId));

        filteredReviews.forEach((r: any) => {
            if (r.answers) {
                r.answers = r.answers.filter((ans: any) => qMap.has(ans.questionId));
                r.answers.forEach((ans: any) => {
                    ans.questionText = qMap.get(ans.questionId);
                });
            }
        });

        // Sort highest overallRating first, then descending by created date
        filteredReviews.sort((a, b) => {
            if (b.overallRating !== a.overallRating) {
                return (b.overallRating || 0) - (a.overallRating || 0);
            }
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        res.json(filteredReviews);
    } catch (error) {
        console.error("Error fetching public reviews:", error);
        res.status(500).json({ error: "Failed to fetch public reviews" });
    }
});

// Get reviews for a specific target (test or lecture)
router.get("/target/:targetId", verifyToken, async (req, res) => {
    try {
        const [allReviews, users] = await Promise.all([
            queryByField<any>(TABLES.REVIEWS, "targetId", req.params.targetId),
            getAllItems<any>(TABLES.USERS),
        ]);

        const activeUsers = new Set(
            users.filter((u: any) => u.isActive !== false).map((u: any) => u.id)
        );

        const reviews = allReviews.filter((r: any) => activeUsers.has(r.studentId));
        res.json(reviews);
    } catch (error) {
        console.error("Error fetching target reviews:", error);
        res.status(500).json({ error: "Failed to fetch target reviews" });
    }
});

// Admin: Edit a review
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { overallRating, comment } = req.body;

        const existing = await getItem<any>(TABLES.REVIEWS, { id: req.params.id });
        if (!existing) {
            return res.status(404).json({ error: "Review not found" });
        }

        const updatedReview = { ...existing, overallRating, comment };
        await createItem(TABLES.REVIEWS, updatedReview);

        res.json({ message: "Review updated successfully", review: updatedReview });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: "Failed to update review" });
    }
});

// Admin: Delete a review
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await deleteItem(TABLES.REVIEWS, { id: req.params.id });
        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: "Failed to delete review" });
    }
});

export default router;
