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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
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
    }
    else alert(error?.message || "Login failed");
  };

  const handleSignUp = async () => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: "User Name"
    });
    if (data) {
      try {
        await handleEaterType(data);
        router.push('/');
      } catch (e) {
        console.error("Sync error:", e);
        router.push('/');
      }
    }
    else alert(error?.message || "Signup failed");
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

  return (
    <div className={styles.container}>
      {/* WorthIt Branding */}
      <Link href="/" className={styles.logo}>
        <span className={styles.logoIcon}>?</span>
        <span className={styles.logoText}>WorthIt</span>
      </Link>

      {/* Form Card */}
      <div className={styles.formCard}>
        <h1 className={styles.title}>Welcome</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={styles.inputField}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={styles.inputField}
        />

        <div className={styles.buttonGroup}>
          <button onClick={handleLogin} className={styles.loginBtn}>Login</button>
          <button onClick={handleSignUp} className={styles.signupBtn}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}