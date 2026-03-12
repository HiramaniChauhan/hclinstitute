import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getItem, getAllItems, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db";
import { Response } from "express";

const router = Router();

// GET all tests for a chapter
router.get('/:chapterId', async (req: AuthRequest, res: Response) => {
    try {
        const { chapterId } = req.params;
        const cid = String(chapterId);
        // Find all tests that belong to this chapterId (normalize to string)
        const tests = await getAllItems(TABLES.CHAPTER_TESTS, "chapterId = :chapterId", { ":chapterId": cid });
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
            const oldTests = await getAllItems(TABLES.CHAPTER_TESTS, "chapterId = :chapterId", { ":chapterId": testId });
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
        if (testData.chapterId === undefined || testData.chapterId === null) return res.status(400).json({ error: "chapterId is required" });

        // Normalize chapterId to string to avoid type mismatch in the in-memory DB
        testData.chapterId = String(testData.chapterId);

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
        const { chapterId: rawChapterId, score, totalMarks, userAnswers, submittedAt } = req.body;
        const userId = req.user?.id;

        const chapterId = String(rawChapterId);

        if (!chapterId || !userId) return res.status(400).json({ error: "Missing data" });

        // Removed: We no longer delete previous attempts from TABLES.CHAPTER_RESULTS.
        // We will store all attempts, and keep the latest attempt in TABLES.CHAPTER_TEST_LAST_RESULTS.

        const resultId = `cres_${Date.now()}`;
        const resultItem = {
            resultId,
            chapterId,
            userId,
            score,
            totalMarks,
            userAnswers,
            correctAnswers: req.body.correctAnswers || 0,
            wrongAnswers: req.body.wrongAnswers || 0,
            submittedAt: submittedAt || new Date().toISOString()
        };

        console.log(`[ChapterTests] Saving result for user=${userId} chapterId=${chapterId} resultId=${resultId}`);
        await createItem(TABLES.CHAPTER_RESULTS, resultItem);

        // Save into Last Results table using the specific ID passed from frontend
        // This ensures the "Review Last" button (which uses the same ID) works correctly.
        const lastResultItem = {
            ...resultItem,
            id: `${userId}_${chapterId}`
        };
        await createItem(TABLES.CHAPTER_TEST_LAST_RESULTS, lastResultItem);

        // Also save using the internal chapterId if it's different, 
        // to support legacy lookups or chapter-wide "last" result if that's ever needed.
        if (resultItem.chapterId && resultItem.chapterId !== chapterId) {
            const backupLastResult = {
                ...resultItem,
                id: `${userId}_${resultItem.chapterId}`
            };
            await createItem(TABLES.CHAPTER_TEST_LAST_RESULTS, backupLastResult);
        }

        res.json(resultItem);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET latest result for a chapter (for review)
router.get("/results/latest/:chapterId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { chapterId: rawChapterId } = req.params;
        const chapterId = String(rawChapterId);
        const userId = req.user?.id;

        console.log(`[ChapterTests] Fetching latest for user=${userId} chapterId=${chapterId} from Last Results table`);

        let lastResult = await getItem(TABLES.CHAPTER_TEST_LAST_RESULTS, { id: `${userId}_${chapterId}` });

        // Fallback backward compatibility for results that were saved before the LastResults table existed
        if (!lastResult) {
            console.log(`[ChapterTests] Not found in Last Results table, checking ChapterResults fallback`);
            const allResults = await getAllItems<any>(TABLES.CHAPTER_RESULTS, "chapterId = :chapterId AND userId = :userId", {
                ":chapterId": chapterId,
                ":userId": userId
            });
            if (allResults && allResults.length > 0) {
                lastResult = allResults.sort((a, b) =>
                    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                )[0];
            }
        }

        if (!lastResult) return res.json(null);

        res.json(lastResult);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
