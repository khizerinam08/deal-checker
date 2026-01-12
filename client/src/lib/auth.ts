import { createAuthClient } from "better-auth/react"; 
// Neon Auth is fully compatible with Better Auth clients
// You might need to install: npm install better-auth

export const authClient = createAuthClient({
    baseURL: "https://ep-shy-hat-ah1q7xbk.neonauth.c-3.us-east-1.aws.neon.tech/neondb/auth" 
});