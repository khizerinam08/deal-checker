import express from 'express';
import { db } from '../db/db.js';
import { profiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/middleware.js';

const router = express.Router();

// Valid eater types
const VALID_EATER_TYPES = ['Small', 'Medium', 'Large'];

/**
 * POST /eatertype
 * Syncs eater type between cookie and database.
 * Requires authentication - userId comes from verified session.
 * 
 * Logic:
 * 1. If user exists in DB with a valid eaterType -> use that (DB is source of truth)
 * 2. If user doesn't exist or has 'None' -> use cookie value and save to DB
 * 3. If no cookie either -> create profile with 'None'
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        // Get userId from verified session (NOT from request body)
        const userId = req.session.user.id;
        console.log(`[EaterType] Processing for user: ${userId}`);

        // Read and validate the cookie
        const rawEaterType = req.cookies['user_eater_size'];
        const cookieEaterType = VALID_EATER_TYPES.includes(rawEaterType) ? rawEaterType : null;
        console.log(`[EaterType] Cookie value: ${rawEaterType}, Valid: ${cookieEaterType}`);

        let finalEaterType = null; // Use null instead of 'None' for empty

        // Check if user exists in DB
        const existingRecord = await db.query.profiles.findFirst({
            where: eq(profiles.id, userId)
        });
        console.log(`[EaterType] Existing record:`, existingRecord);

        if (existingRecord && existingRecord.eaterType) {
            // User exists with valid eaterType -> DB is source of truth
            finalEaterType = existingRecord.eaterType;

            // Set cookie to match DB
            res.cookie('user_eater_size', finalEaterType, {
                httpOnly: false,
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
                sameSite: 'lax'
            });

            console.log(`User ${userId} exists with eaterType: ${finalEaterType}`);
        } else if (cookieEaterType) {
            // User doesn't exist OR has null eaterType, but we have a valid cookie -> save to DB
            finalEaterType = cookieEaterType;

            await db.insert(profiles)
                .values({ id: userId, eaterType: cookieEaterType })
                .onConflictDoUpdate({
                    target: profiles.id,
                    set: { eaterType: cookieEaterType }
                });

            console.log(`Saved cookie value to DB: User ${userId} is ${cookieEaterType}`);
        } else {
            // No existing valid eaterType and no cookie -> create with null eaterType
            await db.insert(profiles)
                .values({ id: userId, eaterType: null })
                .onConflictDoNothing();

            console.log(`Created new profile for ${userId} with eaterType: null`);
        }

        res.json({
            success: true,
            message: "Sync complete",
            user_eater_size: finalEaterType || 'None'
        });

    } catch (err) {
        console.error("[EaterType] Database Error:", err);
        console.error("[EaterType] Error stack:", err.stack);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

/**
 * GET /eatertype
 * Fetches eater type from database for a given user.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const record = await db.query.profiles.findFirst({
            where: eq(profiles.id, userId)
        });

        const eaterType = record?.eaterType || 'None';

        res.json({
            message: 'EaterType fetch complete.',
            user_eater_size: eaterType,
            userId: userId
        });
    } catch (err) {
        console.error("Database error.", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
