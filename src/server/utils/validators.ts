import { z } from "zod";

export const testSchema = z.object({
    testId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    subject: z.string().optional(),
    totalQuestions: z.number().optional(),
    totalMarks: z.number().optional(),
    passingScore: z.number().optional(),
    duration: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 0 : v).refine(v => v >= 1, "Duration must be at least 1 minute"),
    difficulty: z.string().optional(),
    sections: z.array(z.any()).optional(),
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    endDate: z.string().optional(),
    endTime: z.string().optional(),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: any): T {
    try {
        return schema.parse(data);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors.map(e => e.message).join(", "));
        }
        throw error;
    }
}
