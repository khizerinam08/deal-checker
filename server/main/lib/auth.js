// lib/auth.js
// This file configures Better Auth to verify sessions from Neon Auth

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db.js";

export const auth = betterAuth({
    baseURL: process.env.NEON_AUTH_URL,
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
});

