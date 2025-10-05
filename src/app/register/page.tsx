'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChefHat } from 'lucide-react';
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
    
    // Clear error when user starts typing
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
      // Use our custom registration API endpoint
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
          // Handle field-specific validation errors
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

      // Registration successful, now sign in the user
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
  };  return (
    <div className='container mx-auto flex h-full flex-col items-center justify-center py-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary'>
            <ChefHat className='h-8 w-8 text-primary-foreground' />
          </div>
          <CardTitle className='text-3xl font-headline'>Create your account</CardTitle>
          <CardDescription>
            Start sharing and preserving family recipes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {serverError && (
              <Alert variant='destructive'>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='Enter your full name'
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className='text-sm text-red-500'>{errors.name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='Enter your email address'
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className='text-sm text-red-500'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='Create a secure password'
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className='text-sm text-red-500'>{errors.password}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                placeholder='Confirm your password'
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className='text-sm text-red-500'>{errors.confirmPassword}</p>
              )}
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <p className='text-muted-foreground'>
              Already have an account?{' '}
              <Link 
                href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className='font-medium text-primary hover:underline'
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className='mt-4 text-xs text-center text-muted-foreground'>
            <p>
              By creating an account, you agree to preserve culinary traditions and share the joy of family cooking.
            </p>
          </div>
        </CardContent>
      </Card>
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
      <div className='flex h-full flex-grow items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}