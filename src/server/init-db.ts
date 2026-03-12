
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ScalarAttributeType, KeyType } from "@aws-sdk/client-dynamodb";
import { TABLES } from "./db-wrapper";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeMyKeyId",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey",
    },
});

const tableConfigs = [
    { name: TABLES.USERS, pk: "id" },
    { name: TABLES.OTPS, pk: "email" },
    { name: TABLES.CONFIG, pk: "key" },
    { name: TABLES.COURSES, pk: "id" },
    { name: TABLES.BATCHES, pk: "id" },
    { name: TABLES.ANNOUNCEMENTS, pk: "id" },
    { name: TABLES.LECTURES, pk: "id" },
    { name: TABLES.TESTS, pk: "id" },
    { name: TABLES.RESULTS, pk: "resultId" },
    { name: TABLES.FORUM_POSTS, pk: "id" },
    { name: TABLES.CHAT_MESSAGES, pk: "id" },
    { name: TABLES.NOTES, pk: "id" },
    { name: TABLES.ENROLLMENTS, pk: "enrollmentId" },
    { name: TABLES.NOTIFICATIONS, pk: "notificationId" },
    { name: TABLES.ATTENDANCE, pk: "attendanceId" },
    { name: TABLES.FEES, pk: "feeId" },
    { name: TABLES.SELECTED_STUDENTS, pk: "id" },
    { name: TABLES.CHAPTER_TESTS, pk: "id" },
    { name: TABLES.CHAPTER_RESULTS, pk: "resultId" },
    { name: TABLES.VIDEOS, pk: "id" }
];

async function initTables() {
    console.log("[Init] Starting DynamoDB Table Initialization...");

    for (const config of tableConfigs) {
        try {
            await client.send(new DescribeTableCommand({ TableName: config.name }));
            console.log(`[Init] Table "${config.name}" already exists.`);
        } catch (error: any) {
            if (error.name === "ResourceNotFoundException") {
                console.log(`[Init] Creating table "${config.name}"...`);
                await client.send(new CreateTableCommand({
                    TableName: config.name,
                    AttributeDefinitions: [
                        { AttributeName: config.pk, AttributeType: "S" as ScalarAttributeType }
                    ],
                    KeySchema: [
                        { AttributeName: config.pk, KeyType: "HASH" as KeyType }
                    ],
                    BillingMode: "PAY_PER_REQUEST"
                }));
                console.log(`[Init] Table "${config.name}" created.`);
            } else {
                console.error(`[Init] Error checking/creating table "${config.name}":`, error.message);
            }
        }
    }

    console.log("[Init] Table Initialization Complete.");
}

initTables().catch(console.error);
