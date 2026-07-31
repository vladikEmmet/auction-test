import { XIcon } from 'lucide-react';

import { describeActiveFilters, type AuctionsSearch } from '@/features/filter-auctions';
import { Button } from '@/shared/ui/button.component';

type ActiveFiltersProps = {
  search: AuctionsSearch;
  onChange: (patch: Partial<AuctionsSearch>) => void;
  onReset: () => void;
};

export function ActiveFilters({ search, onChange, onReset }: ActiveFiltersProps) {
  const chips = describeActiveFilters(search);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Активные фильтры">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChange(chip.patch)}
          aria-label={`Убрать фильтр: ${chip.label}`}
          className="inline-flex items-center gap-1 rounded-md border border-transparent bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {chip.label}
          <XIcon className="size-3" aria-hidden />
        </button>
      ))}

      {chips.length > 1 ? (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onReset}>
          Сбросить все
        </Button>
      ) : null}
    </div>
  );
}
