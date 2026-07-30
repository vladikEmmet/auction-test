import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PriceMode = 'with_vat' | 'no_vat';

type VatDisplayState = {
  /** Режим показа цен: влияет только на отображение, запросы не меняет. */
  mode: PriceMode;
  setMode: (mode: PriceMode) => void;
  toggle: () => void;
};

export const useVatDisplayStore = create<VatDisplayState>()(
  persist(
    (set) => ({
      mode: 'with_vat',
      setMode: (mode) => set({ mode }),
      toggle: () => set((state) => ({ mode: state.mode === 'with_vat' ? 'no_vat' : 'with_vat' })),
    }),
    { name: 'auctions:price-mode' },
  ),
);

export function pickPrice(
  mode: PriceMode,
  withVat: number | null,
  noVat: number | null,
): number | null {
  return mode === 'with_vat' ? withVat : noVat;
}
