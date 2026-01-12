import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import Dominos_Deals from './domino-deals.js'
import express from 'express'
import { db } from './db/db.js'
import { deals } from './db/schema.js'
import { asc } from 'drizzle-orm'
import cors from 'cors'
import cookieParser from 'cookie-parser';

// Import routes
import eaterTypeRoutes from './routes/eatertype.js';

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

app.get('/dominos-deals', async (req, res) => {
  try {
    const data = await db.query.deals.findMany({
      orderBy: [asc(deals.pricePkr)],
      with: {
        items_breakdown: true // This automatically joins the two tables for you
      }
    });
    
    res.json(data);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database fetch failed', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


