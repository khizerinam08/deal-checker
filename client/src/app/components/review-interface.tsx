'use client'
import { useState } from "react";
import { authClient } from '@/lib/auth';
import { X, Check, Cookie, Utensils, Zap, ThumbsDown, DollarSign } from 'lucide-react';
import styles from './review-interface.module.css'; // Import the CSS Module

// --- Configuration with Class Mapping ---
// We map the option directly to the style class name in the module
const SATIETY_OPTIONS = [
  { label: 'Still Hungry', value: 2.5, icon: <Utensils size={20} />, activeClass: 'activeRed' },
  { label: 'Almost', value: 1.5, icon: <Cookie size={20} />, activeClass: 'activeOrange' },
  { label: 'Perfect', value: 1.0, icon: <Check size={20} />, activeClass: 'activeGreen' },
  { label: 'Stuffed', value: 0.7, icon: <Zap size={20} />, activeClass: 'activePurple' },
];

const VALUE_OPTIONS = [
  { label: 'Rip-off', value: 2.0, icon: <ThumbsDown size={20} />, activeClass: 'activeGrey' },
  { label: 'Fair', value: 6.0, icon: <DollarSign size={20} />, activeClass: 'activeBlue' },
  { label: 'Steal!', value: 10.0, icon: <Zap size={20} />, activeClass: 'activeGold' },
];

interface ReviewInterfaceProps {
  dealId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  eaterType: string;
}

interface SessionData {
  token?: string | null;
  user?: User;
}

// Helper function to parse cookies
function getCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  return document.cookie
    .split('; ')
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookie) => {
      const [name, ...rest] = cookie.split('=');
      acc[name] = rest.join('=');
      return acc;
    }, {});
}

export function ReviewInterface({ dealId, isOpen, onClose }: ReviewInterfaceProps) {
  const { data: session } = authClient.useSession();
  const [satiety, setSatiety] = useState<number | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReady = satiety !== null && value !== null;

  const handleSubmit = async () => {
    if (!session || !isReady) return;
    setIsSubmitting(true);
    try {
      // Get eaterType from cookies
      const cookies = getCookies();
      const eaterType = cookies['user_eater_size'] || 'Medium'; // Default to Medium if not set

      const response = await fetch('http://localhost:8000/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id, // Pass userId from client session
          dealId,
          satietyRating: satiety,
          valueRating: value,
          eaterType,
        }),
      });
      if (response.ok) onClose();
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Rate this Deal</h2>
          {session?.user ? (
            <div className={styles.contextBadge}>
              <span className={styles.contextLabel}>Posting as:</span>
              <span className={styles.contextTag}>
                {getCookies()['user_eater_size'] || 'Medium'}
              </span>
            </div>
          ) : (
            <span className={styles.signInWarning}>Please sign in to vote</span>
          )}
        </div>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>

        {/* SECTION 1: SATIETY */}
        <div>
          <label className={styles.sectionLabel}>Did it fill you up?</label>
          <div className={styles.satietyGrid}>
            {SATIETY_OPTIONS.map((opt) => {
              const isSelected = satiety === opt.value;
              // Combine base class with active class if selected
              const btnClass = `${styles.optionBtn} ${isSelected ? styles[opt.activeClass] : ''}`;

              return (
                <button
                  key={opt.label}
                  onClick={() => setSatiety(opt.value)}
                  className={btnClass}
                >
                  <div>{opt.icon}</div>
                  <span className={styles.optionLabel}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: VALUE */}
        <div>
          <label className={styles.sectionLabel}>Was the price fair?</label>
          <div className={styles.valueGrid}>
            {VALUE_OPTIONS.map((opt) => {
              const isSelected = value === opt.value;
              const btnClass = `${styles.optionBtn} ${isSelected ? styles[opt.activeClass] : ''}`;

              return (
                <button
                  key={opt.label}
                  onClick={() => setValue(opt.value)}
                  className={btnClass}
                >
                  <div>{opt.icon}</div>
                  <span className={styles.optionLabel}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Button */}
        <button
          disabled={!isReady || isSubmitting}
          onClick={handleSubmit}
          className={styles.submitBtn}
        >
          {isSubmitting ? 'Posting...' : isReady ? 'Submit Review' : 'Select options to finish'}
        </button>

      </div>
    </div>
  );
}