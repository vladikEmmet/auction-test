import { FilterIcon, RotateCcwIcon, SearchIcon } from 'lucide-react';

import {
  hasActiveFilters,
  useFiltersPanelStore,
  type AuctionsSearch,
} from '@/features/filter-auctions';
import { Badge } from '@/shared/ui/badge.component';
import { Button } from '@/shared/ui/button.component';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet.component';
import { FiltersForm } from '@/widgets/auctions-filters/ui/filters-form.component';

type FiltersSheetProps = {
  search: AuctionsSearch;
  onApply: (next: Partial<AuctionsSearch>) => void;
  onReset: () => void;
};

export function FiltersSheet({ search, onApply, onReset }: FiltersSheetProps) {
  const isOpen = useFiltersPanelStore((state) => state.isOpen);
  const openPanel = useFiltersPanelStore((state) => state.open);
  const closePanel = useFiltersPanelStore((state) => state.close);
  const activeFilters = hasActiveFilters(search);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? openPanel() : closePanel())}>
      <SheetContent aria-describedby="filters-sheet-hint">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FilterIcon className="size-4" aria-hidden />
            Фильтры
            {activeFilters ? <Badge variant="default">активны</Badge> : null}
          </SheetTitle>
          <SheetDescription id="filters-sheet-hint">
            Условия попадают в адресную строку — ссылку можно переслать.
          </SheetDescription>
        </SheetHeader>

        <FiltersForm
          search={search}
          onApply={(patch) => {
            onApply(patch);
            closePanel();
          }}
          bodyClassName="flex-1 content-start overflow-y-auto p-4 sm:p-5"
        >
          <SheetFooter>
            <Button type="button" variant="outline" onClick={onReset}>
              <RotateCcwIcon /> Сбросить
            </Button>
            <Button type="submit">
              <SearchIcon /> Применить
            </Button>
          </SheetFooter>
        </FiltersForm>
      </SheetContent>
    </Sheet>
  );
}
