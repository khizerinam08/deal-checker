'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// --- Helper to check if a specific cookie exists ---
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

type TabType = 'login' | 'signup';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();

  // Clear errors when switching tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setErrors({});
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (activeTab === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (activeTab === 'signup') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      console.log('[Login] SignIn response:', JSON.stringify(data, null, 2));
      if (data) {
        try {
          await handleEaterType(data);
          router.push('/');
        } catch (e) {
          console.error("Sync error:", e);
          router.push('/');
        }
      } else {
        setErrors({ general: error?.message || "Invalid email or password" });
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: name.trim()
      });
      if (data) {
        try {
          await handleEaterType(data);
          router.push('/');
        } catch (e) {
          console.error("Sync error:", e);
          router.push('/');
        }
      } else {
        setErrors({ general: error?.message || "Signup failed. Please try again." });
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  interface User {
    id: string;
    email: string;
  }

  interface SessionData {
    token?: string | null;
    user?: User;
  }

  const handleEaterType = async (sessionData: SessionData) => {
    console.log('[EaterType] Sending token:', sessionData?.token);
    // Read cookie value and send in body (cross-origin cookies don't work reliably)
    const cookieEaterType = getCookie('user_eater_size');
    console.log('[EaterType] Cookie eaterType:', cookieEaterType);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/eatertype`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData?.token || ''}`
      },
      body: JSON.stringify({ eaterType: cookieEaterType || null })
    });

    if (!res.ok) throw new Error('Failed to sync eater type');

    const data = await res.json();
    const { user_eater_size } = data;

    const existingCookie = getCookie('user_eater_size');

    if (!existingCookie && user_eater_size !== 'None') {
      document.cookie = `user_eater_size=${user_eater_size}; path=/; max-age=604800; SameSite=Lax`;
      console.log("Cookie was missing. Set to:", user_eater_size);
    }

    return data;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'login') {
      handleLogin();
    } else {
      handleSignUp();
    }
  };

  return (
    <div className={styles.container}>
     

      {/* Form Card */}
      <div className={styles.formCard}>
        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'signup' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('signup')}
          >
            Create Account
          </button>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className={styles.generalError}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name Field (Signup only) */}
          {activeTab === 'signup' && (
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.inputLabel}>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={`${styles.inputField} ${errors.name ? styles.inputError : ''}`}
                disabled={isLoading}
              />
              {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
            </div>
          )}

          {/* Email Field */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${styles.inputField} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
          </div>

          {/* Password Field */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`${styles.inputField} ${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
          </div>

          {/* Confirm Password Field (Signup only) */}
          {activeTab === 'signup' && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.inputLabel}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`${styles.inputField} ${errors.confirmPassword ? styles.inputError : ''}`}
                disabled={isLoading}
              />
              {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
            </div>
          )}

          {/* Forgot Password (Login only) */}
          {activeTab === 'login' && (
            <div className={styles.forgotPasswordWrapper}>
              <button type="button" className={styles.forgotPassword}>
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`${styles.submitBtn} ${isLoading ? styles.loadingBtn : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner}></span>
            ) : (
              activeTab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Switch Tab Prompt */}
        <p className={styles.switchPrompt}>
          {activeTab === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" className={styles.switchLink} onClick={() => handleTabChange('signup')}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className={styles.switchLink} onClick={() => handleTabChange('login')}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}