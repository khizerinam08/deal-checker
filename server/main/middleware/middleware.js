import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js"; // Your auth instance



export const requireAuth = async (req, res, next) => {
    try {
        // 1. Convert Node headers to Web Standard headers
        const headers = fromNodeHeaders(req.headers);

        // 2. Verify Session
        const session = await auth.api.getSession({
            headers: headers,
        });

        // 3. Block if invalid
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 4. Attach user to request for the next route handler
        req.session = session;

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};