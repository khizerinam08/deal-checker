
import Image from "next/image";
import { PizzaDeal } from "../models/models";
import styles from './page.module.css';

async function getDeals(): Promise<PizzaDeal[]> {
    const res = await fetch('http://localhost:8000/dominos-deals', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) throw new Error('Failed to fetch deals');

    return res.json()
}

export default async function DominosDeals(){
    
    const deals: PizzaDeal[] = await getDeals();
    deals.sort((a, b) => {
  // Simple subtraction for numerical sorting
  return a.price_pkr - b.price_pkr;
});
    return (
    <main className={styles.container}>
      <h1 className={styles.title}>Dominos Deals</h1>
      
      <div className={styles.flex}>
        {deals.map((deal) => (
          <div key={deal.deal_name} className={styles.card}>
            <Image 
                    src={deal.image_url || '/placeholder-image.jpg'} // Fallback if null
                    alt={deal.deal_name}
                    width={436}
                    height={300}
                    className="rounded-lg"
            />
            <h2 className={styles.dealName}><a href={deal.product_url}>{deal.deal_name}</a></h2>
            <p className={styles.price}>Rs. {deal.price_pkr}</p>
            <p className={styles.description}>{deal.description}</p>
          </div>
        ))}
      </div>
    </main>
  );



}