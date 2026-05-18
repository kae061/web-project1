'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '../../components/design/Input';
import Button from '../../components/design/Button';
import { fetchAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
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
    
    // Client-side validation
    if (!formData.username || !formData.email || !formData.password) {
      return setError('All fields are required');
    }
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords don’t match');
    }

    setLoading(true);
    setError('');

    try {
      const result = await fetchAPI('/auth/register', 'POST', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword
      });

      if (result.success) {
        setToken(result.data.accessToken, result.data.refreshToken);
        setUser(result.data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-lg space-y-8 glass-card p-12 rounded-[48px] animate-slide-up shadow-2xl shadow-black/50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-[20px] flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-xl shadow-primary/20">
            K
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Create Account</h1>
          <p className="text-zinc-500 mt-3 font-medium">Start your premium messaging journey</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <Input 
              label="Username" 
              placeholder="johndoe" 
              value={formData.username} 
              onChange={e => handleInputChange('username', e.target.value)} 
            />
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@example.com" 
              value={formData.email} 
              onChange={e => handleInputChange('email', e.target.value)} 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={e => handleInputChange('password', e.target.value)} 
              />
              <Input 
                label="Confirm" 
                type="password" 
                placeholder="••••••••" 
                value={formData.confirmPassword} 
                onChange={e => handleInputChange('confirmPassword', e.target.value)} 
              />
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer group px-1">
            <input type="checkbox" required className="w-5 h-5 rounded-lg border-white/10 bg-dark text-primary focus:ring-primary/20 transition-all" />
            <span className="text-sm font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors">
              I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a>
            </span>
          </label>

          <Button type="submit" isLoading={loading} className="py-4.5 text-lg mt-4 shadow-2xl">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-zinc-500 font-bold pt-2">
          Already have account?{' '}
          <Link href="/login" className="text-primary hover:text-blue-400 transition-colors underline underline-offset-8">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
