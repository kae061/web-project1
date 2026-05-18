'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../components/design/Button';

export default function HomePage() {
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token) router.push('/dashboard');
  }, [token, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950 p-6">
      <div className="max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-[32px] text-white font-black text-5xl shadow-2xl shadow-blue-500/20 mb-4">
          K
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter text-white">
          Welcome to <span className="text-blue-500">KaeApp</span>
        </h1>
        
        <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-lg mx-auto">
          The next generation messenger for seamless, beautiful, and real-time communication.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-64">
              Login to Account
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-64">
              Join for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
