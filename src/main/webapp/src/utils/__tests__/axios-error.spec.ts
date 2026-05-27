import { describe, it, expect } from "vitest";
import { coerceAxiosError, pickErrorMessage } from "../axios-error";

describe("coerceAxiosError", () => {
  it("reads status, statusText, data, and message from a typical axios rejection", () => {
    const err = {
      response: {
        status: 500,
        statusText: "Internal Server Error",
        data: { type: "foo", message: "boom" },
      },
      message: "Request failed with status 500",
    };

    expect(coerceAxiosError(err)).toEqual({
      status: 500,
      statusText: "Internal Server Error",
      data: { type: "foo", message: "boom" },
      message: "Request failed with status 500",
    });
  });

  it("returns all-undefined for an empty object", () => {
    expect(coerceAxiosError({})).toEqual({
      status: undefined,
      statusText: undefined,
      data: undefined,
      message: undefined,
    });
  });

  it("handles a network-level rejection (no .response)", () => {
    const err = { message: "Network Error" };

    expect(coerceAxiosError(err)).toEqual({
      status: undefined,
      statusText: undefined,
      data: undefined,
      message: "Network Error",
    });
  });

  it("survives null", () => {
    expect(coerceAxiosError(null)).toEqual({
      status: undefined,
      statusText: undefined,
      data: undefined,
      message: undefined,
    });
  });

  it("survives a string rejection", () => {
    expect(coerceAxiosError("oops")).toEqual({
      status: undefined,
      statusText: undefined,
      data: undefined,
      message: undefined,
    });
  });
});

describe("pickErrorMessage", () => {
  const fallback = "unknown";

  it("returns the fallback for non-object input", () => {
    expect(pickErrorMessage(null, fallback)).toBe("unknown");
    expect(pickErrorMessage(undefined, fallback)).toBe("unknown");
    expect(pickErrorMessage("string body", fallback)).toBe("unknown");
    expect(pickErrorMessage(123, fallback)).toBe("unknown");
  });

  describe("body branch (preferred when present)", () => {
    it("returns body when present and truthy", () => {
      expect(pickErrorMessage({ body: "something broke" }, fallback)).toBe("something broke");
    });

    it("falls back to statusText when body is empty", () => {
      expect(pickErrorMessage({ body: "", statusText: "Bad Request" }, fallback)).toBe("Bad Request");
    });

    it("falls back to the fallback when body and statusText are both empty", () => {
      expect(pickErrorMessage({ body: "", statusText: "" }, fallback)).toBe("unknown");
    });

    it("takes the body branch even if message is also present", () => {
      // body wins precedence — first key checked
      expect(pickErrorMessage({ body: "b", message: "m" }, fallback)).toBe("b");
    });
  });

  describe("detail branch", () => {
    it("returns detail when present (no body)", () => {
      expect(pickErrorMessage({ detail: "detailed problem" }, fallback)).toBe("detailed problem");
    });

    it("falls back to message inside the detail branch", () => {
      expect(pickErrorMessage({ detail: "", message: "m" }, fallback)).toBe("m");
    });

    it("falls back to fallback when detail and message are both empty", () => {
      expect(pickErrorMessage({ detail: "", message: "" }, fallback)).toBe("unknown");
    });
  });

  describe("message branch", () => {
    it("returns message when present (no body, no detail)", () => {
      expect(pickErrorMessage({ message: "a message" }, fallback)).toBe("a message");
    });

    it("coerces non-string messages to string", () => {
      expect(pickErrorMessage({ message: 42 }, fallback)).toBe("42");
    });
  });

  it("returns fallback for object with no recognized keys", () => {
    expect(pickErrorMessage({ foo: "bar" }, fallback)).toBe("unknown");
  });
});
