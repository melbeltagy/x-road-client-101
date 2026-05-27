import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { nextTick, ref } from "vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/services/security-server.service", () => ({
  fetchServices: vi.fn(),
}));

import { useServicesLoader } from "../useServicesLoader";
import { fetchServices } from "@/services/security-server.service";
import type { SubsystemId } from "@/types";

const fullClient: SubsystemId = {
  instanceId: "TEST",
  memberClass: "GOV",
  memberCode: "1234567-8",
  subsystemCode: "C",
};
const fullService: SubsystemId = {
  instanceId: "TEST",
  memberClass: "GOV",
  memberCode: "9876543-2",
  subsystemCode: "S",
};

describe("useServicesLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("starts with no services, not loading, no error", () => {
      const { availableServices, isLoading, error } = useServicesLoader(
        () => "",
        () => undefined,
        () => undefined,
      );
      expect(availableServices.value).toEqual([]);
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe("input-gating (does not fetch until inputs are valid + complete)", () => {
    it("does not fetch with empty URL", async () => {
      const url = ref("");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<SubsystemId>(fullService);
      useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      url.value = "";
      await vi.advanceTimersByTimeAsync(600);
      expect(fetchServices).not.toHaveBeenCalled();
    });

    it("does not fetch with invalid URL", async () => {
      const url = ref("not-a-url");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<SubsystemId>(fullService);
      useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      url.value = "asdasd";
      await vi.advanceTimersByTimeAsync(600);
      expect(fetchServices).not.toHaveBeenCalled();
    });

    it("does not fetch when client subsystem is incomplete", async () => {
      const url = ref("https://ss.example.com");
      const client = ref<Partial<SubsystemId>>({ instanceId: "TEST" });
      const service = ref<SubsystemId>(fullService);
      useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      client.value = { instanceId: "TEST" };
      await vi.advanceTimersByTimeAsync(600);
      expect(fetchServices).not.toHaveBeenCalled();
    });

    it("does not fetch when service subsystem is incomplete", async () => {
      const url = ref("https://ss.example.com");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<Partial<SubsystemId>>({ instanceId: "TEST" });
      useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      service.value = { instanceId: "TEST", memberClass: "GOV" };
      await vi.advanceTimersByTimeAsync(600);
      expect(fetchServices).not.toHaveBeenCalled();
    });
  });

  describe("happy path", () => {
    it("fetches services when all inputs become valid", async () => {
      const services = [{ serviceCode: "getInfo", serviceType: "REST", endpoints: [] }];
      vi.mocked(fetchServices).mockResolvedValue(services);

      const url = ref("");
      const client = ref<Partial<SubsystemId>>({});
      const service = ref<Partial<SubsystemId>>({});
      const loader = useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      url.value = "https://ss.example.com";
      client.value = fullClient;
      service.value = fullService;

      await vi.advanceTimersByTimeAsync(600);
      await vi.runAllTimersAsync();

      expect(fetchServices).toHaveBeenCalledWith("https://ss.example.com", fullClient, fullService);
      expect(loader.availableServices.value).toEqual(services);
      expect(loader.error.value).toBeNull();
      expect(loader.isLoading.value).toBe(false);
    });
  });

  describe("debounce", () => {
    it("coalesces rapid input changes into a single fetch", async () => {
      vi.mocked(fetchServices).mockResolvedValue([]);

      const url = ref("https://ss.example.com");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<SubsystemId>(fullService);
      useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      url.value = "https://ss1.example.com";
      url.value = "https://ss2.example.com";
      url.value = "https://ss3.example.com";

      await vi.advanceTimersByTimeAsync(600);
      await vi.runAllTimersAsync();

      expect(fetchServices).toHaveBeenCalledTimes(1);
      expect(fetchServices).toHaveBeenLastCalledWith("https://ss3.example.com", fullClient, fullService);
    });

    it("honours custom debounceMs", async () => {
      vi.mocked(fetchServices).mockResolvedValue([]);

      const url = ref("https://ss.example.com");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<SubsystemId>(fullService);
      useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
        { debounceMs: 1000 },
      );

      url.value = "https://ss-new.example.com";

      await vi.advanceTimersByTimeAsync(500);
      expect(fetchServices).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(500);
      await vi.runAllTimersAsync();
      expect(fetchServices).toHaveBeenCalledTimes(1);
    });
  });

  describe("immediate clear on input change (no stale data during debounce window)", () => {
    it("clears availableServices and error immediately on any input change", async () => {
      vi.mocked(fetchServices).mockResolvedValue([{ serviceCode: "getInfo", serviceType: "REST", endpoints: [] }]);

      const url = ref("https://ss.example.com");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<SubsystemId>(fullService);
      const loader = useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      // Trigger a fetch + let it complete.
      url.value = "https://other.example.com";
      await vi.advanceTimersByTimeAsync(600);
      await vi.runAllTimersAsync();
      expect(loader.availableServices.value).toHaveLength(1);

      // Now change something — the deep watch fires on the next microtask
      // (Vue batches) and clears stale data before scheduling the debounced load.
      url.value = "https://different.example.com";
      await nextTick();
      expect(loader.availableServices.value).toEqual([]);
    });
  });

  describe("error path", () => {
    it("sets error and clears services on fetch failure", async () => {
      vi.mocked(fetchServices).mockRejectedValue(new Error("500"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const url = ref("https://ss.example.com");
      const client = ref<SubsystemId>(fullClient);
      const service = ref<SubsystemId>(fullService);
      const loader = useServicesLoader(
        () => url.value,
        () => client.value,
        () => service.value,
      );

      url.value = "https://x.example.com";
      await vi.advanceTimersByTimeAsync(600);
      await vi.runAllTimersAsync();

      expect(loader.error.value).toBe("xroad.service.fetchError");
      expect(loader.availableServices.value).toEqual([]);
      expect(loader.isLoading.value).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
