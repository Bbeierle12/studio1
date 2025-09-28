'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormInner() {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setServerError('');
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginForm, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        action: 'login',
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setServerError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully signed in.',
        });
        router.push(redirect);
        router.refresh();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {serverError && (
        <Alert variant='destructive'>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-2'>
        <Label htmlFor='email'>Email Address</Label>
        <div className='relative'>
          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            id='email'
            name='email'
            type='email'
            placeholder='you@example.com'
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className='text-sm text-red-500'>{errors.email}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>Password</Label>
        <div className='relative'>
          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            id='password'
            name='password'
            type='password'
            placeholder='••••••••'
            className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
            value={formData.password}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
        {errors.password && (
          <p className='text-sm text-red-500'>{errors.password}</p>
        )}
      </div>

      <Button
        type='submit'
        className='w-full'
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className='text-center text-sm text-muted-foreground space-y-2'>
        <p>
          Don&apos;t have an account?{' '}
          <Link 
            href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className='font-medium text-primary hover:underline'
          >
            Create one here
          </Link>
        </p>
        {/* Future: Add "Forgot password?" link here */}
      </div>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
