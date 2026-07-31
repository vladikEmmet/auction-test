import { Link } from '@tanstack/react-router';

import { Button } from '@/shared/ui/button.component';
import { StatePanel } from '@/shared/ui/state-panel.component';

export function NotFound() {
  return (
    <StatePanel
      title="Страница не найдена"
      description="Проверьте адрес — такой страницы нет."
      action={
        <Button asChild>
          <Link to="/auctions">К списку аукционов</Link>
        </Button>
      }
    />
  );
}
