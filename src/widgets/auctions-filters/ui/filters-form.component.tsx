import type * as React from 'react';
import { useId, useState } from 'react';

import {
  AUCTION_STATUSES,
  AUCTION_STATUS_LABELS,
  AUCTION_TYPE_LABELS,
  FILTER_AUCTION_TYPES,
  TRADING_STATUSES,
  TRADING_STATUS_LABELS,
  type AuctionStatus,
  type FilterAuctionType,
  type TradingStatus,
} from '@/shared/api/contracts';
import type { AuctionsSearch } from '@/features/filter-auctions';
import { CITY_NAMES } from '@/shared/config/cities';
import { cn } from '@/shared/lib/cn';
import { Checkbox } from '@/shared/ui/checkbox.component';
import { Input } from '@/shared/ui/input.component';
import { Label } from '@/shared/ui/label.component';
import { MultiSelect } from '@/shared/ui/multi-select.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select.component';

const ANY_CITY = '__any__';

type Draft = {
  cargo_num: string;
  status: TradingStatus[];
  statuses: AuctionStatus[];
  auc_type: FilterAuctionType[];
  load_city: string;
  unload_city: string;
  load_date_from: string;
  load_date_to: string;
  price_from: string;
  price_to: string;
  is_available: boolean;
  is_bidder: boolean;
};

function toDraft(search: AuctionsSearch): Draft {
  return {
    cargo_num: search.cargo_num ?? '',
    status: [...(search.status ?? [])],
    statuses: [...(search.statuses ?? [])],
    auc_type: [...(search.auc_type ?? [])],
    load_city: search.load_city ?? '',
    unload_city: search.unload_city ?? '',
    load_date_from: search.load_date_from ?? '',
    load_date_to: search.load_date_to ?? '',
    price_from: search.price_from == null ? '' : String(search.price_from),
    price_to: search.price_to == null ? '' : String(search.price_to),
    is_available: search.is_available ?? false,
    is_bidder: search.is_bidder ?? false,
  };
}

function optional<T>(value: T[]): T[] | undefined {
  return value.length > 0 ? value : undefined;
}

function optionalNumber(value: string): number | undefined {
  const parsed = Number(value.replace(',', '.'));
  return value.trim() === '' || !Number.isFinite(parsed) ? undefined : parsed;
}

function toSearchPatch(draft: Draft): Partial<AuctionsSearch> {
  return {
    page: 1,
    cargo_num: draft.cargo_num.trim() || undefined,
    status: optional(draft.status),
    statuses: optional(draft.statuses),
    auc_type: optional(draft.auc_type),
    load_city: draft.load_city || undefined,
    unload_city: draft.unload_city || undefined,
    load_date_from: draft.load_date_from || undefined,
    load_date_to: draft.load_date_to || undefined,
    price_from: optionalNumber(draft.price_from),
    price_to: optionalNumber(draft.price_to),
    is_available: draft.is_available ? true : undefined,
    is_bidder: draft.is_bidder ? true : undefined,
  };
}

const statusOptions = AUCTION_STATUSES.filter((status) => status !== 'Unknown').map((status) => ({
  value: status,
  label: AUCTION_STATUS_LABELS[status],
}));

const tradingStatusOptions = TRADING_STATUSES.filter((status) => status !== 'Unknown').map(
  (status) => ({ value: status, label: TRADING_STATUS_LABELS[status] }),
);

const aucTypeOptions = FILTER_AUCTION_TYPES.map((type) => ({
  value: type,
  label: AUCTION_TYPE_LABELS[type],
}));

type FiltersFormProps = {
  search: AuctionsSearch;
  onApply: (next: Partial<AuctionsSearch>) => void;

  columns?: 2 | 4;

  bodyClassName?: string;

  children: React.ReactNode;
};

type FilterFieldProps = {
  label: string;
  className?: string;

  children: (id: string) => React.ReactNode;
};

function CityFilter({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || ANY_CITY}
      onValueChange={(next) => onChange(next === ANY_CITY ? '' : next)}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Любой город" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY_CITY}>Любой город</SelectItem>
        {CITY_NAMES.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FilterField({ label, className, children }: FilterFieldProps) {
  const id = useId();

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
    </div>
  );
}

export function FiltersForm({
  search,
  onApply,
  columns = 2,
  bodyClassName,
  children,
}: FiltersFormProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(search));

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(toSearchPatch(draft));
      }}
    >
      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2',
          columns === 4 && 'xl:grid-cols-4',
          bodyClassName,
        )}
      >
        <FilterField label="Номер заявки">
          {(id) => (
            <Input
              id={id}
              value={draft.cargo_num}
              placeholder="00000001059"
              onChange={(event) => patch('cargo_num', event.target.value)}
            />
          )}
        </FilterField>

        <FilterField label="Статус аукциона">
          {(id) => (
            <MultiSelect
              id={id}
              options={statusOptions}
              value={draft.statuses}
              onChange={(next) => patch('statuses', next)}
              placeholder="Любой статус"
            />
          )}
        </FilterField>

        <FilterField label="Мой торговый статус">
          {(id) => (
            <MultiSelect
              id={id}
              options={tradingStatusOptions}
              value={draft.status}
              onChange={(next) => patch('status', next)}
              placeholder="Любой"
            />
          )}
        </FilterField>

        <FilterField label="Тип аукциона">
          {(id) => (
            <MultiSelect
              id={id}
              options={aucTypeOptions}
              value={draft.auc_type}
              onChange={(next) => patch('auc_type', next)}
              placeholder="Любой тип"
            />
          )}
        </FilterField>

        <FilterField label="Город погрузки">
          {(id) => (
            <CityFilter
              id={id}
              value={draft.load_city}
              onChange={(value) => patch('load_city', value)}
            />
          )}
        </FilterField>

        <FilterField label="Город выгрузки">
          {(id) => (
            <CityFilter
              id={id}
              value={draft.unload_city}
              onChange={(value) => patch('unload_city', value)}
            />
          )}
        </FilterField>

        <FilterField label="Погрузка с">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={draft.load_date_from}
              onChange={(event) => patch('load_date_from', event.target.value)}
            />
          )}
        </FilterField>

        <FilterField label="Погрузка по">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={draft.load_date_to}
              onChange={(event) => patch('load_date_to', event.target.value)}
            />
          )}
        </FilterField>

        <FilterField label="Цена от, ₽">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={draft.price_from}
              placeholder="0"
              onChange={(event) => patch('price_from', event.target.value)}
            />
          )}
        </FilterField>

        <FilterField label="Цена до, ₽">
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={draft.price_to}
              placeholder="100000"
              onChange={(event) => patch('price_to', event.target.value)}
            />
          )}
        </FilterField>

        <div className="flex items-end gap-4 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={draft.is_available}
              onCheckedChange={(checked) => patch('is_available', checked === true)}
            />
            Только доступные
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={draft.is_bidder}
              onCheckedChange={(checked) => patch('is_bidder', checked === true)}
            />
            Только мои торги
          </label>
        </div>
      </div>

      {children}
    </form>
  );
}
