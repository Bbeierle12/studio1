'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface WoodGrainLoginProps {
  className?: string;
}

export default function WoodGrainLogin({ className = '' }: WoodGrainLoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login flow
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error === 'CredentialsSignin' 
            ? 'Invalid email or password' 
            : result.error
          );
        } else if (result?.ok) {
          // Success - NextAuth will handle the redirect
          window.location.reload();
        }
      } else {
        // Sign up flow - use /api/register endpoint
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to create account');
          return;
        }

        // Auto-login after successful signup
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else if (result?.ok) {
          window.location.reload();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Wood Panel with Hyperrealistic Grain */}
      <div className="wood-panel-container relative max-w-md mx-auto">
        {/* Main Wood Panel */}
        <div className="wood-panel relative p-8 rounded-lg shadow-2xl">
          {/* Wood grain layers */}
          <div className="absolute inset-0 wood-base rounded-lg"></div>
          <div className="absolute inset-0 wood-grain-primary rounded-lg"></div>
          <div className="absolute inset-0 wood-grain-secondary rounded-lg"></div>
          <div className="absolute inset-0 wood-highlights rounded-lg"></div>
          <div className="absolute inset-0 wood-shadows rounded-lg"></div>
          
          {/* Wood edge effect */}
          <div className="absolute inset-0 wood-edge rounded-lg"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-800/20 border-2 border-amber-700/30 mb-4 wood-inset">
                <User className="w-8 h-8 text-amber-800" />
              </div>
              <h1 className="text-2xl font-bold text-amber-900 mb-2 wood-text-shadow">
                Welcome Back
              </h1>
              <p className="text-amber-800/80 text-sm">
                {isLogin ? 'Sign in to access your family recipes' : 'Create your account to get started'}
              </p>
              
              {/* Demo Credentials Notice */}
              {isLogin && (
                <div className="mt-4 p-3 bg-amber-100/50 rounded-md border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium mb-1">Demo Credentials:</p>
                  <p className="text-xs text-amber-700">
                    <strong>Email:</strong> demo@familyrecipes.com<br />
                    <strong>Password:</strong> password123
                  </p>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-red-100/80 border border-red-300 text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Name Field (Sign Up Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-amber-900 text-sm font-medium wood-text-shadow">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-700" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10 wood-input"
                      required={!isLogin}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-900 text-sm font-medium wood-text-shadow">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-700" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 wood-input"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-amber-900 text-sm font-medium wood-text-shadow">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-700" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 wood-input"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-700 hover:text-amber-800 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password (Login Only) */}
              {isLogin && (
                <div className="text-right">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full wood-button"
                disabled={loading || !formData.email || !formData.password}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Toggle Login/Sign Up */}
            <div className="mt-6 text-center">
              <p className="text-amber-800/70 text-sm">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFormData({ email: '', password: '', name: '' });
                  }}
                  className="ml-2 text-amber-800 font-semibold hover:text-amber-900 transition-colors"
                  disabled={loading}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Browse Without Account */}
            <div className="mt-6 pt-6 border-t border-amber-700/20">
              <Link href="/recipes">
                <Button
                  variant="ghost"
                  className="w-full text-amber-800 hover:text-amber-900 hover:bg-amber-100/30 transition-all duration-200"
                >
                  Continue as Guest
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}