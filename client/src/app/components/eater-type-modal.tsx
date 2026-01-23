'use client'
import { useState } from "react";
import styles from "./eater-type-modal.module.css"
import Cookies from "js-cookie";
import { authClient } from "@/lib/auth";

// Define what each option looks like
export type EaterOption = {
  label: string;    // What the button says (e.g., "1-2 Slices")
  value: string;    // What we save in the cookie (e.g., "Small")
  subtext?: string; // Extra info
};

const OPTIONS: EaterOption[] = [
  { label: '1-2 Slices', value: 'Small' },
  { label: '3-4 Slices', value: 'Medium' },
  { label: '5+ Slices', value: 'Large' },
  { label: "Don't know", value: 'Medium', subtext: '(Default)' }
];

interface Props {
  initialOpen?: boolean;
  onClose?: () => void;
}

export function EaterTypeModal({ initialOpen = true, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  // 1. Change your state to track the LABEL instead of the VALUE
  // This ensures only ONE button can ever look "active"
  const [selectedLabel, setSelectedLabel] = useState<string>('3-4 Slices');

  const handleConfirm = async () => {
    // 2. Find the object that matches the selected label to get its value
    const selectedOption = OPTIONS.find(opt => opt.label === selectedLabel);
    const valueToSave = selectedOption?.value || 'Medium';

    // Set cookie first
    Cookies.set('user_eater_size', valueToSave, {
      expires: 365,
      path: '/',
      sameSite: 'lax'
    });

    // Sync with backend if user is logged in
    try {
      const session = await authClient.getSession();
      if (session?.data?.user?.id) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/eatertype`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.data.user.id })
        });
      }
    } catch (error) {
      console.error('Failed to sync eater type to DB:', error);
    }

    if (onClose) onClose();
    else setIsOpen(false);

    window.location.reload();
  }

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modalBox}>
        <h2 className={styles.title}>Welcome!</h2>
        <p className={styles.description}>
          How many slices of a large pan Dominos pizza can you eat?
        </p>

        <div className={styles.buttonList}>
          {OPTIONS.map((option) => (
            <button
              key={option.label}
              // 3. Update state based on LABEL
              onClick={() => setSelectedLabel(option.label)}
              // 4. Compare based on LABEL so "3-4 Slices" and "Don't know" stay separate
              className={`${styles.sizeButton} ${selectedLabel === option.label ? styles.activeButton : ""
                }`}
            >
              <span className={styles.labelMain}>{option.label}</span>
              {option.subtext && <span className={styles.subtext}>{option.subtext}</span>}
            </button>
          ))}
        </div>

        <button onClick={handleConfirm} className={styles.confirmButton}>
          Confirm & Explore
        </button>

        {onClose && (
          <button onClick={onClose} className={styles.cancelLink}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}