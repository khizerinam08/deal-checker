import Image from "next/image";
import { PizzaDeal } from "../models/models";
import styles from './page.module.css';
import { EaterTypeModal } from "../components/eater-type-modal";
import { ChangeTypeTrigger } from '../components/change-type-trigger';
import { cookies } from 'next/headers';

async function getDeals(): Promise<PizzaDeal[]> {
    const res = await fetch('http://localhost:8000/dominos-deals', {
        next: { revalidate: 60 } // Better than manual cache headers
    });
    if (!res.ok) throw new Error('Failed to fetch deals');
    return res.json();
}

export default async function DominosDeals() {
    const deals: PizzaDeal[] = await getDeals();
    const cookieStore = await cookies();
    const userSize = cookieStore.get('user_eater_size');

    return (
        <>
            {!userSize && <EaterTypeModal />}
            <main className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Dominos Deals</h1>
                    {/* Only show trigger if they have an existing selection */}
                    </div>

                <div className={styles.flex}>
                    {deals.map((deal) => (
                        <div key={deal.id} className={styles.card}>
                            <Image 
                                src={deal.imageUrl || '/placeholder-image.jpg'} 
                                alt={deal.dealName}
                                width={436}
                                height={300}
                                className="rounded-lg"
                            />
                            <h2 className={styles.dealName}>
                                <a href={deal.productUrl}>{deal.dealName}</a>
                            </h2>
                            <p className={styles.price}>Rs. {deal.pricePkr}</p>
                            <p className={styles.description}>{deal.description}</p>
                        </div>
                    ))}
                </div>
            </main>
        </>
    );
}