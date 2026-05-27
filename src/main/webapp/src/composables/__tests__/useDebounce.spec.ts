import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays a single call by ms", () => {
    const fn = vi.fn();
    const { debounced } = useDebounce(fn, 300);

    debounced();

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("coalesces rapid calls into a single trailing-edge invocation", () => {
    const fn = vi.fn();
    const { debounced } = useDebounce(fn, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes the latest args through to the underlying function", () => {
    const fn = vi.fn();
    const { debounced } = useDebounce(fn, 100);

    debounced("a", 1);
    debounced("b", 2);
    debounced("c", 3);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("c", 3);
  });

  it("allows separate invocations after the window expires", () => {
    const fn = vi.fn();
    const { debounced } = useDebounce(fn, 100);

    debounced("first");
    vi.advanceTimersByTime(100);

    debounced("second");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, "first");
    expect(fn).toHaveBeenNthCalledWith(2, "second");
  });

  describe("cancel", () => {
    it("cancels a pending invocation", () => {
      const fn = vi.fn();
      const { debounced, cancel } = useDebounce(fn, 100);

      debounced();
      cancel();
      vi.advanceTimersByTime(200);

      expect(fn).not.toHaveBeenCalled();
    });

    it("is a no-op when nothing is pending", () => {
      const { cancel } = useDebounce(vi.fn(), 100);
      expect(() => cancel()).not.toThrow();
    });

    it("allows new calls after a cancel", () => {
      const fn = vi.fn();
      const { debounced, cancel } = useDebounce(fn, 100);

      debounced();
      cancel();
      debounced("after-cancel");
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("after-cancel");
    });
  });

  it("does not register onUnmounted when called outside a component", () => {
    // Calling outside setup() must not throw — only registers cleanup
    // when getCurrentInstance() returns an instance.
    expect(() => useDebounce(() => undefined, 100)).not.toThrow();
  });
});
