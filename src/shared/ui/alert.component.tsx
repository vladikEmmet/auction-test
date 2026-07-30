import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

const alertVariants = cva('flex gap-3 rounded-md border p-3 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-secondary/60 text-foreground',
      info: 'border-primary/25 bg-primary/8 text-foreground',
      warning: 'border-warning/40 bg-warning/12 text-foreground',
      destructive: 'border-destructive/30 bg-destructive/8 text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type AlertProps = React.ComponentProps<'div'> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('font-medium leading-tight', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-muted-foreground', className)} {...props} />;
}
