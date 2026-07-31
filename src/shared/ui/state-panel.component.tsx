import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

type StatePanelProps = {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function StatePanel({ icon: Icon, title, description, action, className }: StatePanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? <Icon className="size-8 text-muted-foreground" aria-hidden /> : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <div className="mx-auto max-w-md text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
