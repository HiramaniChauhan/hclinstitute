import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, generateId, queryByField } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
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

        const results = await queryByField<ResultData>(TABLES.RESULTS, "userId", req.user.id);

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

// GET results for a specific student (Admin only)
router.get("/student/:userId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const results = (await queryByField<ResultData>(TABLES.RESULTS, "userId", userId))
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

        const { testId, courseId, duration, userAnswers } = req.body;

        if (!testId || !userAnswers) {
            return res.status(400).json({ error: "Missing required fields: testId, userAnswers" });
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

        // ── Server-side score computation ────────────────────────────────────
        const test = await getItem<any>(TABLES.TESTS, { testId });
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }

        // Collect all questions with their correct answers from every section
        let totalQuestions = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let totalScore = 0;

        if (test.sections && Array.isArray(test.sections)) {
            for (const section of test.sections) {
                const marksPerQuestion = Number(section.marksPerQuestion) || 1;
                const negativeMarks = Number(section.negativeMarks) || 0;
                if (section.questions && Array.isArray(section.questions)) {
                    for (const question of section.questions) {
                        totalQuestions++;
                        const questionId = question.id || question.questionId;
                        // Frontend stores answers with composite key: "sectionId_questionId"
                        const compositeKey = `${section.id}_${questionId}`;
                        // Try composite key first (normal flow), fall back to plain questionId
                        const studentAnswer = userAnswers[compositeKey] ?? userAnswers[questionId];

                        if (studentAnswer !== undefined && studentAnswer !== null) {
                            if (String(studentAnswer) === String(question.correctAnswer)) {
                                correctAnswers++;
                                totalScore += marksPerQuestion;
                            } else {
                                incorrectAnswers++;
                                totalScore -= negativeMarks;
                            }
                        }
                    }
                }
            }
        }

        const finalCourseId = courseId || test?.subject || "General";
        const finalDuration = duration || 0;
        const totalPossibleMarks = (test.sections || []).reduce(
            (acc: number, s: any) => acc + ((s.questions?.length || 0) * (Number(s.marksPerQuestion) || 1)),
            0
        );
        const percentage = totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;
        const status = percentage >= (test?.passingScore || 40) ? "passed" : "failed";

        const result: ResultData = {
            resultId: generateId("result"),
            userId: req.user.id,
            testId,
            courseId: finalCourseId,
            score: Number(totalScore.toFixed(2)),
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

        // 1. Get all results for this test using GSI (TestIdIndex) for performance
        let allResults = await queryByField<ResultData>(TABLES.RESULTS, "testId", testId);
        
        // Fallback for numeric IDs (common in dummy data)
        if (allResults.length === 0 && !isNaN(Number(testId))) {
            allResults = await queryByField<ResultData>(TABLES.RESULTS, "testId", Number(testId));
        }

        if (allResults.length === 0) {
            return res.json({ leaderboard: [], userRank: null, totalParticipants: 0 });
        }

        // 2. Filter for the FIRST (Live) result per unique student (earliest submission)
        const firstAttemptResultsByUser: Record<string, ResultData> = {};
        allResults.forEach(res => {
            const existing = firstAttemptResultsByUser[res.userId];
            // If no result for this user yet, or this one is earlier than the one we have
            if (!existing || new Date(res.submittedAt) < new Date(existing.submittedAt)) {
                firstAttemptResultsByUser[res.userId] = res;
            }
        });

        const uniqueResults = Object.values(firstAttemptResultsByUser);

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
            leaderboard,           // all participants, ranked
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
