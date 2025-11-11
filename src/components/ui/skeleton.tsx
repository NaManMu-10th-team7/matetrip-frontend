import { cn } from './utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-200',
        'after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:animate-shimmer', // via-white/30 -> via-white/70
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
