import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { PackageSearchIcon, TriangleAlertIcon } from 'lucide-react';
import { useMemo } from 'react';

import { auctionListQuery } from '@/entities/auction';
import {
  buildListRequest,
  clearFilters,
  type AuctionsSearch,
} from '@/features/filter-auctions';
import { isApiError } from '@/shared/api/api-error';
import { Button } from '@/shared/ui/button.component';
import { Pagination } from '@/shared/ui/pagination.component';
import { StatePanel } from '@/shared/ui/state-panel.component';
import { AuctionCard, AuctionCardSkeleton } from '@/widgets/auction-card';
import { AuctionsFilters, FiltersToolbar } from '@/widgets/auctions-filters';

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
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl">Грузовые аукционы</h1>
        <p className="text-sm text-muted-foreground">
          {query.data ? `Найдено аукционов: ${query.data.meta.total}` : 'Загружаем список…'}
        </p>
      </header>

      <FiltersToolbar
        search={search}
        onChange={update}
        onReset={() => replaceSearch(clearFilters(search))}
      />

      {/* key сбрасывает черновик фильтров при внешнем изменении URL (назад/вперёд, сброс). */}
      <AuctionsFilters
        key={JSON.stringify(search)}
        search={search}
        onApply={update}
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
