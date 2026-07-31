import { useVatDisplayStore } from '@/features/vat-display/model/vat-display.store';
import { Label } from '@/shared/ui/label.component';
import { Switch } from '@/shared/ui/switch.component';

export function VatToggle({ id = 'vat-mode' }: { id?: string }) {
  const mode = useVatDisplayStore((state) => state.mode);
  const toggle = useVatDisplayStore((state) => state.toggle);

  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={mode === 'no_vat'} onCheckedChange={toggle} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal text-muted-foreground">
        {mode === 'no_vat' ? 'Цены без НДС' : 'Цены с НДС'}
      </Label>
    </div>
  );
}
