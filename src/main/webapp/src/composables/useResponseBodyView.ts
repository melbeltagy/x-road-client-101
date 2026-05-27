import { computed, ref, watch } from "vue";

const ONE_MB_BYTES = 1024 * 1024;

export type ResponseViewMode = "raw" | "json";

/**
 * Pure logic for displaying a response body: size + too-large check,
 * JSON validity + pretty-printing, an auto-selected view mode, and a
 * download helper. Kept out of the component so it's unit-testable.
 */
export function useResponseBodyView(body: () => string | undefined, contentType: () => string | undefined) {
  const viewMode = ref<ResponseViewMode>("raw");

  const bodySize = computed(() => {
    const b = body();
    return b ? new Blob([b]).size : 0;
  });

  const bodyTooLarge = computed(() => bodySize.value > ONE_MB_BYTES);

  const parsedJson = computed(() => {
    const b = body();
    if (!b || bodyTooLarge.value) return null;
    try {
      return JSON.parse(b);
    } catch {
      return null;
    }
  });

  const isValidJson = computed(() => parsedJson.value !== null);

  const formattedJson = computed(() => {
    if (!isValidJson.value) return "";
    return JSON.stringify(parsedJson.value, null, 2);
  });

  // Auto-select view mode: JSON if parseable and not too large, else raw.
  watch(
    body,
    () => {
      viewMode.value = isValidJson.value && !bodyTooLarge.value ? "json" : "raw";
    },
    { immediate: true },
  );

  function downloadResponse(): void {
    const b = body();
    if (!b) return;
    const blob = new Blob([b], { type: contentType() || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xroad-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    viewMode,
    bodySize,
    bodyTooLarge,
    isValidJson,
    formattedJson,
    downloadResponse,
  };
}
