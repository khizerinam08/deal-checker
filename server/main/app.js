import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import Dominos_Deals from './domino-deals.js'
import express from 'express'
import { db } from './db/db.js'
import { deals, votes } from './db/schema.js'
import { asc, eq } from 'drizzle-orm'
import cors from 'cors'
import cookieParser from 'cookie-parser';

// Import routes
import eaterTypeRoutes from './routes/eatertype.js';
import voteRoutes from './routes/vote.js';

const app = express()
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
const port = 8000

app.use(cookieParser());
app.use(express.json());

// Use routes
app.use('/eatertype', eaterTypeRoutes);
app.use('/vote', voteRoutes);

app.post('/dominos-deals', async (req, res) => {
  // Get eater type from request body (passed from frontend cookie)
  const { eaterType } = req.body; // Will be "Small", "Medium", or "Large"
  const myType = eaterType || 'Medium';

  // Capacity Ratios - how much food each type needs relative to Medium
  const CAPACITY = {
    'Small': 0.67,   // Light eater needs 67% of Medium
    'Medium': 1.00,  // Baseline
    'Large': 1.33    // Heavy eater needs 133% of Medium
  };

  // Confidence Weights for blending
  const SAME_TYPE_WEIGHT = 1.0;   // Trust real peers 100%
  const OTHER_TYPE_WEIGHT = 0.5;  // Trust math projection 50%

  try {
    // Fetch all deals
    const dealsData = await db.query.deals.findMany({
      orderBy: [asc(deals.pricePkr)],
      with: {
        items_breakdown: true
      }
    });

    // Fetch all votes to calculate per-type averages
    const allVotes = await db.query.votes.findMany();

    // Group votes by dealId and calculate per-type averages
    const votesByDeal = {};
    for (const vote of allVotes) {
      const dealId = vote.dealId;
      if (!votesByDeal[dealId]) {
        votesByDeal[dealId] = {
          'Small': { totalScore: 0, count: 0 },
          'Medium': { totalScore: 0, count: 0 },
          'Large': { totalScore: 0, count: 0 }
        };
      }
      const voterType = vote.voterType; // 'Small', 'Medium', or 'Large'
      if (votesByDeal[dealId][voterType]) {
        votesByDeal[dealId][voterType].totalScore += parseFloat(vote.valueRating);
        votesByDeal[dealId][voterType].count += 1;
      }
    }

    // Calculate blended personalized score for each deal
    const dealsWithScores = dealsData.map(deal => {
      const myCapacity = CAPACITY[myType];
      const dealVotes = votesByDeal[deal.id] || {
        'Small': { totalScore: 0, count: 0 },
        'Medium': { totalScore: 0, count: 0 },
        'Large': { totalScore: 0, count: 0 }
      };

      // Calculate total review count for this deal
      const reviewCount = Object.values(dealVotes).reduce((sum, stats) => sum + stats.count, 0);

      let totalWeightedScore = 0;
      let totalWeight = 0;

      // Iterate through all 3 types and blend scores
      for (const [sourceType, stats] of Object.entries(dealVotes)) {
        if (stats.count === 0) continue; // Skip types with no votes

        const avgScore = stats.totalScore / stats.count;
        const sourceCapacity = CAPACITY[sourceType];

        // Project score from source type to target (my) type
        // ProjectedScore = SourceAvgScore * (SourceCapacity / TargetCapacity)
        const projectedScore = avgScore * (sourceCapacity / myCapacity);

        // Apply confidence weight (1.0 for same type, 0.5 for other types)
        const weight = sourceType === myType ? SAME_TYPE_WEIGHT : OTHER_TYPE_WEIGHT;

        totalWeightedScore += projectedScore * weight;
        totalWeight += weight;
      }

      // Calculate final blended score
      let personalizedScore = 0;
      if (totalWeight > 0) {
        personalizedScore = totalWeightedScore / totalWeight;
        // Cap at 10.0 (max score)
        personalizedScore = Math.min(personalizedScore, 10.0);
        personalizedScore = parseFloat(personalizedScore.toFixed(1));
      }

      return {
        ...deal,
        personalizedScore,
        reviewCount
      };
    });

    // Sort by personalizedScore (highest first), then by price (lowest first) as tiebreaker
    dealsWithScores.sort((a, b) => {
      if (b.personalizedScore !== a.personalizedScore) {
        return b.personalizedScore - a.personalizedScore;
      }
      return a.pricePkr - b.pricePkr;
    });

    res.json(dealsWithScores);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database fetch failed', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


