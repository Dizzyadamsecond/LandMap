import React, { forwardRef } from 'react';
import { cn } from '../lib/index';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

const variants: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-4 w-full rounded',
  rect: 'h-24 w-full rounded-lg',
  circle: 'h-12 w-12 rounded-full',
};

/** Pulse shimmer placeholder (aligned to shadcn reference: animate-pulse + primary/10). */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rect', className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'animate-pulse rounded-md bg-[var(--primary)]/10',
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';
