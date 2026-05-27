import { onUnmounted, getCurrentInstance } from "vue";

/**
 * Wrap a function so that successive calls within `ms` are coalesced
 * into a single trailing-edge invocation. Auto-cancels on unmount when
 * called from a component setup; safe to call outside one too (the
 * cleanup hook is registered only when an instance exists).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => unknown>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function debounced(...args: Parameters<T>): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  }

  function cancel(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  if (getCurrentInstance()) {
    onUnmounted(cancel);
  }

  return { debounced, cancel };
}
