import { docClient, TABLES } from './src/server/db-wrapper.js';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

async function test() {
    const res = await docClient.send(new ScanCommand({ TableName: "Users" }));
    console.log("Users:", res.Items?.length);
}
test();
