'use client'

import styles from './value-score.module.css';

interface ValueScoreProps {
  score?: number;
  reviewCount?: number;
}

export function ValueScore({ score, reviewCount = 0 }: ValueScoreProps) {
  // Determine color class based on score range
  const getScoreClass = () => {
    if (score === undefined || score === null) return styles.noScore;
    if (score >= 7) return styles.excellent;
    if (score >= 5) return styles.good;
    if (score >= 3) return styles.fair;
    return styles.poor;
  };

  if (score === undefined || score === null || score === 0) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.badge}>No Score</span>
        <span className={styles.reviewCount}>({reviewCount} reviews)</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.badge} ${getScoreClass()}`}>
        <span className={styles.value}>{score.toFixed(1)}</span>
        <span className={styles.label}>/10</span>
      </div>
      <span className={styles.reviewCount}>({reviewCount} reviews)</span>
    </div>
  );
}