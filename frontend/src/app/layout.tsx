'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadFromStorage, token, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading) {
      const isProtectedRoute = pathname.startsWith('/dashboard');
      const isAuthRoute = pathname === '/login' || pathname === '/register';
      const storedToken = localStorage.getItem('kaeapp_token');

      if (isProtectedRoute && !token && !storedToken) {
        router.push('/login');
      }
      if (isAuthRoute && (token || storedToken)) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, token, pathname, router]);

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
