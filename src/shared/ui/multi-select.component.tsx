import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useId } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button.component';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover.component';

export type MultiSelectOption<T extends string> = { value: T; label: string };

type MultiSelectProps<T extends string> = {
  options: readonly MultiSelectOption<T>[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

/**
 * Мультивыбор на popover + чекбоксы: Radix Select не поддерживает множественный выбор,
 * а нативный <select multiple> неудобен на мобильных.
 */
export function MultiSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Не выбрано',
  className,
  id,
}: MultiSelectProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  const toggle = (option: T) => {
    onChange(
      value.includes(option) ? value.filter((item) => item !== option) : [...value, option],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={triggerId}
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            className,
          )}
        >
          <span className={cn('truncate text-left', selectedLabels.length === 0 && 'text-muted-foreground')}>
            {selectedLabels.length === 0
              ? placeholder
              : selectedLabels.length <= 2
                ? selectedLabels.join(', ')
                : `Выбрано: ${selectedLabels.length}`}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-56 p-1">
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-sm border border-input',
                    checked && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {checked ? <CheckIcon className="size-3" /> : null}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
        {value.length > 0 ? (
          <div className="border-t border-border pt-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
              Очистить
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
