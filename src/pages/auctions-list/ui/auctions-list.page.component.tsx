import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { PackageSearchIcon, TriangleAlertIcon } from 'lucide-react';
import { useMemo } from 'react';

import { auctionListQuery } from '@/entities/auction';
import {
  buildListRequest,
  clearFilters,
  PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  type AuctionsSearch,
  type SortOption,
} from '@/features/filter-auctions';
import { VatToggle } from '@/features/vat-display';
import { isApiError } from '@/shared/api/api-error';
import { Button } from '@/shared/ui/button.component';
import { Label } from '@/shared/ui/label.component';
import { Pagination } from '@/shared/ui/pagination.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select.component';
import { StatePanel } from '@/shared/ui/state-panel.component';
import { AuctionCard, AuctionCardSkeleton } from '@/widgets/auction-card';
import { ActiveFilters, AuctionsFilters } from '@/widgets/auctions-filters';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  price_asc: 'Цена ↑',
  price_desc: 'Цена ↓',
  per_km_asc: 'Цена за км ↑',
  per_km_desc: 'Цена за км ↓',
  start_time_asc: 'Начало торгов ↑',
};

export function AuctionsListPage() {
  const search = useSearch({ from: '/auctions' });
  const navigate = useNavigate({ from: '/auctions' });

  const request = useMemo(() => buildListRequest(search), [search]);
  const query = useQuery(auctionListQuery(request));

  const update = (patch: Partial<AuctionsSearch>) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch }) });
  };

  const replaceSearch = (next: AuctionsSearch) => {
    void navigate({ search: () => next });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Грузовые аукционы</h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `Найдено аукционов: ${query.data.meta.total}` : 'Загружаем список…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <VatToggle id="list-vat" />

          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="text-sm font-normal text-muted-foreground">
              Сортировка
            </Label>
            <Select
              value={search.sort}
              onValueChange={(value) => update({ sort: value as SortOption, page: 1 })}
            >
              <SelectTrigger id="sort" className="w-44">
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
            <Label htmlFor="per-page" className="text-sm font-normal text-muted-foreground">
              На странице
            </Label>
            <Select
              value={String(search.per_page)}
              onValueChange={(value) =>
                update({ per_page: Number(value) as AuctionsSearch['per_page'], page: 1 })
              }
            >
              <SelectTrigger id="per-page" className="w-20">
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
        </div>
      </header>

      {/* key сбрасывает черновик фильтров при внешнем изменении URL (назад/вперёд, сброс). */}
      <AuctionsFilters
        key={JSON.stringify(search)}
        search={search}
        onApply={update}
        onReset={() => replaceSearch(clearFilters(search))}
      />

      <ActiveFilters
        search={search}
        onChange={update}
        onReset={() => replaceSearch(clearFilters(search))}
      />

      {query.isPending ? (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-busy
          aria-label="Загрузка аукционов"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <AuctionCardSkeleton key={index} />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          icon={TriangleAlertIcon}
          title="Не удалось загрузить аукционы"
          description={
            isApiError(query.error)
              ? `${query.error.message}${query.error.traceId ? ` (trace ${query.error.traceId})` : ''}`
              : 'Неизвестная ошибка запроса.'
          }
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              Повторить
            </Button>
          }
        />
      ) : query.data.items.length === 0 ? (
        <StatePanel
          icon={PackageSearchIcon}
          title="Аукционы не найдены"
          description="По заданным фильтрам ничего нет. Попробуйте ослабить условия поиска."
          action={
            <Button variant="outline" onClick={() => replaceSearch(clearFilters(search))}>
              Сбросить фильтры
            </Button>
          }
        />
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ${
              query.isFetching ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {query.data.items.map((auction) => (
              <AuctionCard key={auction.uuid} auction={auction} />
            ))}
          </div>

          <Pagination
            page={query.data.meta.current_page}
            lastPage={query.data.meta.last_page}
            total={query.data.meta.total}
            from={query.data.meta.from}
            to={query.data.meta.to}
            onPageChange={(page) => {
              update({ page });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
