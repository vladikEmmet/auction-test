import { FilterIcon, RotateCcwIcon, SearchIcon } from 'lucide-react';

import { hasActiveFilters, type AuctionsSearch } from '@/features/filter-auctions';
import { Badge } from '@/shared/ui/badge.component';
import { Button } from '@/shared/ui/button.component';
import { FiltersForm } from '@/widgets/auctions-filters/ui/filters-form.component';

type FiltersPanelProps = {
  search: AuctionsSearch;
  onApply: (next: Partial<AuctionsSearch>) => void;
  onReset: () => void;
};

/**
 * Развёрнутая панель фильтров в начале страницы. Пока она на экране, компактная кнопка
 * в липкой строке не нужна — та появляется только когда панель прокручена (см. useOutOfView).
 */
export function FiltersPanel({ search, onApply, onReset }: FiltersPanelProps) {
  const activeFilters = hasActiveFilters(search);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <FilterIcon className="size-4" aria-hidden />
        Фильтры
        {activeFilters ? <Badge variant="default">активны</Badge> : null}
      </h2>

      <FiltersForm search={search} onApply={onApply} columns={4}>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcwIcon /> Сбросить
          </Button>
          <Button type="submit">
            <SearchIcon /> Применить
          </Button>
        </div>
      </FiltersForm>
    </section>
  );
}
