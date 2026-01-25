'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth';
import Cookies from 'js-cookie';
import styles from './login-button.module.css';

export function LoginButton() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const pathName = usePathname();

    // Check auth state on mount - disable cookie cache to get fresh state
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Use disableCookieCache to bypass Better Auth's cookie cache
                // This ensures we always get the fresh session state from the server
                const session = await authClient.getSession({
                    query: { disableCookieCache: true }
                });
                setIsLoggedIn(!!session?.data?.user);
            } catch {
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [pathName]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleLogin = () => {
        router.push('/login');
        setIsOpen(false);
    };

    const handleLogout = async () => {
        // Prevent multiple clicks while logging out
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);
            // Clear local state immediately before async operations
            setIsLoggedIn(false);
            setIsOpen(false);

            // Clear the eater type cookie for privacy
            Cookies.remove('user_eater_size', { path: '/' });

            // Try to sign out from Neon Auth (may fail in cross-origin scenarios)
            try {
                await authClient.signOut();
            } catch (signOutError) {
                console.warn('Neon Auth signOut failed (session may be cleared on server):', signOutError);
            }

            // Force a full page reload to ensure fresh session state
            // If already on home page, reload. Otherwise, navigate to home.
            if (window.location.pathname === '/') {
                window.location.reload();
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
            // Force redirect anyway
            window.location.href = '/';
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(`.${styles.container}`)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={styles.container}>
            {/* The User Icon (Trigger) */}
            <button onClick={toggleDropdown} className={styles.iconButton} aria-label="User menu">
                {/* Simple SVG User Icon */}
                <svg
                    width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </button>

            {/* The Dropdown Menu */}
            {isOpen && (
                <div className={styles.dropdown}>
                    {isLoading ? (
                        <span className={styles.menuItem}>Loading...</span>
                    ) : isLoggingOut ? (
                        <span className={styles.menuItem}>Logging out...</span>
                    ) : isLoggedIn ? (
                        <button onClick={handleLogout} className={styles.menuItem}>
                            Log Out
                        </button>
                    ) : (
                        <button onClick={handleLogin} className={styles.menuItem}>
                            Log In
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}