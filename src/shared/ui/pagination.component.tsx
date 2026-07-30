import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button.component';

type PaginationProps = {
  page: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Компактный набор страниц с многоточиями: 1 … 4 5 6 … 20. */
function buildPages(page: number, lastPage: number): Array<number | 'gap'> {
  if (lastPage <= 7) return Array.from({ length: lastPage }, (_, index) => index + 1);

  const pages = new Set<number>([1, lastPage, page, page - 1, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= lastPage).sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push('gap');
    result.push(value);
    previous = value;
  }
  return result;
}

export function Pagination({
  page,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = buildPages(page, lastPage);

  return (
    <nav
      aria-label="Пагинация"
      className={cn('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}
    >
      <p className="text-sm text-muted-foreground tabular">
        Показано {from}–{to} из {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Предыдущая страница"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>

        {pages.map((value, index) =>
          value === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={value}
              variant={value === page ? 'default' : 'outline'}
              size="icon"
              aria-label={`Страница ${value}`}
              aria-current={value === page ? 'page' : undefined}
              onClick={() => onPageChange(value)}
            >
              {value}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          aria-label="Следующая страница"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}
