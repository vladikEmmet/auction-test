import { Link, Outlet } from '@tanstack/react-router';
import { TruckIcon } from 'lucide-react';
import { Suspense } from 'react';

import { ThemeToggle } from '@/features/theme';
import { Skeleton } from '@/shared/ui/skeleton.component';

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/auctions" className="flex items-center gap-2 font-semibold">
            <TruckIcon className="size-5 text-primary" aria-hidden />
            Грузовые аукционы
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Демо на моках MSW · ООО Перевозчик
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <Suspense
          fallback={
            <div className="space-y-4" aria-busy aria-label="Загрузка страницы">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-40 w-full" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Данные генерируются MSW и сбрасываются при перезагрузке страницы.
      </footer>
    </div>
  );
}
