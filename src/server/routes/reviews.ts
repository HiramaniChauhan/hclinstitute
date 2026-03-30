import express from "express";
import { docClient, TABLES } from "../db-wrapper";
import { PutCommand, ScanCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { verifyToken, requireAdmin } from "../middleware/auth";

const router = express.Router();

async function checkValidEnrollment(userId: string): Promise<boolean> {
    const enrollmentResult = await docClient.send(new ScanCommand({
        TableName: TABLES.ENROLLMENTS,
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId }
    }));
    if (!enrollmentResult.Items || enrollmentResult.Items.length === 0) return false;

    const coursesResult = await docClient.send(new ScanCommand({
        TableName: TABLES.COURSES
    }));
    const existingCourseIds = new Set((coursesResult.Items || []).map((c: any) => c.id));

    return enrollmentResult.Items.some((e: any) =>
        e.status === "active" && e.courseId && existingCourseIds.has(e.courseId)
    );
}

// Get questions (Admin can see all, others see active only)
router.get("/questions", verifyToken, async (req: any, res) => {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.REVIEW_QUESTIONS,
        }));

        let questions = result.Items || [];
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
router.post("/questions", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id, text, type, isActive } = req.body;

        if (!text || !type) {
            return res.status(400).json({ error: "Text and type are required" });
        }

        const questionId = id || Date.now().toString();

        // For edits, we might need to get existing to preserve createdAt
        let createdAt = new Date().toISOString();
        if (id) {
            const existing = await docClient.send(new GetCommand({
                TableName: TABLES.REVIEW_QUESTIONS,
                Key: { id }
            }));
            if (existing.Item?.createdAt) {
                createdAt = existing.Item.createdAt;
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

        await docClient.send(new PutCommand({
            TableName: TABLES.REVIEW_QUESTIONS,
            Item: question,
        }));

        res.json({ message: id ? "Question updated" : "Question created", question });
    } catch (error) {
        console.error("Error saving review question:", error);
        res.status(500).json({ error: "Failed to save review question" });
    }
});

// Admin: Delete a review question
router.delete("/questions/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.REVIEW_QUESTIONS,
            Key: { id: req.params.id },
        }));
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

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.REVIEWS,
            FilterExpression: "studentId = :studentId",
            ExpressionAttributeValues: { ":studentId": req.user.id }
        }));
        res.json(result.Items?.[0] || null);
    } catch (error) {
        console.error("Error fetching my review:", error);
        res.status(500).json({ error: "Failed to fetch your review" });
    }
});

// Student: Submit a review
router.post("/", verifyToken, async (req: any, res) => {
    try {
        const { targetId, targetType, answers, overallRating, comment } = req.body;
        const studentId = req.user.id;

        if (!targetId || !targetType || !answers || !overallRating) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Fetch student details to store with review
        const userResult = await docClient.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { id: studentId }
        }));
        const user = userResult.Item;

        const isValid = await checkValidEnrollment(studentId);
        if (!isValid) {
            return res.status(403).json({ error: "Only actively enrolled students can submit a review" });
        }

        // Check if review already exists
        const existingResult = await docClient.send(new ScanCommand({
            TableName: TABLES.REVIEWS,
            FilterExpression: "studentId = :studentId",
            ExpressionAttributeValues: { ":studentId": studentId }
        }));

        let reviewId = Date.now().toString();
        let createdAt = new Date().toISOString();
        if (existingResult.Items && existingResult.Items.length > 0) {
            reviewId = existingResult.Items[0].id;
            createdAt = existingResult.Items[0].createdAt;
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

        await docClient.send(new PutCommand({
            TableName: TABLES.REVIEWS,
            Item: review,
        }));

        res.status(201).json({ message: "Review saved successfully", review });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

// Public: Get reviews for Home Page
router.get("/public", async (req, res) => {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.REVIEWS,
        }));

        const qResult = await docClient.send(new ScanCommand({
            TableName: TABLES.REVIEW_QUESTIONS,
        }));
        const questions = qResult.Items || [];
        const qMap = new Map();
        questions.forEach(q => qMap.set(q.id, q.type));

        // Fetch users to filter out reviews from softly or permanently deleted students
        const usersResult = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS
        }));
        const activeUsers = new Set((usersResult.Items || [])
            .filter((u: any) => u.isActive !== false)
            .map((u: any) => u.id)
        );

        let reviews = result.Items || [];

        // Discard reviews from deleted or inactive users
        reviews = reviews.filter((r: any) => activeUsers.has(r.studentId));

        reviews.forEach((r: any) => {
            if (r.answers) {
                // Filter out answers for deleted target criteria
                r.answers = r.answers.filter((ans: any) => qMap.has(ans.questionId));
                r.answers.forEach((ans: any) => {
                    ans.questionText = qMap.get(ans.questionId);
                });
            }
        });

        // Sort highest overallRating first, then descending by created date
        reviews.sort((a, b) => {
            if (b.overallRating !== a.overallRating) {
                return (b.overallRating || 0) - (a.overallRating || 0);
            }
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching public reviews:", error);
        res.status(500).json({ error: "Failed to fetch public reviews" });
    }
});

// Get reviews for a specific target (test or lecture)
router.get("/target/:targetId", verifyToken, async (req, res) => {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.REVIEWS,
            FilterExpression: "targetId = :targetId",
            ExpressionAttributeValues: { ":targetId": req.params.targetId }
        }));

        let reviews = result.Items || [];

        // Fetch users to filter out reviews from softly or permanently deleted students
        const usersResult = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS
        }));
        const activeUsers = new Set((usersResult.Items || [])
            .filter((u: any) => u.isActive !== false)
            .map((u: any) => u.id)
        );

        // Discard reviews from deleted or inactive users
        reviews = reviews.filter((r: any) => activeUsers.has(r.studentId));

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

        const existingResult = await docClient.send(new GetCommand({
            TableName: TABLES.REVIEWS,
            Key: { id: req.params.id }
        }));

        if (!existingResult.Item) {
            return res.status(404).json({ error: "Review not found" });
        }

        const updatedReview = {
            ...existingResult.Item,
            overallRating,
            comment
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.REVIEWS,
            Item: updatedReview
        }));

        res.json({ message: "Review updated successfully", review: updatedReview });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: "Failed to update review" });
    }
});

// Admin: Delete a review
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.REVIEWS,
            Key: { id: req.params.id }
        }));
        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: "Failed to delete review" });
    }
});

export default router;
