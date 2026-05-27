import { describe, it, expect } from "vitest";
import { statusColorFor } from "../http-status";

describe("statusColorFor", () => {
  it("treats 0 as a client-side / network sentinel → error", () => {
    expect(statusColorFor(0)).toBe("error");
  });

  it.each([200, 201, 204, 299])("returns success for %i", (c) => {
    expect(statusColorFor(c)).toBe("success");
  });

  it.each([300, 301, 304, 399])("returns info for %i", (c) => {
    expect(statusColorFor(c)).toBe("info");
  });

  it.each([400, 401, 404, 499])("returns warning for %i", (c) => {
    expect(statusColorFor(c)).toBe("warning");
  });

  it.each([500, 502, 503])("returns error for 5xx (%i)", (c) => {
    expect(statusColorFor(c)).toBe("error");
  });

  it("returns error for codes outside the standard ranges", () => {
    expect(statusColorFor(100)).toBe("error");
    expect(statusColorFor(600)).toBe("error");
    expect(statusColorFor(-1)).toBe("error");
  });
});
