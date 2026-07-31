import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

import { THEME_LABELS, THEME_PREFERENCES } from '@/features/theme/model/theme';
import { useTheme } from '@/features/theme/model/use-theme';
import { cn } from '@/shared/lib/cn';

const ICONS = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
} as const;

/**
 * Выбор темы тремя кнопками, а не одной цикличной: по одинокой иконке монитора нельзя
 * догадаться, что это переключатель темы, а первый клик в цикле часто не даёт видимого
 * эффекта. Здесь видно и все варианты, и активный, а нужный выбирается одним нажатием.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Видимая подпись скрывается на мобильных, поэтому имя группы задаётся aria-label:
          так оно одинаково на всех разрешениях. */}
      <span className="hidden text-xs text-muted-foreground sm:inline" aria-hidden>
        Тема
      </span>

      <div
        role="group"
        aria-label="Тема оформления"
        className="flex items-center gap-0.5 rounded-lg border border-border p-0.5"
      >
        {THEME_PREFERENCES.map((option) => {
          const Icon = ICONS[option];
          const isActive = preference === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setPreference(option)}
              aria-pressed={isActive}
              aria-label={THEME_LABELS[option]}
              title={THEME_LABELS[option]}
              className={cn(
                'rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
