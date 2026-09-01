import { useLoaderData } from "@tanstack/react-router";
import type { StoreConfig } from "@/lib/store-types";

const FALLBACK: StoreConfig = { settings: {}, categories: [] };

/** Store settings + category navigation, loaded once in the root route loader. */
export function useStoreConfig(): StoreConfig {
  const data = useLoaderData({ from: "__root__" }) as StoreConfig | undefined;
  return data ?? FALLBACK;
}
