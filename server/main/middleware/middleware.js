/**
 * Middleware to verify user identity using session tokens from Neon Auth.
 * 
 * This provides secure authentication by:
 * 1. Verifying the session token exists in the neon_auth.session table
 * 2. Checking the session hasn't expired
 * 3. Extracting the user ID from the verified session
 * 4. Verifying the user exists in our profiles table
 * 
 * Session tokens are randomly generated and expire, making them secure.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import { db } from "../db/db.js";
import { profiles } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const requireAuth = async (req, res, next) => {
    try {
        // Get session token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Unauthorized - No authorization header" });
        }

        const sessionToken = authHeader.replace('Bearer ', '');

        if (!sessionToken) {
            return res.status(401).json({ error: "Unauthorized - No token provided" });
        }

        // Verify the session token against the neon_auth.session table
        // This table is managed by Neon Auth and stores all active sessions
        const sessionResult = await db.execute(sql`
            SELECT 
                s."userId",
                s."expiresAt",
                u.email
            FROM neon_auth.session s
            JOIN neon_auth.user u ON s."userId" = u.id
            WHERE s.token = ${sessionToken}
            AND s."expiresAt" > NOW()
        `);

        if (!sessionResult.rows || sessionResult.rows.length === 0) {
            return res.status(401).json({ error: "Unauthorized - Invalid or expired session" });
        }

        const sessionData = sessionResult.rows[0];
        const userId = sessionData.userId;

        // Try to get user profile (may not exist for new users)
        const userProfile = await db.query.profiles.findFirst({
            where: eq(profiles.id, userId)
        });

        // Attach user info to request (profile may be null for new users)
        req.session = {
            user: {
                id: userId,
                email: sessionData.email,
                eaterType: userProfile?.eaterType || null
            }
        };

        console.log("User authenticated via session token:", userId);

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
