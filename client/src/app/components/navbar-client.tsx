'use client'

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoginButton } from './login-button';
import { EaterTypeModal } from './eater-type-modal';
import Cookies from 'js-cookie';
import styles from './navbar.module.css';

interface NavbarClientProps {
    initialEaterType: string | null;
    transparent?: boolean;
}

export function NavbarClient({ initialEaterType, transparent = false }: NavbarClientProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [eaterType, setEaterType] = useState<string | null>(initialEaterType);
    const [showRedirectPopup, setShowRedirectPopup] = useState(false);
    const [showEaterModal, setShowEaterModal] = useState(false);

    // Auto-detect if on landing page for transparency
    const isLandingPage = pathname === '/';
    const isTransparent = transparent || isLandingPage;

    // Update eaterType on route change or cookie change
    useEffect(() => {
        const cookieValue = Cookies.get('user_eater_size') || null;
        if (cookieValue !== eaterType) {
            setEaterType(cookieValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Check if we're on the dominos deals page
    const isOnDominosPage = pathname === '/dominos-deals';

    // Handle click on eater type badge
    const handleEaterTypeClick = () => {
        if (isOnDominosPage) {
            // On dominos page - allow changing
            setShowEaterModal(true);
        } else {
            // Not on dominos page - show redirect popup
            setShowRedirectPopup(true);
        }
    };

    // Navigate to dominos page
    const handleGoToDominos = () => {
        setShowRedirectPopup(false);
        router.push('/dominos-deals');
    };

    return (
        <>
            <nav className={`${styles.navbar} ${isTransparent ? styles.transparent : ''}`}>
                {/* Logo / Brand */}
                <Link href="/" className={styles.logo}>
                    <Image
                        src="/WorthIt logo.png"
                        alt="WorthIt"
                        width={100}
                        height={30}
                        className={styles.logoImage}
                    />
                </Link>

                {/* Right Section: Eater Type + Login */}
                <div className={styles.rightSection}>
                    {/* Eater Type Badge */}
                    <button
                        className={styles.eaterTypeBadge}
                        onClick={handleEaterTypeClick}
                        title={isOnDominosPage ? "Click to change" : "Go to Dominos page to change"}
                    >
                        <span className={styles.eaterTypeLabel}>Eater:</span>
                        <span className={styles.eaterTypeValue}>
                            {eaterType || 'None'}
                        </span>
                        {isOnDominosPage && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        )}
                    </button>

                    {/* Login Button */}
                    <LoginButton />
                </div>
            </nav>

            {/* Redirect Popup - shown when clicking eater type on non-dominos page */}
            {showRedirectPopup && (
                <div className={styles.popupBackdrop} onClick={() => setShowRedirectPopup(false)}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.popupTitle}>Change Eater Type?</h3>
                        <p className={styles.popupText}>
                            To change your eater type, you need to visit the Dominos Deals page.
                        </p>
                        <div className={styles.popupButtons}>
                            <button
                                className={styles.popupCancelBtn}
                                onClick={() => setShowRedirectPopup(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.popupGoBtn}
                                onClick={handleGoToDominos}
                            >
                                Go to Dominos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Eater Type Modal - only shown when on dominos page */}
            {showEaterModal && isOnDominosPage && (
                <EaterTypeModal
                    initialOpen={true}
                    onClose={() => setShowEaterModal(false)}
                />
            )}
        </>
    );
}
