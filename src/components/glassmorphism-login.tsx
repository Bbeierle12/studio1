'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface WoodGrainLoginProps {
  className?: string;
}

export default function WoodGrainLogin({ className = '' }: WoodGrainLoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - integrate with your auth system
    console.log('Form submitted:', formData);
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
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-700 hover:text-amber-800 transition-colors"
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
              >
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </form>

            {/* Toggle Login/Sign Up */}
            <div className="mt-6 text-center">
              <p className="text-amber-800/70 text-sm">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-amber-800 font-semibold hover:text-amber-900 transition-colors"
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