import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db";
import { Response } from "express";

const router = Router();

interface ResultData {
    resultId: string;
    userId: string;
    testId: string;
    courseId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    status: "passed" | "failed";
    submittedAt: string;
    duration: number;
    userAnswers?: Record<string, number>;
}

// GET results for current user
router.get("/my-results", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const results = await getAllItems<ResultData>(
            TABLES.RESULTS,
            "userId = :userId",
            { ":userId": req.user.id }
        );

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET results for test (Admin only)
router.get("/test/:testId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;
        const results = await getAllItems<ResultData>(
            TABLES.RESULTS,
            "begins_with(resultId, :testId)",
            { ":testId": testId }
        );

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET all results (Admin only)
router.get("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const results = await getAllItems<ResultData>(TABLES.RESULTS);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET result by ID
router.get("/:resultId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { resultId } = req.params;
        const result = await getItem<ResultData>(TABLES.RESULTS, { resultId });

        if (!result) {
            return res.status(404).json({ error: "Result not found" });
        }

        // Only allow user to view their own results or admins
        if (req.user?.id !== result.userId && req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST submit test result
router.post("/", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { testId, courseId, score, totalQuestions, correctAnswers, incorrectAnswers, duration, userAnswers } = req.body;

        if (score === undefined || totalQuestions === undefined || correctAnswers === undefined || !testId) {
            return res.status(400).json({ error: "Missing required fields: score, totalQuestions, correctAnswers, testId" });
        }

        // Limit to 2 attempts for ANY test
        const existingResults = await getAllItems<ResultData>(
            TABLES.RESULTS,
            "userId = :userId AND testId = :testId",
            { ":userId": req.user.id, ":testId": testId }
        );

        if (existingResults.length >= 2) {
            return res.status(403).json({
                error: "Maximum attempts reached for this test (Max 2 allowed)."
            });
        }

        const test = await getItem<any>(TABLES.TESTS, { testId });
        const finalCourseId = courseId || test?.subject || "General";
        const finalDuration = duration || 0;

        const percentage = (correctAnswers / totalQuestions) * 100;
        const status = percentage >= (test?.passingScore || 40) ? "passed" : "failed";

        const result: ResultData = {
            resultId: generateId("result"),
            userId: req.user.id,
            testId,
            courseId: finalCourseId,
            score: Number(score.toFixed(2)),
            totalQuestions,
            correctAnswers,
            percentage: Number(percentage.toFixed(2)),
            status,
            submittedAt: new Date().toISOString(),
            duration: Math.round(finalDuration),
            userAnswers: userAnswers || {}
        };

        await createItem(TABLES.RESULTS, result);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET performance analytics (Admin only)
router.get("/analytics/performance", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const results = await getAllItems<ResultData>(TABLES.RESULTS);

        const passedCount = results.filter(r => r.status === "passed").length;
        const failedCount = results.filter(r => r.status === "failed").length;
        const avgPercentage = results.length > 0
            ? Number((results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2))
            : 0;

        const coursePerformance: Record<string, any> = {};
        results.forEach(result => {
            if (!coursePerformance[result.courseId]) {
                coursePerformance[result.courseId] = { passed: 0, failed: 0, avgPercentage: 0, count: 0 };
            }
            if (result.status === "passed") coursePerformance[result.courseId].passed++;
            else coursePerformance[result.courseId].failed++;
            coursePerformance[result.courseId].avgPercentage += result.percentage;
            coursePerformance[result.courseId].count++;
        });

        Object.keys(coursePerformance).forEach(courseId => {
            coursePerformance[courseId].avgPercentage = Number(
                (coursePerformance[courseId].avgPercentage / coursePerformance[courseId].count).toFixed(2)
            );
        });

        res.json({
            totalResults: results.length,
            passedCount,
            failedCount,
            passPercentage: Number(((passedCount / results.length) * 100).toFixed(2)) || 0,
            avgPercentage,
            coursePerformance
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET leaderboard for a specific test
router.get("/leaderboard/:testId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;

        // 1. Get all results for this test
        const allResults = await getAllItems<ResultData>(
            TABLES.RESULTS,
            "testId = :testId",
            { ":testId": testId }
        );

        if (allResults.length === 0) {
            return res.json({ leaderboard: [], userRank: null, totalParticipants: 0 });
        }

        // 2. Filter for BEST result per unique student (highest score, then lowest duration)
        const bestResultsByUser: Record<string, ResultData> = {};
        allResults.forEach(res => {
            const existing = bestResultsByUser[res.userId];
            if (!existing ||
                res.score > existing.score ||
                (res.score === existing.score && res.duration < existing.duration)) {
                bestResultsByUser[res.userId] = res;
            }
        });

        const uniqueResults = Object.values(bestResultsByUser);

        // 3. Sort unique results: Score (desc), then duration (asc)
        const sortedResults = uniqueResults.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.duration - b.duration;
        });

        // 4. Get unique user details for the top participants
        const allUsers = await getAllItems<any>(TABLES.USERS);
        const userMap = allUsers.reduce((acc: any, u: any) => {
            acc[u.id || u.userId] = u.name || "Anonymous Student";
            return acc;
        }, {});

        // 5. Map to leaderboard format
        const leaderboard = sortedResults.map((r, index) => ({
            rank: index + 1,
            name: userMap[r.userId] || "Anonymous",
            score: r.score,
            percentage: r.percentage,
            duration: r.duration,
            userId: r.userId,
            isCurrentUser: r.userId === req.user?.id
        }));

        // 6. Find current user's best rank
        const userRankEntry = leaderboard.find(entry => entry.userId === req.user?.id);

        res.json({
            leaderboard: leaderboard.slice(0, 10), // Top 10 unique students
            userRank: userRankEntry ? userRankEntry.rank : null,
            totalParticipants: leaderboard.length,
            userScore: userRankEntry ? userRankEntry.score : null
        });
    } catch (error: any) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
