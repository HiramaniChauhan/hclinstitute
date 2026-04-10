import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

async function check() {
    try {
        const data = await client.send(new DescribeTableCommand({ TableName: "Users" }));
        console.log("Indexes for Users table:");
        console.log(JSON.stringify(data.Table?.GlobalSecondaryIndexes?.map(i => i.IndexName), null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();
