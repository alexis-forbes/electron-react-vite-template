import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () =>
    set((state) => ({
      ...state,
      count: state.count + 1
    })),
  decrement: () =>
    set((state) => ({
      ...state,
      count: state.count - 1
    }))
}));
