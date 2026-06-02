import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick, ref } from "vue";
import { useResponseBodyView } from "../useResponseBodyView";

describe("useResponseBodyView", () => {
  describe("size + tooLarge", () => {
    it("bodySize is 0 for missing body", () => {
      const { bodySize } = useResponseBodyView(
        () => undefined,
        () => undefined,
      );
      expect(bodySize.value).toBe(0);
    });

    it("bodySize reflects the byte length of the body", () => {
      const { bodySize } = useResponseBodyView(
        () => "hello",
        () => undefined,
      );
      expect(bodySize.value).toBe(5);
    });

    it("bodyTooLarge is false for small body", () => {
      const { bodyTooLarge } = useResponseBodyView(
        () => "{}",
        () => undefined,
      );
      expect(bodyTooLarge.value).toBe(false);
    });

    it("bodyTooLarge is true for body > 1 MB", () => {
      const big = "x".repeat(1024 * 1024 + 1);
      const { bodyTooLarge } = useResponseBodyView(
        () => big,
        () => undefined,
      );
      expect(bodyTooLarge.value).toBe(true);
    });
  });

  describe("JSON parsing", () => {
    it("isValidJson is false for missing body", () => {
      const { isValidJson, formattedJson } = useResponseBodyView(
        () => undefined,
        () => undefined,
      );
      expect(isValidJson.value).toBe(false);
      expect(formattedJson.value).toBe("");
    });

    it("isValidJson is false for invalid JSON", () => {
      const { isValidJson } = useResponseBodyView(
        () => "not json",
        () => undefined,
      );
      expect(isValidJson.value).toBe(false);
    });

    it("isValidJson is true for valid JSON", () => {
      const { isValidJson, formattedJson } = useResponseBodyView(
        () => '{"a":1}',
        () => undefined,
      );
      expect(isValidJson.value).toBe(true);
      expect(formattedJson.value).toBe('{\n  "a": 1\n}');
    });

    it("does not parse when body exceeds size limit (even if it would be valid JSON)", () => {
      const huge = "[" + '"x",'.repeat(300_000) + '"end"]';
      expect(huge.length).toBeGreaterThan(1024 * 1024);

      const { isValidJson, bodyTooLarge } = useResponseBodyView(
        () => huge,
        () => undefined,
      );
      expect(bodyTooLarge.value).toBe(true);
      expect(isValidJson.value).toBe(false);
    });
  });

  describe("viewMode auto-selection", () => {
    it('selects "json" when body is valid JSON', () => {
      const { viewMode } = useResponseBodyView(
        () => '{"ok":true}',
        () => undefined,
      );
      expect(viewMode.value).toBe("json");
    });

    it('selects "raw" when body is not valid JSON', () => {
      const { viewMode } = useResponseBodyView(
        () => "<xml/>",
        () => undefined,
      );
      expect(viewMode.value).toBe("raw");
    });

    it("switches viewMode when the body changes", async () => {
      const body = ref<string | undefined>("not json");
      const { viewMode } = useResponseBodyView(
        () => body.value,
        () => undefined,
      );
      expect(viewMode.value).toBe("raw");

      body.value = '{"x":1}';
      await nextTick();
      expect(viewMode.value).toBe("json");
    });

    it("viewMode is user-overridable (it is a regular ref)", () => {
      const { viewMode } = useResponseBodyView(
        () => '{"x":1}',
        () => undefined,
      );
      expect(viewMode.value).toBe("json");
      viewMode.value = "raw";
      expect(viewMode.value).toBe("raw");
    });
  });

  describe("downloadResponse", () => {
    let createObjectURL: ReturnType<typeof vi.fn<(obj: Blob | MediaSource) => string>>;
    let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>;
    let originalCreate: typeof URL.createObjectURL;
    let originalRevoke: typeof URL.revokeObjectURL;

    beforeEach(() => {
      createObjectURL = vi.fn<(obj: Blob | MediaSource) => string>().mockReturnValue("blob:fake-url");
      revokeObjectURL = vi.fn<(url: string) => void>();
      originalCreate = URL.createObjectURL;
      originalRevoke = URL.revokeObjectURL;
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      vi.restoreAllMocks();
    });

    it("does nothing when body is missing", () => {
      const { downloadResponse } = useResponseBodyView(
        () => undefined,
        () => undefined,
      );
      downloadResponse();
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    it("creates a blob URL with the provided content-type and triggers a click", () => {
      const clickSpy = vi.fn();
      const origCreate = document.createElement.bind(document);
      const anchor = origCreate("a");
      anchor.click = clickSpy;
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        return tag === "a" ? anchor : origCreate(tag);
      });

      const { downloadResponse } = useResponseBodyView(
        () => '{"hello":1}',
        () => "application/json",
      );
      downloadResponse();

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("application/json");
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    });

    it("defaults to text/plain when contentType is missing", () => {
      const origCreate = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === "a") el.click = vi.fn();
        return el;
      });

      const { downloadResponse } = useResponseBodyView(
        () => "plain body",
        () => undefined,
      );
      downloadResponse();

      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("text/plain");
    });
  });
});
