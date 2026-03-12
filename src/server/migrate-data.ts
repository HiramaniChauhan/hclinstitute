
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "./db-wrapper";
import fs from "fs";
import path from "path";
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

const docClient = DynamoDBDocumentClient.from(client);

async function migrateData() {
    console.log("[Migration] Starting Data Migration...");

    const dataPath = path.join(process.cwd(), ".data.json");
    if (!fs.existsSync(dataPath)) {
        console.error("[Migration] .data.json not found!");
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    for (const [tableName, items] of Object.entries(data)) {
        if (!Array.isArray(items)) continue;

        // Map frontend table names to DynamoDB table names if they differ
        // In our case, they should match the values in TABLES
        let targetTable = tableName;

        // Find the actual table name from TABLES mapping
        const tableKey = Object.keys(TABLES).find(k => (TABLES as any)[k] === tableName);
        if (!tableKey) {
            console.warn(`[Migration] Table "${tableName}" not found in TABLES mapping. Skipping.`);
            continue;
        }

        console.log(`[Migration] Migrating ${items.length} items to "${tableName}"...`);

        for (const item of items) {
            try {
                await docClient.send(new PutCommand({
                    TableName: tableName,
                    Item: item
                }));
            } catch (error: any) {
                console.error(`[Migration] Error migrating item to "${tableName}":`, error.message);
            }
        }
    }

    console.log("[Migration] Data Migration Complete.");
}

migrateData().catch(console.error);
