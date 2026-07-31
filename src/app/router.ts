import type { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@/app/providers/query-client';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  type SearchSchemaInput,
} from '@tanstack/react-router';
import { lazy } from 'react';
import { z } from 'zod';

import { NotFound } from '@/app/ui/not-found.component';
import { RootLayout } from '@/app/ui/root-layout.component';
import { parseAuctionsSearch, type AuctionsSearch } from '@/features/filter-auctions';

export type RouterContext = { queryClient: QueryClient };

/**
 * Страницы грузятся отдельными чанками: список тянет фильтры и карточки, деталка —
 * блоки описания и таблицу ставок. Ожидание чанка показывает Suspense в корневом layout,
 * а `defaultPreload: 'intent'` подгружает код заранее — по наведению на ссылку.
 */
const AuctionsListPage = lazy(async () => ({
  default: (await import('@/pages/auctions-list')).AuctionsListPage,
}));

const AuctionDetailPage = lazy(async () => ({
  default: (await import('@/pages/auction-detail')).AuctionDetailPage,
}));

const AuctionBetPage = lazy(async () => ({
  default: (await import('@/pages/auction-bet')).AuctionBetPage,
}));

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/auctions' });
  },
});

const auctionsListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions',
  /**
   * Разбор search params с безопасными fallback-значениями — вся логика в фиче фильтров.
   * Входной тип объявлен Partial: тогда ссылки на /auctions не обязаны передавать search,
   * а недостающие параметры подставит парсер.
   */
  validateSearch: (input: Partial<AuctionsSearch> & SearchSchemaInput): AuctionsSearch =>
    parseAuctionsSearch(input),
  component: AuctionsListPage,
});

const detailSearchSchema = z.object({
  tab: z.enum(['info', 'bets']).catch('info'),
});

type DetailSearch = z.infer<typeof detailSearchSchema>;

const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auctions/$auctionUuid',
  validateSearch: (input: Partial<DetailSearch> & SearchSchemaInput): DetailSearch =>
    detailSearchSchema.parse(input ?? {}),
  component: AuctionDetailPage,
});

/** Дочерний роут: форма ставки рисуется модалкой поверх детальной страницы. */
const auctionBetRoute = createRoute({
  getParentRoute: () => auctionDetailRoute,
  path: 'bet',
  component: AuctionBetPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  auctionsListRoute,
  auctionDetailRoute.addChildren([auctionBetRoute]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
