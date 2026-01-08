import Dominos_Deals from './domino-deals.js'
import express from 'express'

const app = express()
const port = 8000

app.get('/dominos-deals', async (req, res) => {
    try{
        const deals = await Dominos_Deals();
        res.json(deals)
    }catch{
        res.status(500).json({error: 'Failed to load deals'});
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})