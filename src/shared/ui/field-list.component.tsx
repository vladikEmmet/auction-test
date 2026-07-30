import type * as React from 'react';

import { cn } from '@/shared/lib/cn';

export type Field = {
  label: string;
  value: React.ReactNode;
  /** Значение занимает всю ширину — для длинных строк вроде условий оплаты. */
  wide?: boolean;
};

/** Двухколоночный список «поле → значение», сворачивающийся в одну колонку на мобильных. */
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
