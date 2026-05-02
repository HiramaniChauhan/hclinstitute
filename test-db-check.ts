import { getAllItems } from './src/utils/db-helpers';
import { TABLES } from './src/db-wrapper';

async function run() {
    const tests = await getAllItems(TABLES.TESTS);
    console.log("Tests count:", tests.length);
    console.log("Sections for first test:", tests[0]?.sections?.length);
    
    const results = await getAllItems(TABLES.RESULTS);
    console.log("Results count:", results.length);
}

run().catch(console.error);
