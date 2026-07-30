import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { renderApp } from '@/app/testing/render-app';
import { server } from '@/shared/api/msw/node';
import { createSeed } from '@/shared/api/msw/seed';
import { resetStore } from '@/shared/api/msw/store';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  resetStore(createSeed(new Date('2026-07-30T12:00:00')));
});

/** Список загружен, когда скелетоны исчезли. */
const waitForList = () =>
  waitFor(() => expect(screen.queryByLabelText('Загрузка аукционов')).not.toBeInTheDocument());

const auctionLinks = () => screen.queryAllByRole('link', { name: /Заявка №/ });

describe('страница списка аукционов', () => {
  it('показывает skeleton, пока список грузится', async () => {
    server.use(
      http.post('/api/v1/auctions/list', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    await renderApp('/auctions');

    expect(await screen.findByLabelText('Загрузка аукционов')).toBeInTheDocument();
    expect(auctionLinks()).toHaveLength(0);
  });

  it('показывает error state и даёт повторить запрос', async () => {
    server.use(
      http.post('/api/v1/auctions/list', () =>
        HttpResponse.json(
          {
            code: 'service_unavailable',
            title: 'Сервис недоступен',
            message: 'Upstream временно недоступен.',
            trace_id: null,
          },
          { status: 503, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );

    await renderApp('/auctions');

    expect(await screen.findByText('Не удалось загрузить аукционы')).toBeInTheDocument();
    expect(screen.getByText(/Upstream временно недоступен/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });

  it('загружает карточки и показывает счётчик найденного', async () => {
    await renderApp('/auctions');
    await waitForList();

    expect(await screen.findByText(/Найдено аукционов: \d+/)).toBeInTheDocument();
    expect(auctionLinks().length).toBeGreaterThan(0);
  });

  it('отдаёт empty state, когда под фильтр ничего не подходит', async () => {
    await renderApp('/auctions?cargo_num=99999999999');
    await waitForList();

    expect(await screen.findByText('Аукционы не найдены')).toBeInTheDocument();
    expect(auctionLinks()).toHaveLength(0);
  });

  it('восстанавливает фильтры из URL и применяет их к запросу', async () => {
    await renderApp('/auctions?load_city=Москва&per_page=10');
    await waitForList();

    expect(auctionLinks().length).toBeGreaterThan(0);
    expect(auctionLinks().length).toBeLessThanOrEqual(10);
    expect(screen.getAllByText(/Москва/).length).toBeGreaterThan(0);
  });

  it('игнорирует мусор в search params вместо падения', async () => {
    const { router } = await renderApp(
      '/auctions?page=abc&per_page=999&sort=неизвестно&statuses=НЛО',
    );
    await waitForList();

    expect(auctionLinks().length).toBeGreaterThan(0);
    expect(router.state.location.search).toMatchObject({ page: 1, per_page: 20, sort: 'newest' });
  });

  it('пагинация переключает страницу и меняет URL', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/auctions?per_page=10');
    await waitForList();

    const firstPage = auctionLinks().map((link) => link.textContent);

    await user.click(screen.getByRole('button', { name: 'Страница 2' }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ page: 2 }));
    await waitFor(() => {
      expect(auctionLinks().map((link) => link.textContent)).not.toEqual(firstPage);
    });
  });

  it('открывает детальную страницу по клику на заявку', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/auctions');
    await waitForList();

    const [firstLink] = auctionLinks();
    await user.click(firstLink!);

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/auctions\/[0-9a-f-]+$/);
    });
    expect(await screen.findByRole('tab', { name: 'Ставки' })).toBeInTheDocument();
  });
});
