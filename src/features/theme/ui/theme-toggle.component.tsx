import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

import { nextPreference, THEME_LABELS } from '@/features/theme/model/theme';
import { useTheme } from '@/features/theme/model/use-theme';
import { Button } from '@/shared/ui/button.component';

const ICONS = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
} as const;

/** Переключатель темы по кругу: системная → светлая → тёмная. */
export function ThemeToggle() {
  const { preference, cycle } = useTheme();
  const Icon = ICONS[preference];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      title={THEME_LABELS[preference]}
      // В подписи и текущее состояние, и результат клика: у иконки одна кнопка на три темы.
      aria-label={`${THEME_LABELS[preference]}. Переключить на: ${THEME_LABELS[nextPreference(preference)]}`}
    >
      <Icon />
    </Button>
  );
}
