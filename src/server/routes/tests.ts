import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { validateInput, testSchema } from "../utils/validators";
import { createItem, getAllItems, getItem, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES, docClient } from "../db-wrapper";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
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
    updatedAt?: string;
    isPremium?: boolean;
}

// GET all tests
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        let tests = await getAllItems<TestData>(TABLES.TESTS);

        if (req.user && req.user.role !== 'admin') {
            const enrollmentsResult = await docClient.send(new ScanCommand({
                TableName: TABLES.ENROLLMENTS,
                FilterExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId": req.user.id }
            }));

            const enrollments = enrollmentsResult.Items || [];
            const enrolledCourses = new Map();
            let earliestEnrollment = new Date();

            for (const enr of enrollments) {
                const enrDate = new Date(enr.enrolledAt || enr.createdAt || 0);
                enrolledCourses.set(enr.courseId, enrDate);
                if (enrDate < earliestEnrollment) earliestEnrollment = enrDate;
            }

            tests = tests.filter(test => {
                // Course Access Check
                if (test.courseId && test.courseId !== "default-course" && !enrolledCourses.has(test.courseId)) {
                    return false;
                }

                // Time Travel Check
                const enrollmentDate = test.courseId && enrolledCourses.has(test.courseId)
                    ? enrolledCourses.get(test.courseId)
                    : earliestEnrollment;

                if (test.endDate) {
                    const testEndDate = new Date(`${test.endDate}T${test.endTime || '23:59'}`);
                    if (testEndDate < enrollmentDate) {
                        return false;
                    }
                }
                return true;
            });

            // Strip correct answers and explanations for students
            tests = tests.map(test => ({
                ...test,
                sections: test.sections?.map(s => ({
                    ...s,
                    questions: s.questions?.map(({ correctAnswer, explanation, ...q }: any) => q)
                }))
            }));
        }

        res.json(tests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET tests by course — requires login; students only see question count, not actual questions
router.get("/course/:courseId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const tests = await getAllItems<TestData>(
            TABLES.TESTS,
            "courseId = :courseId",
            { ":courseId": courseId }
        );

        // Strip questions from non-admin responses to prevent answer leaking
        const safeTests = req.user?.role === "admin"
            ? tests
            : tests.map(t => ({ ...t, sections: t.sections?.map(s => ({ ...s, questions: undefined, questionCount: s.questions?.length })) }));

        res.json(safeTests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET test by ID — requires login; students get questions without correct answers
router.get("/:testId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { testId } = req.params;
        const test = await getItem<TestData>(TABLES.TESTS, { testId });

        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }

        let includeAnswers = false;
        if (req.user?.role === "admin") {
            includeAnswers = true;
        } else if (req.query.review === "true" && req.user) {
            // Verify if student has actually submitted this test
            const existingResults = await getAllItems<any>(
                TABLES.RESULTS,
                "userId = :userId AND testId = :testId",
                { ":userId": req.user.id, ":testId": testId }
            );
            if (existingResults && existingResults.length > 0) {
                includeAnswers = true;
            }
        }

        // Strip correct answers and explanations for students to prevent cheating
        if (!includeAnswers) {
            const safeTest = {
                ...test,
                sections: test.sections?.map(s => ({
                    ...s,
                    questions: s.questions?.map(({ correctAnswer, explanation, ...q }: any) => q)
                }))
            };
            return res.json(safeTest);
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
            isPremium: data.isPremium || false,
            createdAt: new Date().toISOString(),
            createdBy: req.user?.id || "",
            isActive: true,
            attempts: 0,
        };

        await createItem(TABLES.TESTS, test);
        res.status(201).json(test);
    } catch (error: any) {
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
