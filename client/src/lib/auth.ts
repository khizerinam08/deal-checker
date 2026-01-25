import { createAuthClient } from "better-auth/react";
// Neon Auth is fully compatible with Better Auth clients
// You might need to install: npm install better-auth

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
    // Enable credentials for cross-origin requests (Vercel → Neon Auth)
    // This ensures cookies are sent with signOut, revokeSession, etc.
    fetchOptions: {
        credentials: "include" as RequestCredentials
    }
});
