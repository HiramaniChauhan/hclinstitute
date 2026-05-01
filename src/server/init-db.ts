
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

// GSI definitions: { field, indexName } arrays per table
// These enable QueryCommand instead of ScanCommand for common lookups
interface TableConfig {
    name: string;
    pk: string;
    gsis?: { field: string; indexName: string }[];
}

const tableConfigs: TableConfig[] = [
    { name: TABLES.USERS, pk: "id", gsis: [{ field: "email", indexName: "EmailIndex" }] },
    { name: TABLES.OTPS, pk: "email" },
    { name: TABLES.CONFIG, pk: "id" },
    { name: TABLES.COURSES, pk: "id" },
    { name: TABLES.BATCHES, pk: "id" },
    { name: TABLES.ANNOUNCEMENTS, pk: "id" },
    { name: TABLES.LECTURES, pk: "id" },
    { name: TABLES.TESTS, pk: "testId" },
    { name: TABLES.RESULTS, pk: "resultId", gsis: [
        { field: "userId", indexName: "UserIdIndex" },
        { field: "testId", indexName: "TestIdIndex" }
    ]},
    { name: TABLES.FORUM_POSTS, pk: "id" },
    { name: TABLES.CHAT_MESSAGES, pk: "id", gsis: [{ field: "studentId", indexName: "StudentIdIndex" }] },
    { name: TABLES.NOTES, pk: "id" },
    { name: TABLES.ENROLLMENTS, pk: "enrollmentId", gsis: [{ field: "userId", indexName: "UserIdIndex" }] },
    { name: TABLES.NOTIFICATIONS, pk: "notificationId", gsis: [{ field: "userId", indexName: "UserIdIndex" }] },
    { name: TABLES.FEES, pk: "feeId", gsis: [{ field: "userId", indexName: "UserIdIndex" }] },
    { name: TABLES.SELECTED_STUDENTS, pk: "id" },
    { name: TABLES.CHAPTER_TESTS, pk: "id" },
    { name: TABLES.CHAPTER_RESULTS, pk: "resultId", gsis: [{ field: "userId", indexName: "UserIdIndex" }] },
    { name: TABLES.CHAPTER_TEST_LAST_RESULTS, pk: "id" },
    { name: TABLES.VIDEOS, pk: "id" },
    { name: TABLES.LECTURE_PROGRESS, pk: "id", gsis: [{ field: "studentId", indexName: "StudentIdIndex" }] },
    { name: TABLES.REVIEW_QUESTIONS, pk: "id" },
    { name: TABLES.REVIEWS, pk: "id", gsis: [
        { field: "studentId", indexName: "StudentIdIndex" },
        { field: "targetId", indexName: "TargetIdIndex" }
    ]}
];

async function initTables() {
    console.log("[Init] Starting DynamoDB Table Initialization...");

    for (const config of tableConfigs) {
        try {
            const description = await client.send(new DescribeTableCommand({ TableName: config.name }));
            console.log(`[Init] Table "${config.name}" already exists.`);

            // Check if any configured GSIs are missing and add them
            if (config.gsis && config.gsis.length > 0) {
                const existingGSIs = description.Table?.GlobalSecondaryIndexes || [];
                for (const gsi of config.gsis) {
                    const exists = existingGSIs.some(g => g.IndexName === gsi.indexName);
                    if (!exists) {
                        console.log(`[Init] Adding "${gsi.indexName}" GSI to "${config.name}"...`);
                        await client.send(new UpdateTableCommand({
                            TableName: config.name,
                            AttributeDefinitions: [
                                { AttributeName: gsi.field, AttributeType: "S" }
                            ],
                            GlobalSecondaryIndexUpdates: [{
                                Create: {
                                    IndexName: gsi.indexName,
                                    KeySchema: [{ AttributeName: gsi.field, KeyType: "HASH" }],
                                    Projection: { ProjectionType: "ALL" }
                                }
                            }]
                        }));
                        console.log(`[Init] "${gsi.indexName}" GSI creation initiated.`);
                    }
                }
            }
        } catch (error: any) {
            if (error.name === "ResourceNotFoundException") {
                console.log(`[Init] Creating table "${config.name}"...`);
                
                const attributeDefinitions: any[] = [
                    { AttributeName: config.pk, AttributeType: "S" as ScalarAttributeType }
                ];
                const gsis: any[] = [];

                // Add GSIs from config
                if (config.gsis) {
                    for (const gsi of config.gsis) {
                        // Only add attribute definition if not already the PK
                        if (gsi.field !== config.pk) {
                            attributeDefinitions.push({ AttributeName: gsi.field, AttributeType: "S" });
                        }
                        gsis.push({
                            IndexName: gsi.indexName,
                            KeySchema: [{ AttributeName: gsi.field, KeyType: "HASH" }],
                            Projection: { ProjectionType: "ALL" }
                        });
                    }
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
