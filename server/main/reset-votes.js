// Quick script to drop and recreate the votes table
import { db } from './db/db.js';
import { sql } from 'drizzle-orm';

async function resetVotesTable() {
    try {
        // Drop the existing votes table
        await db.execute(sql`DROP TABLE IF EXISTS votes CASCADE`);
        console.log('Dropped votes table');

        // Create the new votes table with integer deal_id
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS votes (
                vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                deal_id INTEGER NOT NULL REFERENCES deals(id),
                voter_type voter_type NOT NULL,
                value_rating NUMERIC(3,1) NOT NULL,
                satiety_rating NUMERIC(3,1) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        console.log('Created new votes table with integer deal_id');

    } catch (error) {
        console.error('Error:', error);
    }
}

resetVotesTable();
