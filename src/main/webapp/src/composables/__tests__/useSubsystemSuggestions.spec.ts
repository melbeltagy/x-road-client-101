import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useSubsystemSuggestions } from "..";
import { fetchRegisteredClients } from "@/services/security-server.service";

// Mock vue-i18n
vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the security server service
vi.mock("@/services/security-server.service", () => ({
  fetchRegisteredClients: vi.fn(),
}));

describe("useSubsystemSuggestions", () => {
  let discovery: ReturnType<typeof useSubsystemSuggestions>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    discovery = useSubsystemSuggestions();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should start with empty suggestions", () => {
      expect(discovery.subsystemSuggestions.value).toEqual([]);
    });

    it("should start with not loading", () => {
      expect(discovery.isLoadingSuggestions.value).toBe(false);
    });

    it("should start with no error", () => {
      expect(discovery.suggestionsError.value).toBeNull();
    });
  });

  describe("loadSubsystemSuggestions", () => {
    it("should clear suggestions when URL is empty", async () => {
      discovery.subsystemSuggestions.value = [{ instanceId: "TEST", memberClass: "GOV", memberCode: "123", subsystemCode: "Sub" }];

      await discovery.loadSubsystemSuggestions("");

      expect(discovery.subsystemSuggestions.value).toEqual([]);
      expect(discovery.suggestionsError.value).toBeNull();
      expect(fetchRegisteredClients).not.toHaveBeenCalled();
    });

    it("should clear suggestions when URL is invalid", async () => {
      discovery.subsystemSuggestions.value = [{ instanceId: "TEST", memberClass: "GOV", memberCode: "123", subsystemCode: "Sub" }];

      await discovery.loadSubsystemSuggestions("not-a-valid-url");

      expect(discovery.subsystemSuggestions.value).toEqual([]);
      expect(fetchRegisteredClients).not.toHaveBeenCalled();
    });

    it("should fetch clients for valid URL", async () => {
      const mockClients = [
        { instanceId: "TEST", memberClass: "GOV", memberCode: "123", subsystemCode: "Sub1" },
        { instanceId: "TEST", memberClass: "GOV", memberCode: "456", subsystemCode: "Sub2" },
      ];
      vi.mocked(fetchRegisteredClients).mockResolvedValue(mockClients);

      await discovery.loadSubsystemSuggestions("https://ss.example.com");

      expect(fetchRegisteredClients).toHaveBeenCalledWith("https://ss.example.com");
      expect(discovery.subsystemSuggestions.value).toEqual(mockClients);
    });

    it("should set loading state during fetch", async () => {
      let resolvePromise: (value: never[]) => void;
      const promise = new Promise<never[]>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(fetchRegisteredClients).mockReturnValue(promise);

      const loadPromise = discovery.loadSubsystemSuggestions("https://ss.example.com");

      expect(discovery.isLoadingSuggestions.value).toBe(true);

      resolvePromise!([]);
      await loadPromise;

      expect(discovery.isLoadingSuggestions.value).toBe(false);
    });

    it("should handle fetch errors", async () => {
      vi.mocked(fetchRegisteredClients).mockRejectedValue(new Error("Network error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await discovery.loadSubsystemSuggestions("https://ss.example.com");

      consoleSpy.mockRestore();

      expect(discovery.subsystemSuggestions.value).toEqual([]);
      expect(discovery.suggestionsError.value).toBe("xroad.client.fetchError");
      expect(discovery.isLoadingSuggestions.value).toBe(false);
    });
  });

  describe("loadSubsystemSuggestionsDebounced", () => {
    it("should debounce calls", async () => {
      vi.mocked(fetchRegisteredClients).mockResolvedValue([]);

      discovery.loadSubsystemSuggestionsDebounced("https://ss1.example.com");
      discovery.loadSubsystemSuggestionsDebounced("https://ss2.example.com");
      discovery.loadSubsystemSuggestionsDebounced("https://ss3.example.com");

      expect(fetchRegisteredClients).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(fetchRegisteredClients).toHaveBeenCalledTimes(1);
      expect(fetchRegisteredClients).toHaveBeenCalledWith("https://ss3.example.com");
    });

    it("should use custom debounce time", async () => {
      vi.mocked(fetchRegisteredClients).mockResolvedValue([]);
      const customDiscovery = useSubsystemSuggestions({ debounceMs: 1000 });

      customDiscovery.loadSubsystemSuggestionsDebounced("https://ss.example.com");

      vi.advanceTimersByTime(500);
      expect(fetchRegisteredClients).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(fetchRegisteredClients).toHaveBeenCalledTimes(1);
    });
  });
});
