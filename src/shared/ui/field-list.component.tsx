import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

export type Field = {
  label: string;
  value: React.ReactNode;

  wide?: boolean;
};

export function FieldList({ fields, className }: { fields: Field[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2', className)}>
      {fields.map((field) => (
        <div key={field.label} className={cn('min-w-0', field.wide && 'sm:col-span-2')}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{field.label}</dt>
          <dd className="mt-0.5 break-words text-sm">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
