
import { memoryDb } from "./src/server/db-memory";
import { docClient, TABLES } from "./src/server/db-wrapper";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

async function testChatFiltering() {
    console.log("--- Testing Chat Filtering ---");

    // 1. Seed some mock data
    const table = TABLES.CHAT_MESSAGES;
    memoryDb.put(table, { id: "1", studentId: "student_A", text: "Hello from A", sender: "student", timestamp: new Date().toISOString() });
    memoryDb.put(table, { id: "2", studentId: "student_B", text: "Hello from B", sender: "student", timestamp: new Date().toISOString() });
    memoryDb.put(table, { id: "3", studentId: "student_A", text: "Admin reply to A", sender: "admin", timestamp: new Date().toISOString() });

    // 2. Test filtering for student_A
    console.log("Fetching messages for student_A...");
    const resultA = await docClient.send(new ScanCommand({
        TableName: table,
        FilterExpression: "studentId = :studentId",
        ExpressionAttributeValues: { ":studentId": "student_A" }
    }));

    console.log(`Found ${resultA.Items?.length} messages for student_A (Expected: 2)`);
    resultA.Items?.forEach(m => console.log(` - [${m.sender}] ${m.text}`));

    // 3. Test filtering for student_B
    console.log("\nFetching messages for student_B...");
    const resultB = await docClient.send(new ScanCommand({
        TableName: table,
        FilterExpression: "studentId = :studentId",
        ExpressionAttributeValues: { ":studentId": "student_B" }
    }));

    console.log(`Found ${resultB.Items?.length} messages for student_B (Expected: 1)`);
    resultB.Items?.forEach(m => console.log(` - [${m.sender}] ${m.text}`));

    if (resultA.Items?.length === 2 && resultB.Items?.length === 1) {
        console.log("\n✅ SUCCESS: Chat filtering is working correctly.");
    } else {
        console.error("\n❌ FAILURE: Chat filtering is NOT working correctly.");
        process.exit(1);
    }
}

testChatFiltering().catch(console.error);
