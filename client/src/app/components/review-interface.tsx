'use client'
import { useState, useEffect } from "react";
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

interface ExistingVote {
  satietyRating: number;
  valueRating: number;
  voterType: string;
  createdAt: string;
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

// Cache for recently submitted votes to prevent race conditions
interface SubmittedVote {
  satiety: number;
  value: number;
  timestamp: number;
}

// Use a Map to store submitted votes by dealId
const submittedVotesCache = new Map<number, SubmittedVote>();

export function ReviewInterface({ dealId, isOpen, onClose }: ReviewInterfaceProps) {
  const { data: session } = authClient.useSession();
  const [satiety, setSatiety] = useState<number | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isReady = satiety !== null && value !== null;


  // Fetch existing vote when modal opens
  useEffect(() => {
    async function fetchExistingVote() {
      if (!isOpen || !session?.user) return;

      // First, check if we have a recently submitted vote in cache (within last 5 seconds)
      const cachedVote = submittedVotesCache.get(dealId);
      if (cachedVote && Date.now() - cachedVote.timestamp < 5000) {
        console.log('[ReviewInterface] Using cached vote:', cachedVote);
        setSatiety(cachedVote.satiety);
        setValue(cachedVote.value);
        setIsEditing(true);
        return;
      }

      console.log('[ReviewInterface] Fetching vote for deal:', dealId);
      console.log('[ReviewInterface] Session object:', JSON.stringify(session, null, 2));
      setIsLoading(true);
      try {
        // Add timestamp to prevent browser caching
        const response = await fetch(`http://localhost:8000/vote/${dealId}?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session?.token}`,
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[ReviewInterface] Server response:', data);

          if (data.hasVoted && data.vote) {
            // Find the closest matching option values
            // This handles floating point precision issues (e.g., 0.7 vs 0.70000001)
            const matchSatiety = SATIETY_OPTIONS.find(
              opt => Math.abs(opt.value - data.vote.satietyRating) < 0.01
            );
            const matchValue = VALUE_OPTIONS.find(
              opt => Math.abs(opt.value - data.vote.valueRating) < 0.01
            );

            console.log('[ReviewInterface] Matched satiety:', matchSatiety?.value, 'from', data.vote.satietyRating);
            console.log('[ReviewInterface] Matched value:', matchValue?.value, 'from', data.vote.valueRating);

            // Pre-populate with the matched option values
            setSatiety(matchSatiety?.value ?? null);
            setValue(matchValue?.value ?? null);
            setIsEditing(true);
          } else {
            // Reset for new vote
            setSatiety(null);
            setValue(null);
            setIsEditing(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch existing vote", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExistingVote();
  }, [isOpen, dealId, session?.user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSatiety(null);
      setValue(null);
      setIsEditing(false);
    }
  }, [isOpen]);

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
          'Authorization': `Bearer ${session.session?.token}`,
        },
        body: JSON.stringify({
          // userId is now obtained from session on the backend
          dealId,
          satietyRating: satiety,
          valueRating: value,
          eaterType,
        }),
      });

      if (response.ok) {
        // Cache the submitted vote to prevent race conditions when modal reopens
        submittedVotesCache.set(dealId, {
          satiety: satiety!,
          value: value!,
          timestamp: Date.now(),
        });
        console.log('[ReviewInterface] Cached submitted vote:', { satiety, value });
        onClose();
      }
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Determine button text based on state
  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    if (isSubmitting) return isEditing ? 'Updating...' : 'Posting...';
    if (!isReady) return 'Select options to finish';
    return isEditing ? 'Update Review' : 'Submit Review';
  };

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{isEditing ? 'Edit Your Review' : 'Rate this Deal'}</h2>
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

        {isLoading ? (
          <div className={styles.loadingState}>Loading your previous review...</div>
        ) : (
          <>
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
              disabled={!isReady || isSubmitting || isLoading}
              onClick={handleSubmit}
              className={styles.submitBtn}
            >
              {getButtonText()}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
