import express from 'express';
import { db } from '../db/db.js';
import { votes, deals } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Valid voter types (must match the enum in schema)
const VALID_VOTER_TYPES = ['Small', 'Medium', 'Large'];

/**
 * POST /vote
 * Submit a vote for a deal.
 * 
 * Request body:
 * - userId: string (required) - from client session
 * - dealId: number (required)
 * - satietyRating: number (required) - multiplier values like 0.7, 1.0, 1.5, 2.5
 * - valueRating: number (required) - value score like 2.0, 6.0, 10.0
 * - eaterType: string (required) - 'Small', 'Medium', or 'Large'
 */
router.post('/', async (req, res) => {
    try {
        const { userId, dealId, satietyRating, valueRating, eaterType } = req.body;

        // Validate required fields
        if (!userId || !dealId || satietyRating === undefined || valueRating === undefined || !eaterType) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'dealId', 'satietyRating', 'valueRating', 'eaterType']
            });
        }

        // Validate eaterType
        if (!VALID_VOTER_TYPES.includes(eaterType)) {
            return res.status(400).json({
                error: 'Invalid eaterType',
                valid: VALID_VOTER_TYPES
            });
        }

        // Map eaterType to voterType enum value
        const voterType = eaterType;

        // Insert the vote
        const newVote = await db.insert(votes).values({
            userId: userId,
            dealId: parseInt(dealId), // Ensure it's an integer
            voterType: voterType,
            valueRating: valueRating.toString(),
            satietyRating: satietyRating.toString(),
        }).returning();

        console.log(`Vote recorded: User ${userId} voted on deal ${dealId}`);

        // Recalculate aggregations for this deal
        await recalculateDealAggregations(dealId);

        res.status(201).json({
            success: true,
            message: 'Vote recorded successfully',
            vote: newVote[0]
        });

    } catch (err) {
        console.error('Vote Error:', err);
        res.status(500).json({ error: 'Failed to record vote', details: err.message });
    }
});

/**
 * Recalculate the aggregation fields for a deal based on all votes.
 * Updates: baseValueScore, multiplierLight, multiplierMedium, multiplierHeavy
 */
async function recalculateDealAggregations(dealId) {
    try {
        // Get all votes for this deal
        const dealVotes = await db.query.votes.findMany({
            where: eq(votes.dealId, parseInt(dealId))
        });

        if (dealVotes.length === 0) {
            return; // No votes to aggregate
        }

        // Calculate average value rating (baseValueScore)
        const totalValueRating = dealVotes.reduce((sum, vote) => sum + parseFloat(vote.valueRating), 0);
        const avgValueRating = totalValueRating / dealVotes.length;

        // Calculate average satiety rating per voter type
        const votesByType = {
            Small: dealVotes.filter(v => v.voterType === 'Small'),
            Medium: dealVotes.filter(v => v.voterType === 'Medium'),
            Large: dealVotes.filter(v => v.voterType === 'Large'),
        };

        const calculateAvgSatiety = (typeVotes) => {
            if (typeVotes.length === 0) return 1.0; // Default multiplier
            const total = typeVotes.reduce((sum, vote) => sum + parseFloat(vote.satietyRating), 0);
            return total / typeVotes.length;
        };

        const multiplierSmall = calculateAvgSatiety(votesByType.Small);
        const multiplierMedium = calculateAvgSatiety(votesByType.Medium);
        const multiplierLarge = calculateAvgSatiety(votesByType.Large);

        // Update the deal with new aggregations
        await db.update(deals)
            .set({
                baseValueScore: avgValueRating,
                multiplierLight: multiplierSmall,
                multiplierMedium: multiplierMedium,
                multiplierHeavy: multiplierLarge,
            })
            .where(eq(deals.id, parseInt(dealId)));

        console.log(`Aggregations updated for deal ${dealId}:`, {
            baseValueScore: avgValueRating,
            multiplierLight: multiplierSmall,
            multiplierMedium: multiplierMedium,
            multiplierHeavy: multiplierLarge,
        });

    } catch (err) {
        console.error('Aggregation Error:', err);
        // Don't throw - vote was still recorded successfully
    }
}

export default router;
