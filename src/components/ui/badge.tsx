import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // ---- base ----
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/85',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-border text-foreground',

        // ---- status (soft) — roles, states, AQI, confidence ----
        success: 'border-transparent bg-success-muted text-success',
        warning: 'border-transparent bg-warning-muted text-warning',
        info: 'border-transparent bg-info-muted text-info',
        danger: 'border-transparent bg-danger-muted text-danger',

        // ---- status (solid) — when the badge IS the emphasis ----
        'success-solid':
          'border-transparent bg-success text-success-foreground',
        'warning-solid':
          'border-transparent bg-warning text-warning-foreground',
        'info-solid': 'border-transparent bg-info text-info-foreground',
        'danger-solid': 'border-transparent bg-danger text-danger-foreground',

        // ---- meal-type tags (soft) ----
        breakfast:
          'border-transparent bg-meal-breakfast-muted text-meal-breakfast',
        lunch: 'border-transparent bg-meal-lunch-muted text-meal-lunch',
        dinner: 'border-transparent bg-meal-dinner-muted text-meal-dinner',
        snack: 'border-transparent bg-meal-snack-muted text-meal-snack',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
