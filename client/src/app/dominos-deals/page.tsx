import { PizzaDeal } from "../models/models";
import styles from './page.module.css';
import { EaterTypeModal } from "../components/eater-type-modal";
import { ChangeTypeTrigger } from '../components/change-type-trigger';
import { DealCard } from '../components/deal-card';
import { cookies } from 'next/headers';

async function getDeals(userSize: string | undefined): Promise<PizzaDeal[]> {
    const res = await fetch('http://localhost:8000/dominos-deals', {
        method: 'POST',
        cache: 'no-store', // Always get fresh data to reflect score changes
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eaterType: userSize || 'Medium' })
    });
    if (!res.ok) throw new Error('Failed to fetch deals');
    return res.json();
}

export default async function DominosDeals() {
    const cookieStore = await cookies();
    const userSizeCookie = cookieStore.get('user_eater_size');
    const userSize = userSizeCookie?.value;
    const deals: PizzaDeal[] = await getDeals(userSize);


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
                        <DealCard key={deal.id} deal={deal} />
                    ))}
                </div>
            </main>
        </>
    );
}