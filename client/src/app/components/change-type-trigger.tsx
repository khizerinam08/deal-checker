'use client'
import { useState } from 'react';
import { EaterTypeModal } from './eater-type-modal';
import styles from '../dominos-deals/page.module.css';

export function ChangeTypeTrigger({ currentType }: { currentType?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={styles.statusContainer}>
      <p className={styles.statusText}>
        Current Type: <strong>{currentType || 'None'}</strong>
      </p>
      <button 
        className={styles.changeBtn} 
        onClick={() => setShowModal(true)}
      >
        Change Type
      </button>

      {showModal && (
        <EaterTypeModal 
          initialOpen={true} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}