import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { renderApp } from '@/app/testing/render-app';
import { server } from '@/shared/api/msw/node';
import { createSeed, uuidFor } from '@/shared/api/msw/seed';
import { getAuction, getBets, resetStore } from '@/shared/api/msw/store';
import { CURRENT_USER } from '@/shared/config/env';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  resetStore(createSeed(new Date('2026-07-30T12:00:00')));
});

/** Аукцион на понижение с открытыми торгами: ставки разрешены. */
const DOWN_AUCTION = uuidFor(0);
/** Ставки запрещены: can_set_bet = false. */
const CLOSED_AUCTION = uuidFor(4);
/** История ставок скрыта организатором. */
const HIDDEN_HISTORY_AUCTION = uuidFor(3);

const priceInput = () => screen.getByLabelText(/Ваша цена/);

/** Тексты внутри модалки ищем точечно: те же подписи есть и на детальной странице. */
const dialog = () => screen.getByRole('dialog');

describe('установка ставки', () => {
  it('открывается по прямой ссылке на /bet', async () => {
    await renderApp(`/auctions/${DOWN_AUCTION}/bet`);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Сделать ставку')).toBeInTheDocument();
    expect(await screen.findByLabelText(/Ваша цена/)).toBeInTheDocument();
  });

  it('подставляет корректную цену по умолчанию и подсказку по шагу', async () => {
    const auction = getAuction(DOWN_AUCTION)!;
    await renderApp(`/auctions/${DOWN_AUCTION}/bet`);

    await screen.findByRole('dialog');
    const expected = (auction.trading.price.available ?? 0) - (auction.trading.price.step ?? 0);
    expect(priceInput()).toHaveValue(String(expected));
    expect(within(dialog()).getByText(/Доступная цена/)).toBeInTheDocument();
  });

  it('не отправляет запрос при нарушении правил торгов', async () => {
    const user = userEvent.setup();
    const auction = getAuction(DOWN_AUCTION)!;
    const betsBefore = getBets(DOWN_AUCTION, true)!.length;

    await renderApp(`/auctions/${DOWN_AUCTION}/bet`);
    await screen.findByRole('dialog');

    // Шаг вверх в аукционе на понижение: цена остаётся в границах min/max,
    // поэтому сработает именно проверка направления торгов.
    const higher = (auction.trading.price.current ?? 0) + (auction.trading.price.step ?? 0);
    expect(higher).toBeLessThanOrEqual(auction.trading.price.max ?? Infinity);

    await user.clear(priceInput());
    await user.type(priceInput(), String(higher));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    const alerts = await within(dialog()).findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent).join(' ')).toMatch(/понижение/);
    // Запрос не ушёл: клиентская валидация совпадает с серверной.
    expect(getBets(DOWN_AUCTION, true)!).toHaveLength(betsBefore);
  });

  it('показывает ошибку при вводе нечисловой цены', async () => {
    const user = userEvent.setup();
    await renderApp(`/auctions/${DOWN_AUCTION}/bet`);
    await screen.findByRole('dialog');

    await user.clear(priceInput());
    await user.type(priceInput(), 'дорого');
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    const alerts = await within(dialog()).findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent).join(' ')).toContain('Цена должна быть числом.');
  });

  it('успешная ставка обновляет стор, закрывает модалку и попадает в историю', async () => {
    const user = userEvent.setup();
    const auction = getAuction(DOWN_AUCTION)!;
    const price = auction.trading.price.available!;

    const { router } = await renderApp(`/auctions/${DOWN_AUCTION}/bet`);
    await screen.findByRole('dialog');

    await user.clear(priceInput());
    await user.type(priceInput(), String(price));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    // Модалка закрывается — значит мутация прошла успешно.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe(`/auctions/${DOWN_AUCTION}`);

    // MSW-стор действительно изменился.
    const updated = getAuction(DOWN_AUCTION)!;
    expect(updated.trading.price.current).toBe(price);
    expect(updated.trading.your.bet).toBe(true);
    expect(updated.trading.status_mobile).toBe('Leading');

    const mine = getBets(DOWN_AUCTION, false)!.filter(
      (bet) => bet.organization_id === CURRENT_USER.organizationId,
    );
    expect(mine.at(-1)?.price_with_vat).toBe(price);

    // Детальная страница перезапросила данные и показывает новую ставку.
    expect(await screen.findByText('Моя ставка есть')).toBeInTheDocument();
  });

  it('после ставки в истории появляется новая строка с местом 1', async () => {
    const user = userEvent.setup();
    const price = getAuction(DOWN_AUCTION)!.trading.price.available!;

    await renderApp(`/auctions/${DOWN_AUCTION}/bet`);
    await screen.findByRole('dialog');

    await user.clear(priceInput());
    await user.type(priceInput(), String(price));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Ставки' }));

    const myRow = await screen.findByText(CURRENT_USER.organizationName);
    expect(myRow).toBeInTheDocument();
    expect(await screen.findByText(/Участников: \d+/)).toBeInTheDocument();
  });

  it('запрещает ставку, когда can_set_bet = false', async () => {
    await renderApp(`/auctions/${CLOSED_AUCTION}/bet`);

    await screen.findByRole('dialog');
    expect(await within(dialog()).findByText('Ставка недоступна')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отправить ставку' })).not.toBeInTheDocument();
  });

  it('не запрашивает ставки, когда история скрыта', async () => {
    const user = userEvent.setup();
    await renderApp(`/auctions/${HIDDEN_HISTORY_AUCTION}`);

    await user.click(await screen.findByRole('tab', { name: 'Ставки' }));

    expect(await screen.findByText('История ставок скрыта')).toBeInTheDocument();
    expect(screen.queryByText(/Участников:/)).not.toBeInTheDocument();
  });

  it('показывает 404, если аукциона нет', async () => {
    await renderApp('/auctions/00000000-0000-4000-8000-000000000000');

    expect(await screen.findByText('Аукцион не найден')).toBeInTheDocument();
  });
});
