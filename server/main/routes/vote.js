import express from 'express';
import { db } from '../db/db.js';
import { votes, deals } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/middleware.js';

const router = express.Router();

// Valid voter types (must match the enum in schema)
const VALID_VOTER_TYPES = ['Small', 'Medium', 'Large'];

/**
 * GET /vote/:dealId
 * Check if the current user has already voted on a deal.
 * Returns the existing vote if found.
 */
router.get('/:dealId', requireAuth, async (req, res) => {
    try {
        const { dealId } = req.params;

        // Get userId from authenticated session - NOT from request body
        const userId = req.session.user.id;

        if (!dealId) {
            return res.status(400).json({
                error: 'Missing required parameter: dealId'
            });
        }

        // Check for existing vote
        const existingVote = await db.query.votes.findFirst({
            where: and(
                eq(votes.userId, userId),
                eq(votes.dealId, parseInt(dealId))
            )
        });

        if (existingVote) {
            return res.json({
                hasVoted: true,
                vote: {
                    satietyRating: parseFloat(existingVote.satietyRating),
                    valueRating: parseFloat(existingVote.valueRating),
                    voterType: existingVote.voterType,
                    createdAt: existingVote.createdAt
                }
            });
        }

        return res.json({
            hasVoted: false,
            vote: null
        });

    } catch (err) {
        console.error('Get Vote Error:', err);
        res.status(500).json({ error: 'Failed to get vote', details: err.message });
    }
});

/**
 * POST /vote
 * Submit or update a vote for a deal.
 * 
 * Request body:
 * - dealId: number (required)
 * - satietyRating: number (required) - multiplier values like 0.7, 1.0, 1.5, 2.5
 * - valueRating: number (required) - value score like 2.0, 6.0, 10.0
 * - eaterType: string (required) - 'Small', 'Medium', or 'Large'
 * 
 * Note: userId is obtained from the authenticated session, NOT from request body
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { dealId, satietyRating, valueRating, eaterType } = req.body;

        // Get userId from authenticated session - NOT from request body
        const userId = req.session.user.id;

        // Validate required fields (userId comes from session now)
        if (!dealId || satietyRating === undefined || valueRating === undefined || !eaterType) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['dealId', 'satietyRating', 'valueRating', 'eaterType']
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

        // Check for existing vote from this user on this deal
        const existingVote = await db.query.votes.findFirst({
            where: and(
                eq(votes.userId, userId),
                eq(votes.dealId, parseInt(dealId))
            )
        });

        let resultVote;
        let isUpdate = false;

        if (existingVote) {
            // Update the existing vote
            const updatedVote = await db.update(votes)
                .set({
                    voterType: voterType,
                    valueRating: valueRating.toString(),
                    satietyRating: satietyRating.toString(),
                })
                .where(eq(votes.voteId, existingVote.voteId))
                .returning();

            resultVote = updatedVote[0];
            isUpdate = true;
            console.log(`Vote updated: User ${userId} updated vote on deal ${dealId}`);
        } else {
            // Insert new vote
            const newVote = await db.insert(votes).values({
                userId: userId,
                dealId: parseInt(dealId),
                voterType: voterType,
                valueRating: valueRating.toString(),
                satietyRating: satietyRating.toString(),
            }).returning();

            resultVote = newVote[0];
            console.log(`Vote recorded: User ${userId} voted on deal ${dealId}`);
        }

        // Recalculate aggregations for this deal
        await recalculateDealAggregations(dealId);

        res.status(isUpdate ? 200 : 201).json({
            success: true,
            message: isUpdate ? 'Vote updated successfully' : 'Vote recorded successfully',
            vote: resultVote,
            isUpdate: isUpdate
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
