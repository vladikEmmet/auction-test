import { SlidersHorizontalIcon } from 'lucide-react';

import {
  describeActiveFilters,
  PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  useFiltersPanelStore,
  type AuctionsSearch,
  type SortOption,
} from '@/features/filter-auctions';
import { VatToggle } from '@/features/vat-display';
import { Badge } from '@/shared/ui/badge.component';
import { Button } from '@/shared/ui/button.component';
import { Label } from '@/shared/ui/label.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select.component';
import { ActiveFilters } from '@/widgets/auctions-filters/ui/active-filters.component';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  price_asc: 'Цена ↑',
  price_desc: 'Цена ↓',
  per_km_asc: 'Цена за км ↑',
  per_km_desc: 'Цена за км ↓',
  start_time_asc: 'Начало торгов ↑',
};

type FiltersToolbarProps = {
  search: AuctionsSearch;
  onChange: (patch: Partial<AuctionsSearch>) => void;
  onReset: () => void;
  /** Развёрнутая панель фильтров прокручена — показываем кнопку вызова выезжающей. */
  showFiltersButton: boolean;
};

/**
 * Строка управления списком. Пока развёрнутая панель фильтров на экране, здесь только
 * сортировка, размер страницы и чипсы. Как только панель уезжает вверх, строка прилипает
 * под шапкой (`top-14` = её высота) и получает кнопку вызова выезжающих фильтров.
 */
export function FiltersToolbar({
  search,
  onChange,
  onReset,
  showFiltersButton,
}: FiltersToolbarProps) {
  const openFilters = useFiltersPanelStore((state) => state.open);
  const activeCount = describeActiveFilters(search).length;

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {showFiltersButton ? (
          <Button variant="outline" size="sm" onClick={openFilters}>
            <SlidersHorizontalIcon />
            Фильтры
            {activeCount > 0 ? (
              <Badge variant="default" className="ml-1">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        ) : null}

        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="sr-only sm:not-sr-only sm:text-sm sm:font-normal sm:text-muted-foreground">
            Сортировка
          </Label>
          <Select
            value={search.sort}
            onValueChange={(value) => onChange({ sort: value as SortOption, page: 1 })}
          >
            <SelectTrigger id="sort" className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="per-page" className="sr-only">
            Элементов на странице
          </Label>
          <Select
            value={String(search.per_page)}
            onValueChange={(value) =>
              onChange({ per_page: Number(value) as AuctionsSearch['per_page'], page: 1 })
            }
          >
            {/* w-20: на текст остаётся ~32px — двузначные значения не режутся. */}
            <SelectTrigger id="per-page" className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <VatToggle id="list-vat" />
      </div>

      {activeCount > 0 ? (
        <div className="mt-2">
          <ActiveFilters search={search} onChange={onChange} onReset={onReset} />
        </div>
      ) : null}
    </div>
  );
}
