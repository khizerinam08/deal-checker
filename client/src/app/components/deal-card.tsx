'use client'

import Image from "next/image";
import { useState } from "react";
import { PizzaDeal } from "../models/models";
import { ReviewButton } from "./review-button";
import { ReviewInterface } from "./review-interface";
import styles from './deal-card.module.css';

interface DealCardProps {
    deal: PizzaDeal;
}

export function DealCard({ deal }: DealCardProps) {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const handleToggleReview = () => {
        setIsReviewOpen(!isReviewOpen);
    };

    const handleCloseReview = () => {
        setIsReviewOpen(false);
    };

    return (
        <div className={styles.cardWrapper}>
            <div className={styles.card}>
                <Image
                    src={deal.imageUrl || '/placeholder-image.jpg'}
                    alt={deal.dealName}
                    width={436}
                    height={300}
                    className={styles.image}
                />
                <div className={styles.cardContent}>
                    <h2 className={styles.dealName}>
                        <a href={deal.productUrl}>{deal.dealName}</a>
                    </h2>
                    <p className={styles.price}>Rs. {deal.pricePkr}</p>
                    <p className={styles.description}>{deal.description}</p>
                </div>
                <div className={styles.reviewButtonContainer}>
                    <ReviewButton
                        dealId={deal.id}
                        isOpen={isReviewOpen}
                        onToggle={handleToggleReview}
                    />
                </div>
            </div>

            {/* Collapsible Review Interface */}
            <div className={`${styles.reviewContainer} ${isReviewOpen ? styles.open : ''}`}>
                <div className={styles.reviewContent}>
                    <ReviewInterface
                        dealId={deal.id}
                        isOpen={isReviewOpen}
                        onClose={handleCloseReview}
                    />
                </div>
            </div>
        </div>
    );
}
