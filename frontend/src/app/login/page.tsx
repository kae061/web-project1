'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '../../components/design/Input';
import Button from '../../components/design/Button';
import { fetchAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return setError('Please enter both email and password');
    }

    setLoading(true);
    setError('');

    try {
      const result = await fetchAPI('/auth/login', 'POST', formData);
      if (result.success) {
        setToken(result.data.accessToken, result.data.refreshToken);
        setUser(result.data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md space-y-8 glass-card p-12 rounded-[40px] animate-slide-up">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-2xl shadow-primary/30">
            K
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a]">Welcome Back</h1>
          <p className="text-zinc-500 mt-3 font-medium">Please enter your details to sign in</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@example.com" 
              value={formData.email} 
              onChange={e => handleInputChange('email', e.target.value)} 
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={e => handleInputChange('password', e.target.value)} 
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 rounded-lg border-white/10 bg-dark text-primary focus:ring-primary/20 transition-all" />
              <span className="text-sm font-bold text-zinc-500 group-hover:text-zinc-700 transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-sm font-bold text-primary hover:text-blue-400 transition-colors">Forgot password?</a>
          </div>

          <Button type="submit" isLoading={loading} className="py-4.5 text-lg">
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-zinc-500 font-bold pt-4">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:text-blue-400 transition-colors underline underline-offset-8">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
