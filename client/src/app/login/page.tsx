'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// --- Helper to check if a specific cookie exists ---
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

type ViewType = 'login' | 'signup' | 'verify';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  code?: string;
  general?: string;
}

export default function LoginPage() {
  const [activeView, setActiveView] = useState<ViewType>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();

  // Clear errors when switching views
  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    setErrors({});
    if (view !== 'verify') {
      setVerificationCode('');
    }
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (activeView === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (activeView !== 'verify') {
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
    }

    if (activeView === 'signup') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (activeView === 'verify') {
      if (!verificationCode.trim()) {
        newErrors.code = 'Verification code is required';
      } else if (verificationCode.length !== 6) {
        newErrors.code = 'Code must be 6 digits';
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
      // First create the account
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: name.trim()
      });

      if (error) {
        setErrors({ general: error.message || "Signup failed. Please try again." });
        return;
      }

      if (data) {
        // Account created, now send verification email
        const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification"
        });

        if (otpError) {
          setErrors({ general: otpError.message || "Failed to send verification code" });
        } else {
          // Move to verification view
          setActiveView('verify');
        }
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Verify the email with OTP
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: verificationCode
      });

      if (error) {
        setErrors({ code: error.message || "Invalid verification code" });
      } else {
        // Email verified, get the current session
        const session = await authClient.getSession();
        if (session?.data) {
          try {
            await handleEaterType(session.data);
            router.push('/');
          } catch (e) {
            console.error("Sync error:", e);
            router.push('/');
          }
        } else {
          // Session should exist after signup + verification, redirect anyway
          router.push('/');
        }
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification"
      });

      if (error) {
        setErrors({ general: error.message || "Failed to resend code" });
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
    if (activeView === 'login') {
      handleLogin();
    } else if (activeView === 'signup') {
      handleSignUp();
    } else {
      handleVerifyCode();
    }
  };

  // Verification Code View
  if (activeView === 'verify') {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.verifyHeader}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => handleViewChange('signup')}
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className={styles.verifyTitle}>Verify Your Email</h2>
          </div>

          <p className={styles.verifyDescription}>
            We&apos;ve sent a 6-digit code to <strong>{email}</strong>
          </p>

          {errors.general && (
            <div className={styles.generalError}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="code" className={styles.inputLabel}>
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                className={`${styles.inputField} ${styles.codeInput} ${errors.code ? styles.inputError : ''}`}
                disabled={isLoading}
                autoComplete="one-time-code"
              />
              {errors.code && <span className={styles.errorMessage}>{errors.code}</span>}
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${isLoading ? styles.loadingBtn : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner}></span>
              ) : (
                'Verify & Create Account'
              )}
            </button>
          </form>

          <p className={styles.resendPrompt}>
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              className={styles.switchLink}
              onClick={handleResendCode}
              disabled={isLoading}
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Login / Signup View
  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tab} ${activeView === 'login' ? styles.tabActive : ''}`}
            onClick={() => handleViewChange('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeView === 'signup' ? styles.tabActive : ''}`}
            onClick={() => handleViewChange('signup')}
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
          {activeView === 'signup' && (
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
          {activeView === 'signup' && (
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
          {activeView === 'login' && (
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
              activeView === 'login' ? 'Sign In' : 'Continue'
            )}
          </button>
        </form>

        {/* Switch Tab Prompt */}
        <p className={styles.switchPrompt}>
          {activeView === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" className={styles.switchLink} onClick={() => handleViewChange('signup')}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className={styles.switchLink} onClick={() => handleViewChange('login')}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}