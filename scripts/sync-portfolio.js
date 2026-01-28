import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as data from '../src/lib/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../public/portfolioData.json');

/**
 * Extracts the relevant data and converts Lucide icons to strings
 */
function processData(rawData) {
    const result = {};

    // Define which exports we want to include in the JSON
    const includeKeys = ['skills', 'skillCategories', 'experiences', 'projects', 'aboutSkills', 'services'];

    includeKeys.forEach(key => {
        if (rawData[key]) {
            // Deep clone to avoid mutating the original data
            let processed = JSON.parse(JSON.stringify(rawData[key], (k, v) => {
                // If the value is a function (like a Lucide icon component), try to get its name
                if (typeof v === 'function') {
                    return v.displayName || v.name || 'Icon';
                }
                // If it's an object with a displayName (Lucide icons can be objects in some environments)
                if (v && typeof v === 'object' && v.displayName) {
                    return v.displayName;
                }
                return v;
            }));

            result[key] = processed;
        }
    });

    return result;
}

try {
    console.log('🔄 Syncing portfolio data...');

    const processedData = processData(data);

    fs.writeFileSync(
        outputPath,
        JSON.stringify(processedData, null, 2),
        'utf-8'
    );

    console.log(`✅ Successfully synced data to: ${outputPath}`);
} catch (error) {
    console.error('❌ Error syncing portfolio data:', error);
    process.exit(1);
}
