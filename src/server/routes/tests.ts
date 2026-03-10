import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { validateInput, testSchema } from "../utils/validators";
import { createItem, getAllItems, getItem, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db";
import { Response } from "express";

const router = Router();

interface TestSection {
    id: string;
    name: string;
    duration: number;
    marksPerQuestion: number;
    questions: any[];
}

interface TestData {
    testId: string;
    title: string;
    courseId?: string;
    sections: TestSection[];
    totalQuestions: number;
    passingScore: number;
    duration: number;
    createdAt: string;
    createdBy: string;
    isActive?: boolean;
    attempts?: number;
    subject?: string;
    difficulty?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
}

// GET all tests
router.get("/", async (req: AuthRequest, res: Response) => {
    try {
        const tests = await getAllItems<TestData>(TABLES.TESTS);
        res.json(tests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET tests by course
router.get("/course/:courseId", async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const tests = await getAllItems<TestData>(
            TABLES.TESTS,
            "courseId = :courseId",
            { ":courseId": courseId }
        );
        res.json(tests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET test by ID
router.get("/:testId", async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;
        const test = await getItem<TestData>(TABLES.TESTS, { testId });

        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }

        res.json(test);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST create test (Admin only)
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = validateInput<any>(testSchema, req.body);

        const test: TestData = {
            testId: data.testId || generateId("test"),
            title: data.title,
            subject: data.subject,
            difficulty: data.difficulty,
            courseId: data.courseId || "default-course",
            totalQuestions: data.totalQuestions,
            passingScore: data.passingScore,
            duration: data.duration,
            sections: data.sections || [],
            startDate: data.startDate,
            startTime: data.startTime,
            endDate: data.endDate,
            endTime: data.endTime,
            createdAt: new Date().toISOString(),
            createdBy: req.user?.id || "",
            isActive: true,
            attempts: 0,
        };

        await createItem(TABLES.TESTS, test);
        res.status(201).json(test);
    } catch (error: any) {
        console.error("[TestCreation] Error creating test:", error.message, "Payload was:", JSON.stringify(req.body, null, 2));
        res.status(400).json({ error: error.message });
    }
});

// PATCH update test (Admin only)
router.patch("/:testId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;
        const existingTest = await getItem<TestData>(TABLES.TESTS, { testId });

        if (!existingTest) {
            return res.status(404).json({ error: "Test not found" });
        }

        const data = req.body;
        // Merge existing with updates
        const updatedTest: TestData = {
            ...existingTest,
            ...data,
            testId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        await createItem<TestData>(TABLES.TESTS, updatedTest);
        res.json(updatedTest);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE test (Admin only)
router.delete("/:testId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;

        const test = await getItem(TABLES.TESTS, { testId });
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }

        await deleteItem(TABLES.TESTS, { testId });
        res.json({ message: "Test deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
