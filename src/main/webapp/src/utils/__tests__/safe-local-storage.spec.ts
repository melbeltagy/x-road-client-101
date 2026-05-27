import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeLocalStorage, drainStorageError, peekStorageError } from "../safe-local-storage";

// The global test setup mocks localStorage with vi.fn() stubs. Each test
// here resets default behavior, optionally rewires methods to throw, and
// drains the module-level error sink so state doesn't leak across tests.

describe("safe-local-storage", () => {
  beforeEach(() => {
    drainStorageError();
    vi.clearAllMocks();
    // Restore "noop / null" defaults — global setup may not reset behavior
    // between test files, only call counts.
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => undefined);
    vi.mocked(localStorage.removeItem).mockImplementation(() => undefined);
    vi.mocked(localStorage.clear).mockImplementation(() => undefined);
  });

  describe("happy path (delegates to localStorage)", () => {
    it("getItem returns the underlying value", () => {
      vi.mocked(localStorage.getItem).mockReturnValue("v");
      expect(safeLocalStorage.getItem("k")).toBe("v");
      expect(localStorage.getItem).toHaveBeenCalledWith("k");
    });

    it("setItem delegates with key + value", () => {
      safeLocalStorage.setItem("k", "v");
      expect(localStorage.setItem).toHaveBeenCalledWith("k", "v");
    });

    it("removeItem delegates with key", () => {
      safeLocalStorage.removeItem("k");
      expect(localStorage.removeItem).toHaveBeenCalledWith("k");
    });

    it("clear delegates", () => {
      safeLocalStorage.clear();
      expect(localStorage.clear).toHaveBeenCalled();
    });
  });

  describe("error sink (failures captured, not thrown)", () => {
    it('captures a setItem failure as a "save" error', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("quota exceeded");
      });

      expect(() => safeLocalStorage.setItem("k", "v")).not.toThrow();
      expect(drainStorageError()).toEqual({ op: "save", message: "quota exceeded" });
    });

    it('captures a getItem failure as a "load" error and returns null', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("disabled");
      });

      expect(safeLocalStorage.getItem("k")).toBeNull();
      expect(drainStorageError()).toEqual({ op: "load", message: "disabled" });
    });

    it('captures a removeItem failure as a "delete" error', () => {
      vi.mocked(localStorage.removeItem).mockImplementation(() => {
        throw new Error("locked");
      });

      expect(() => safeLocalStorage.removeItem("k")).not.toThrow();
      expect(drainStorageError()).toEqual({ op: "delete", message: "locked" });
    });

    it('captures a clear() failure as a "clear" error', () => {
      vi.mocked(localStorage.clear).mockImplementation(() => {
        throw new Error("forbidden");
      });

      expect(() => safeLocalStorage.clear()).not.toThrow();
      expect(drainStorageError()).toEqual({ op: "clear", message: "forbidden" });
    });

    it("coerces non-Error throws into a string message", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw "plain string";
      });

      safeLocalStorage.setItem("k", "v");
      expect(drainStorageError()).toEqual({ op: "save", message: "plain string" });
    });
  });

  describe("drain vs peek semantics", () => {
    it("peek returns the error without clearing it", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("e");
      });
      safeLocalStorage.setItem("k", "v");

      expect(peekStorageError()).toEqual({ op: "save", message: "e" });
      expect(peekStorageError()).toEqual({ op: "save", message: "e" });
      expect(drainStorageError()).toEqual({ op: "save", message: "e" });
      expect(drainStorageError()).toBeNull();
    });

    it("drain returns null when no error is pending", () => {
      expect(drainStorageError()).toBeNull();
    });

    it("a fresh error overwrites a previously-pending undrained one", () => {
      let n = 0;
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        n++;
        throw new Error(n === 1 ? "first" : "second");
      });

      safeLocalStorage.setItem("k", "v");
      safeLocalStorage.setItem("k", "v");

      expect(drainStorageError()).toEqual({ op: "save", message: "second" });
    });
  });
});
