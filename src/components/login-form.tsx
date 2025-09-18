'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export function LoginForm() {
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // This is a placeholder for actual authentication logic.
        toast({
            title: 'Sign In (Placeholder)',
            description: "Authentication is not yet implemented. You can proceed without logging in for now.",
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="you@example.com" className="pl-10" required />
                </div>
            </div>
            <Button type="submit" className="w-full">
                Sign In with Email
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                This is a placeholder. A real magic link would be sent to your email.
            </p>
        </form>
    );
}
