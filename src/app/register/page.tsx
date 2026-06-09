'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChefHat, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const GoogleIcon = () => (
  <svg className='mr-2 h-5 w-5' viewBox='0 0 24 24'>
    <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' fill='#4285F4' />
    <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' fill='#34A853' />
    <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' fill='#FBBC05' />
    <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' fill='#EA4335' />
  </svg>
);

function RegisterForm() {
  const [formData, setFormData] = useState<RegistrationForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof RegistrationForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setServerError('');
  };

  const validateForm = (): boolean => {
    try {
      registrationSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegistrationForm, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegistrationForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors) {
          const fieldErrorMap: Partial<Record<keyof RegistrationForm, string>> = {};
          data.fieldErrors.forEach((fieldError: { field: string; message: string }) => {
            fieldErrorMap[fieldError.field as keyof RegistrationForm] = fieldError.message;
          });
          setErrors(fieldErrorMap);
        } else {
          setServerError(data.error || 'Registration failed. Please try again.');
        }
        return;
      }

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        action: 'login',
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError('Account created successfully, but sign-in failed. Please try signing in manually.');
      } else {
        toast({
          title: 'Welcome to Our Family Table!',
          description: 'Your account has been created successfully.',
        });
        router.push(redirect);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError('An unexpected error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Warm tokened ambience */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_10%,hsl(var(--meal-breakfast)/0.16)_0%,transparent_60%),radial-gradient(70%_60%_at_10%_100%,hsl(var(--meal-dinner)/0.14)_0%,transparent_55%)]"
        aria-hidden
      />
      <ChefHat
        className="pointer-events-none absolute -bottom-12 -left-10 h-72 w-72 text-foreground/[0.04]"
        strokeWidth={0.8}
        aria-hidden
      />

      <div className="relative w-full max-w-[360px] rounded-lg bg-card p-7 shadow-md3-3">
        {/* Wordmark */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-headline text-lg font-bold text-foreground">
            Our Family Table
          </span>
        </div>

        <h1 className="text-center font-headline text-2xl font-bold text-foreground">
          Create your table
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
          Start planning meals with your family
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Google first */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-border bg-card font-medium text-foreground shadow-md3-1 hover:bg-accent"
            onClick={() => signIn('google', { callbackUrl: redirect })}
            disabled={isLoading}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Bryan Beierle"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              className={errors.name ? 'border-danger' : ''}
            />
            {errors.name && <p className="text-sm text-danger">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@family.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className={errors.email ? 'border-danger' : ''}
            />
            {errors.email && <p className="text-sm text-danger">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              className={errors.password ? 'border-danger' : ''}
            />
            {errors.password && <p className="text-sm text-danger">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              className={errors.confirmPassword ? 'border-danger' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-danger">{errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have a table?{' '}
          <Link
            href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
