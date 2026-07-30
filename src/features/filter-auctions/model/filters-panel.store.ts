import { create } from 'zustand';

type FiltersPanelState = {
  /** На мобильных фильтры скрыты за кнопкой; на desktop панель всегда развёрнута. */
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useFiltersPanelStore = create<FiltersPanelState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
