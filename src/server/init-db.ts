
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ScalarAttributeType, KeyType, UpdateTableCommand } from "@aws-sdk/client-dynamodb";
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
    { name: TABLES.CONFIG, pk: "id" },
    { name: TABLES.COURSES, pk: "id" },
    { name: TABLES.BATCHES, pk: "id" },
    { name: TABLES.ANNOUNCEMENTS, pk: "id" },
    { name: TABLES.LECTURES, pk: "id" },
    { name: TABLES.TESTS, pk: "testId" },
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
    { name: TABLES.CHAPTER_TEST_LAST_RESULTS, pk: "id" },
    { name: TABLES.VIDEOS, pk: "id" },
    { name: TABLES.LECTURE_PROGRESS, pk: "id" },
    { name: TABLES.REVIEW_QUESTIONS, pk: "id" },
    { name: TABLES.REVIEWS, pk: "id" }
];

async function initTables() {
    console.log("[Init] Starting DynamoDB Table Initialization...");

    for (const config of tableConfigs) {
        try {
            const description = await client.send(new DescribeTableCommand({ TableName: config.name }));
            console.log(`[Init] Table "${config.name}" already exists.`);

            // Specialized GSI check for Users table
            if (config.name === TABLES.USERS) {
                const existingGSIs = description.Table?.GlobalSecondaryIndexes || [];
                const hasEmailIndex = existingGSIs.some(gsi => gsi.IndexName === "EmailIndex");

                if (!hasEmailIndex) {
                    console.log(`[Init] Adding "EmailIndex" GSI to existing "${config.name}" table...`);
                    await client.send(new UpdateTableCommand({
                        TableName: config.name,
                        AttributeDefinitions: [
                            { AttributeName: "email", AttributeType: "S" }
                        ],
                        GlobalSecondaryIndexUpdates: [
                            {
                                Create: {
                                    IndexName: "EmailIndex",
                                    KeySchema: [
                                        { AttributeName: "email", KeyType: "HASH" }
                                    ],
                                    Projection: { ProjectionType: "ALL" }
                                }
                            }
                        ]
                    }));
                    console.log(`[Init] "EmailIndex" GSI creation initiated.`);
                }
            }
        } catch (error: any) {
            if (error.name === "ResourceNotFoundException") {
                console.log(`[Init] Creating table "${config.name}"...`);
                
                const attributeDefinitions = [
                    { AttributeName: config.pk, AttributeType: "S" as ScalarAttributeType }
                ];
                const gsis: any[] = [];

                // Add Email Index for Users table on creation
                if (config.name === TABLES.USERS) {
                    attributeDefinitions.push({ AttributeName: "email", AttributeType: "S" });
                    gsis.push({
                        IndexName: "EmailIndex",
                        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
                        Projection: { ProjectionType: "ALL" }
                    });
                }

                await client.send(new CreateTableCommand({
                    TableName: config.name,
                    AttributeDefinitions: attributeDefinitions,
                    KeySchema: [
                        { AttributeName: config.pk, KeyType: "HASH" as KeyType }
                    ],
                    GlobalSecondaryIndexes: gsis.length > 0 ? gsis : undefined,
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

async function seedAdminSecret() {
    try {
        const ADMIN_SECRET = process.env.ADMIN_SECRET;
        if (!ADMIN_SECRET) {
            console.error("[Init] CRITICAL: ADMIN_SECRET is not defined in environment variables. Refusing to seed fallback secret.");
            return;
        }
        const exists = await client.send(new DescribeTableCommand({ TableName: TABLES.CONFIG }));
        if (exists.Table) {
            console.log("[Init] Seeding default ADMIN_SECRET...");
            const { PutCommand } = await import("@aws-sdk/lib-dynamodb");
            const { DynamoDBDocumentClient } = await import("@aws-sdk/lib-dynamodb");
            const ddbDocClient = DynamoDBDocumentClient.from(client);

            await ddbDocClient.send(new PutCommand({
                TableName: TABLES.CONFIG,
                Item: {
                    id: "ADMIN_SECRET",
                    value: ADMIN_SECRET,
                    updatedAt: new Date().toISOString()
                }
            }));
            console.log("[Init] Default ADMIN_SECRET seeded.");
        }
    } catch (error: any) {
        console.warn("[Init] Could not seed ADMIN_SECRET:", error.message);
    }
}

initTables()
    .then(() => seedAdminSecret())
    .catch(console.error);
