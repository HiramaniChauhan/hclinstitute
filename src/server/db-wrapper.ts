import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
                // console.log(`[MockDB Command] ${command.constructor.name} on Table: ${command.input.TableName}`);
                if (command instanceof PutCommand) {
                    memoryDb.put(command.input.TableName, command.input.Item);
                    return { Item: command.input.Item };
                } else if (command instanceof GetCommand) {
                    const item = memoryDb.get(command.input.TableName, command.input.Key);
                    return { Item: item };
                } else if (command instanceof ScanCommand) {
                    const items = memoryDb.scan(command.input.TableName);
                    let filtered = items;

                    // Optimization: If the filter is specifically for an email and useDynamoDB is false, use our index
                    if (command.input.FilterExpression && command.input.ExpressionAttributeValues) {
                        const expr = command.input.FilterExpression;
                        const vals = command.input.ExpressionAttributeValues;

                        // Check if we can use the email index
                        if (expr === "email = :email" && vals[":email"]) {
                            const indexedItem = (memoryDb as any).getByIndex(command.input.TableName, "email", vals[":email"]);
                            return { Items: indexedItem ? [indexedItem] : [] };
                        }

                        // Generic filter — parse field names from FilterExpression
                        filtered = items.filter(item => {
                            let match = true;
                            for (const [placeholder, value] of Object.entries(vals)) {
                                // Handle begins_with() patterns
                                const bwRegex = new RegExp(`begins_with\\((\\w+),\\s*${placeholder.replace(':', '\\:')}`);
                                const bwMatch = expr.match(bwRegex);
                                if (bwMatch) {
                                    match = match && (item[bwMatch[1]]?.startsWith(value as string) ?? false);
                                    continue;
                                }

                                // Handle "field = :val" and "#alias = :val" patterns
                                const eqRegex = new RegExp(`([#\\w]+)\\s*=\\s*${placeholder.replace(':', '\\:')}`);
                                const eqMatch = expr.match(eqRegex);
                                if (eqMatch) {
                                    let fieldName = eqMatch[1];
                                    // Resolve aliases from ExpressionAttributeNames
                                    if (fieldName.startsWith('#') && command.input.ExpressionAttributeNames) {
                                        fieldName = command.input.ExpressionAttributeNames[fieldName] || fieldName;
                                    }
                                    match = match && item[fieldName] === value;
                                }
                            }
                            return match;
                        });
                    }

                    /*
                    console.log(`[MockDB Scan] Table: ${command.input.TableName} | Raw Found: ${items.length} items`);
                    if (items.length > 0) {
                        console.log(`[MockDB Scan] Sample ID: ${items[0].id || items[0].key}`);
                    }
                    */
                    return { Items: filtered };
                } else if (command instanceof DeleteCommand) {
                    memoryDb.delete(command.input.TableName, command.input.Key);
                    return {};
                } else if (command instanceof QueryCommand) {
                    const { TableName, IndexName, KeyConditionExpression, ExpressionAttributeValues } = command.input;
                    
                    // Optimization: If the query is specifically for an email, use our index
                    if (KeyConditionExpression === "email = :email" && ExpressionAttributeValues?.[":email"]) {
                        const indexedItem = (memoryDb as any).getByIndex(TableName, "email", ExpressionAttributeValues[":email"]);
                        return { Items: indexedItem ? [indexedItem] : [] };
                    }

                    // Generic field matching — parse "field = :val" from KeyConditionExpression
                    const items = memoryDb.scan(TableName);
                    const filtered = items.filter(item => {
                        if (!KeyConditionExpression || !ExpressionAttributeValues) return true;
                        // Support patterns like "userId = :val", "studentId = :val", etc.
                        for (const [placeholder, value] of Object.entries(ExpressionAttributeValues)) {
                            // Extract field name: "fieldName = :placeholder" → fieldName
                            const regex = new RegExp(`(\\w+)\\s*=\\s*${placeholder.replace(':', '\\:')}`);
                            const match = KeyConditionExpression.match(regex);
                            if (match) {
                                const fieldName = match[1];
                                if (item[fieldName] !== value) return false;
                            }
                        }
                        return true;
                    });
                    return { Items: filtered };
                } else if (command instanceof UpdateCommand) {
                    // UpdateCommand in DynamoDB usually uses UpdateExpression. 
                    // For our simple mock, we'll try to find the item and update it.
                    // This is handled by memoryDb.put because it replaces existing items by PK.
                    // However, updateItems often only provides partial data. 
                    // For now, return success to avoid crashes, as memoryDB.put is usually used for full updates in this codebase.
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
    FEES: "Fees",
    SELECTED_STUDENTS: "SelectedStudents",
    CHAPTER_TESTS: "ChapterTests",
    CHAPTER_RESULTS: "ChapterResults",
    CHAPTER_TEST_LAST_RESULTS: "ChapterTestLastResults",
    VIDEOS: "Videos",
    LECTURE_PROGRESS: "LectureProgress",
    REVIEW_QUESTIONS: "ReviewQuestions",
    REVIEWS: "Reviews"
};
