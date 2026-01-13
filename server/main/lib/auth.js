// lib/auth.js
// This file is kept for potential future use with server-side auth verification
// Currently, authentication is handled by Neon Auth on the client side
// The client sends userId from its verified session

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
});