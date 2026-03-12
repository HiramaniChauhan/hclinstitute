import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getItem, getAllItems, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db";
import { Response } from "express";

const router = Router();

// GET all tests for a chapter
router.get("/:chapterId", async (req: AuthRequest, res: Response) => {
    try {
        const { chapterId } = req.params;
        // Find all tests that belong to this chapterId
        const tests = await getAllItems(TABLES.CHAPTER_TESTS, "chapterId = :cid", { ":cid": chapterId });
        res.json(tests || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET specific test by ID
router.get("/test/:testId", async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;
        // For backwards compatibility, some old tests might just use chapterId as their id.
        // We scan for the specific test. Ideally we would use getItem if testId is the primary key.
        const test = await getItem(TABLES.CHAPTER_TESTS, { id: testId });
        if (!test) {
            // Fallback for older tests where id might not be explicitly set, fallback to searching by chapterId as id
            const oldTests = await getAllItems(TABLES.CHAPTER_TESTS, "chapterId = :cid", { ":cid": testId });
            if (oldTests && oldTests.length > 0) return res.json(oldTests[0]);
            return res.status(404).json({ error: "Test not found" });
        }
        res.json(test);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST save/update a specific test for a chapter
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const testData = req.body;
        if (!testData.chapterId) return res.status(400).json({ error: "chapterId is required" });

        // Ensure the test has a unique ID, otherwise generate one.
        // If it's a legacy test without an ID, use the chapterId to overwrite it.
        const testId = testData.id || `ctest_${Date.now()}`;

        const item = {
            ...testData,
            id: testId,
            updatedAt: new Date().toISOString()
        };

        await createItem(TABLES.CHAPTER_TESTS, item);
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE a specific test
router.delete("/:testId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;
        await deleteItem(TABLES.CHAPTER_TESTS, { id: testId });
        // Also try deleting by chapterId just in case it's a legacy test
        await deleteItem(TABLES.CHAPTER_TESTS, { chapterId: testId }).catch(() => { });
        res.json({ message: "Test deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST submit chapter result
router.post("/results", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { chapterId, score, totalMarks, userAnswers, submittedAt } = req.body;
        const userId = req.user?.id;

        if (!chapterId || !userId) return res.status(400).json({ error: "Missing data" });

        // User requested: "delete chache of previous attempt only in chapter test"
        // Delete any previous results for this user and chapter test.
        try {
            const existingResults = await getAllItems<any>(TABLES.CHAPTER_RESULTS, "chapterId = :cid AND userId = :uid", {
                ":cid": chapterId,
                ":uid": userId
            });
            if (existingResults && existingResults.length > 0) {
                for (const result of existingResults) {
                    await deleteItem(TABLES.CHAPTER_RESULTS, { resultId: result.resultId });
                }
            }
        } catch (delErr) {
            console.error("Error deleting previous chapter test attempts:", delErr);
        }

        const resultId = `cres_${Date.now()}`;
        const resultItem = {
            resultId,
            chapterId,
            userId,
            score,
            totalMarks,
            userAnswers,
            submittedAt: submittedAt || new Date().toISOString()
        };

        await createItem(TABLES.CHAPTER_RESULTS, resultItem);
        res.json(resultItem);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET latest result for a chapter (for review)
router.get("/results/latest/:chapterId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { chapterId } = req.params;
        const userId = req.user?.id;

        const results = await getAllItems<any>(TABLES.CHAPTER_RESULTS, "chapterId = :cid AND userId = :uid", {
            ":cid": chapterId,
            ":uid": userId
        });

        if (results.length === 0) return res.json(null);

        // Sort by submittedAt desc
        const latest = results.sort((a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )[0];

        res.json(latest);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
