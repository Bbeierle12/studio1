'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Lock } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        action: isSignUp ? 'signup' : 'login',
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
          description:
            result.error === 'CredentialsSignin'
              ? 'Invalid email or password. Please try again.'
              : 'An unexpected error occurred. Please try again.',
        });
      } else {
        toast({
          title: isSignUp ? 'Account Created' : 'Signed In',
          description: isSignUp
            ? 'You have been successfully signed up and logged in.'
            : 'Welcome back!',
        });
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='email'>Email Address</Label>
        <div className='relative'>
          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            id='email'
            name='email'
            type='email'
            placeholder='you@example.com'
            className='pl-10'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
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
            className='pl-10'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>
      <Button
        type='submit'
        className='w-full'
        disabled={loading || !email || !password}
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Please wait...
          </>
        ) : isSignUp ? (
          'Create Account'
        ) : (
          'Sign In'
        )}
      </Button>
      <p className='text-center text-sm text-muted-foreground'>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type='button'
          onClick={() => setIsSignUp(!isSignUp)}
          className='font-medium text-primary hover:underline'
          disabled={loading}
        >
          {isSignUp ? 'Sign In' : 'Create an account'}
        </button>
      </p>
    </form>
  );
}
