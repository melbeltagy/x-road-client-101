import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchConfig } from "../config.service";
import axios from "@/plugins/axios";
import type { FrontendConfig } from "@/types";

vi.mock("@/plugins/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("config.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GETs /api/config and returns the response data", async () => {
    const cfg: FrontendConfig = { maxHistoryEntries: 30 };
    vi.mocked(axios.get).mockResolvedValue({ data: cfg });

    const result = await fetchConfig();

    expect(axios.get).toHaveBeenCalledWith("/api/config");
    expect(result).toEqual(cfg);
  });

  it("propagates axios errors", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("network down"));

    await expect(fetchConfig()).rejects.toThrow("network down");
  });
});
