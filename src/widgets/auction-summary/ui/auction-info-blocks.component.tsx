import { LockIcon } from 'lucide-react';

import type { AuctionDetailVm } from '@/entities/auction';
import { formatDateTime, formatEmpty, formatNumber } from '@/shared/lib/format';
import { Alert, AlertDescription } from '@/shared/ui/alert.component';
import { Badge } from '@/shared/ui/badge.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card.component';
import { FieldList } from '@/shared/ui/field-list.component';

export function AuctionOrganizerBlock({ auction }: { auction: AuctionDetailVm }) {
  const contactsHidden = auction.restrictions.hidePointsAddressAndContacts;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Организатор</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldList
          fields={[
            { label: 'Организация', value: auction.organizer.name },
            { label: 'ИНН / КПП', value: `${auction.organizer.inn} / ${auction.organizer.kpp}` },
            { label: 'Код подписчика', value: auction.organizer.subscriberCode },
            { label: 'Информационная база', value: auction.organizer.infobaseCode },
          ]}
        />

        {contactsHidden ? (
          <Alert>
            <LockIcon className="size-4 shrink-0" aria-hidden />
            <AlertDescription>
              Контакты скрыты организатором (<code>hide_points_address_and_contacts</code>).
            </AlertDescription>
          </Alert>
        ) : auction.contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Контакты не указаны.</p>
        ) : (
          <ul className="space-y-2">
            {auction.contacts.map((contact, index) => (
              <li key={`${contact.phone ?? ''}-${index}`} className="rounded-md border border-border p-2.5 text-sm">
                <p className="font-medium">{formatEmpty(contact.name)}</p>
                <p className="text-muted-foreground">
                  {formatEmpty(contact.phone)}
                  {contact.workPhone ? ` · раб. ${contact.workPhone}` : ''}
                </p>
                {contact.email ? <p className="text-muted-foreground">{contact.email}</p> : null}
              </li>
            ))}
          </ul>
        )}

        {auction.admittedOrganizations.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Допущенные организации
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {auction.admittedOrganizations.map((organization) => (
                <Badge key={organization.id} variant={organization.isMain ? 'default' : 'neutral'}>
                  {organization.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AuctionCargoBlock({ auction }: { auction: AuctionDetailVm }) {
  const { cargo } = auction;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Груз и требования к ТС</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldList
          fields={[
            { label: 'Груз', value: cargo.name },
            { label: 'Тип кузова', value: cargo.bodyType },
            { label: 'Количество ТС', value: formatNumber(cargo.truckCount) },
            { label: 'Расстояние', value: formatNumber(cargo.distanceKm, 'км') },
            {
              label: 'Цена груза',
              value: cargo.price ? (
                `${cargo.price} ₽`
              ) : (
                <span className="text-muted-foreground">скрыта организатором</span>
              ),
            },
            {
              label: 'Температурный режим',
              value:
                cargo.tempFrom == null && cargo.tempTo == null
                  ? '—'
                  : `${formatNumber(cargo.tempFrom)}…${formatNumber(cargo.tempTo)} °C`,
            },
            {
              label: 'Типы погрузки',
              value: cargo.loadingTypes.length > 0 ? cargo.loadingTypes.join(', ') : '—',
            },
            { label: 'Документы', value: cargo.docs.length > 0 ? cargo.docs.join(', ') : '—' },
            {
              label: 'Контейнер',
              value: cargo.containered
                ? `${formatEmpty(cargo.containerType)} ${formatEmpty(cargo.containerSize)}`
                : 'нет',
            },
            { label: 'Международная перевозка', value: cargo.isInternational ? 'да' : 'нет' },
          ]}
        />

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Требования к ТС</p>
          {cargo.car ? (
            <p className="mt-1 text-sm">
              {cargo.car.type} · {formatNumber(cargo.car.weight, 'т')} ·{' '}
              {formatNumber(cargo.car.volume, 'м³')} · {formatNumber(cargo.car.length, 'м')} ×{' '}
              {formatNumber(cargo.car.width, 'м')} × {formatNumber(cargo.car.height, 'м')}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">не заданы</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AuctionPaymentBlock({ auction }: { auction: AuctionDetailVm }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Условия оплаты</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldList
          fields={[
            { label: 'Форма оплаты', value: auction.payment.form },
            { label: 'Отсрочка', value: formatEmpty(auction.payment.delayLabel) },
            { label: 'Предоплата', value: formatEmpty(auction.payment.prepay) },
            { label: 'Валюта', value: auction.payment.currencyCode },
            { label: 'Условие', value: formatEmpty(auction.payment.condition), wide: true },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export function AuctionTradingSettingsBlock({ auction }: { auction: AuctionDetailVm }) {
  const { settings } = auction.trading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Регламент торгов</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldList
          fields={[
            { label: 'Начало торгов', value: formatDateTime(auction.trading.startTime) },
            { label: 'Окончание торгов', value: formatDateTime(auction.trading.stopTime) },
            { label: 'Единица ставки', value: auction.trading.measurementLabel || '—' },
            {
              label: 'Продление после ставки',
              value: settings.prolongAfterBet == null ? '—' : `${settings.prolongAfterBet} мин`,
            },
            {
              label: 'Время на передачу',
              value: settings.transmissionTimeIn == null ? '—' : `${settings.transmissionTimeIn} ч`,
            },
            { label: 'Коэффициент', value: formatNumber(settings.coefficient) },
            {
              label: 'Сделка до погрузки',
              value: auction.trading.sendDealBeforeLoad ? 'да' : 'нет',
            },
            {
              label: 'Сборный груз',
              value: auction.assembly.num
                ? `${auction.assembly.num} от ${formatDateTime(auction.assembly.date)}`
                : 'нет',
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/** Явный список ограничений из DTO — чтобы поведение UI было видно проверяющему. */
export function AuctionRestrictionsBlock({ auction }: { auction: AuctionDetailVm }) {
  const restrictions: Array<{ flag: keyof AuctionDetailVm['restrictions']; label: string }> = [
    { flag: 'canSetBet', label: 'can_set_bet' },
    { flag: 'hideBetsHistory', label: 'hide_bets_history' },
    { flag: 'hidePointsAddressAndContacts', label: 'hide_points_address_and_contacts' },
    { flag: 'noViewCargoPrice', label: 'no_view_cargo_price' },
    { flag: 'hidePlaces', label: 'hide_places' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Ограничения аукциона</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {restrictions.map(({ flag, label }) => {
          const enabled = auction.restrictions[flag];
          // can_set_bet — единственный флаг, где true означает «разрешено».
          const positive = flag === 'canSetBet' ? enabled : !enabled;
          return (
            <Badge key={flag} variant={positive ? 'success' : 'warning'}>
              <code>{label}</code>: {String(enabled)}
            </Badge>
          );
        })}
      </CardContent>
    </Card>
  );
}
