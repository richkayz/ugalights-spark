import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "./store-types";

const STORAGE_KEY = "ugalights.cart.v1";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  addLine: (line: CartLine) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeLine: (productId: string, variantId: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartLine, productId: string, variantId: string | null) {
  return a.productId === productId && (a.variantId ?? null) === (variantId ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, ready]);

  const addLine = useCallback((line: CartLine) => {
    setLines((current) => {
      const index = current.findIndex((l) => sameLine(l, line.productId, line.variantId));
      if (index === -1) return [...current, line];
      const next = [...current];
      const existing = next[index]!;
      next[index] = { ...existing, quantity: existing.quantity + line.quantity };
      return next;
    });
  }, []);

  const setQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      setLines((current) =>
        current
          .map((l) =>
            sameLine(l, productId, variantId) ? { ...l, quantity: Math.max(0, quantity) } : l,
          )
          .filter((l) => l.quantity > 0),
      );
    },
    [],
  );

  const removeLine = useCallback((productId: string, variantId: string | null) => {
    setLines((current) => current.filter((l) => !sameLine(l, productId, variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    return { lines, count, subtotal, ready, addLine, setQuantity, removeLine, clear };
  }, [lines, ready, addLine, setQuantity, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
