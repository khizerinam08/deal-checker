/**
 * Script to reset all deals to default value scores and multipliers.
 * Run: node main/scripts/reset-deal-scores.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import { db } from '../db/db.js';
import { deals } from '../db/schema.js';

async function resetAllDealScores() {
    console.log('Resetting all deals to default scores...');

    try {
        const result = await db.update(deals)
            .set({
                baseValueScore: 0,
                multiplierLight: 1.0,
                multiplierMedium: 1.0,
                multiplierHeavy: 1.0,
            });

        console.log('✅ All deals have been reset to default values:');
        console.log('   - baseValueScore: 0');
        console.log('   - multiplierLight: 1.0');
        console.log('   - multiplierMedium: 1.0');
        console.log('   - multiplierHeavy: 1.0');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting deals:', error);
        process.exit(1);
    }
}

resetAllDealScores();
