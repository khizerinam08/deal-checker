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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await authClient.signIn.email({ email, password });
    if (data){
        try {
            await handleEaterType(data);
            router.push('/');
        } catch (e) {
            console.error("Sync error:", e);
            // Optional: redirect anyway if you want to let them in despite sync fail
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

  // Interfaces defined here
  interface User {
    id: string;
    email: string;
  }
  
  interface SessionData {
    token?: string | null;
    user?: User;
  }

  const handleEaterType = async (sessionData: SessionData) => {
    const res = await fetch('http://localhost:8000/eatertype', {
        method: 'POST',
        credentials: 'include', // Sends existing cookies to backend
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData?.token || ''}`
        },
        body: JSON.stringify({
            userId: sessionData?.user?.id,
        })
    });

    if (!res.ok) throw new Error('Failed to fetch user data');

    // 1. Await the JSON response properly
    const data = await res.json();
    const { user_eater_size } = data; // Extract the type sent from backend

    // 2. Check if browser cookie is missing, and if backend provided a value
    const existingCookie = getCookie('user_eater_size');

    if (!existingCookie && user_eater_size !== 'None') {
        // 3. Set the cookie manually
        // max-age=604800 (1 week)
        document.cookie = `user_eater_size=${user_eater_size}; path=/; max-age=604800; SameSite=Lax`;
        console.log("Cookie was missing. Set to:", user_eater_size);
    }

    return data;
  }

  return (
    <div className={styles.container}>
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
  );
}