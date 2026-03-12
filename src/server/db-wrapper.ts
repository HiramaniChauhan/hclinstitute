import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import { memoryDb, InMemoryDatabase } from "./db-memory";

dotenv.config();

const useDynamoDb = process.env.USE_DYNAMODB === "true";

let docClient: any;
let isMemory = false;

if (useDynamoDb) {
    // Use real DynamoDB
    const client = new DynamoDBClient({
        region: process.env.AWS_REGION || "us-east-1",
        endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeMyKeyId",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey",
        },
    });
    docClient = DynamoDBDocumentClient.from(client);
    console.log("[Database] Using DynamoDB");
} else {
    // Use in-memory database for development
    class MockDocClient {
        async send(command: any) {
            try {
                console.log(`[MockDB Command] ${command.constructor.name} on Table: ${command.input.TableName}`);
                if (command instanceof PutCommand) {
                    memoryDb.put(command.input.TableName, command.input.Item);
                    return { Item: command.input.Item };
                } else if (command instanceof GetCommand) {
                    const item = memoryDb.get(command.input.TableName, command.input.Key);
                    return { Item: item };
                } else if (command instanceof ScanCommand) {
                    const items = memoryDb.scan(command.input.TableName);
                    let filtered = items;

                    // Apply filter expression if needed
                    if (command.input.FilterExpression && command.input.ExpressionAttributeValues) {
                        filtered = items.filter(item => {
                            let match = true;
                            const expr = command.input.FilterExpression;
                            const vals = command.input.ExpressionAttributeValues;

                            if (expr.includes("email") && vals[":email"]) {
                                match = match && item.email === vals[":email"];
                            }
                            if ((expr.includes("#r = :role") || expr.includes("role = :role")) && vals[":role"]) {
                                match = match && item.role === vals[":role"];
                            }
                            if (expr.includes("courseId") && vals[":courseId"]) {
                                match = match && item.courseId === vals[":courseId"];
                            }
                            if (expr.includes("studentId") && vals[":studentId"]) {
                                match = match && item.studentId === vals[":studentId"];
                            }
                            if (expr.includes("sender") && vals[":sender"]) {
                                match = match && item.sender === vals[":sender"];
                            }
                            if ((expr.includes("#r = :unread") || expr.includes("read = :unread")) && vals[":unread"] !== undefined) {
                                match = match && item.read === vals[":unread"];
                            }
                            if (expr.includes("userId") && vals[":userId"]) {
                                match = match && item.userId === vals[":userId"];
                            }
                            if (expr.includes("testId") && vals[":testId"]) {
                                match = match && item.testId === vals[":testId"];
                            }
                            if (expr.includes("id = :id") && vals[":id"]) {
                                match = match && item.id === vals[":id"];
                            }
                            // Support begins_with
                            if (expr.includes("begins_with(resultId, :testId)") && vals[":testId"]) {
                                match = match && item.resultId?.startsWith(vals[":testId"]);
                            }
                            return match;
                        });
                    }

                    console.log(`[MockDB Scan] Table: ${command.input.TableName} | Raw Found: ${items.length} items`);
                    if (items.length > 0) {
                        console.log(`[MockDB Scan] Sample ID: ${items[0].id || items[0].key}`);
                    }
                    return { Items: filtered };
                } else if (command instanceof DeleteCommand) {
                    memoryDb.delete(command.input.TableName, command.input.Key);
                    return {};
                }
                return {};
            } catch (error) {
                console.error("[MockDB Error]", error);
                throw error;
            }
        }
    }
    docClient = new MockDocClient();
    isMemory = true;
    console.log("[Database] Using In-Memory Database (Development Mode)");
}

export { docClient, isMemory };

export const TABLES = {
    USERS: process.env.DYNAMODB_USERS_TABLE || "Users",
    OTPS: "Otps",
    CONFIG: "Config",
    COURSES: "Courses",
    BATCHES: "Batches",
    ANNOUNCEMENTS: "Announcements",
    LECTURES: "Lectures",
    TESTS: "Tests",
    RESULTS: "Results",
    FORUM_POSTS: "ForumPosts",
    CHAT_MESSAGES: "ChatMessages",
    NOTES: "Notes",
    ENROLLMENTS: "Enrollments",
    NOTIFICATIONS: "Notifications",
    ATTENDANCE: "Attendance",
    FEES: "Fees",
    SELECTED_STUDENTS: "SelectedStudents",
    CHAPTER_TESTS: "ChapterTests",
    CHAPTER_RESULTS: "ChapterResults",
    CHAPTER_TEST_LAST_RESULTS: "ChapterTestLastResults",
    VIDEOS: "Videos"
};
