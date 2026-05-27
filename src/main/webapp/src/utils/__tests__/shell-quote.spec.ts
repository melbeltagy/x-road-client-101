import { describe, it, expect } from "vitest";
import { shellSingleQuote } from "../shell-quote";

describe("shellSingleQuote", () => {
  it("wraps a plain string in single quotes", () => {
    expect(shellSingleQuote("hello")).toBe("'hello'");
  });

  it("preserves spaces", () => {
    expect(shellSingleQuote("hello world")).toBe("'hello world'");
  });

  it("preserves double quotes", () => {
    expect(shellSingleQuote('"value"')).toBe(`'"value"'`);
  });

  it("preserves shell metacharacters", () => {
    expect(shellSingleQuote("$HOME && rm -rf /")).toBe("'$HOME && rm -rf /'");
  });

  it("escapes a single quote via the POSIX close-escape-open dance", () => {
    expect(shellSingleQuote("John's data")).toBe("'John'\\''s data'");
  });

  it("escapes multiple single quotes independently", () => {
    expect(shellSingleQuote("a'b'c")).toBe("'a'\\''b'\\''c'");
  });

  it("wraps an empty string as the empty quoted token", () => {
    expect(shellSingleQuote("")).toBe("''");
  });

  it("handles a value that is only a single quote", () => {
    expect(shellSingleQuote("'")).toBe("''\\'''");
  });

  it("preserves newlines literally inside the quoted string", () => {
    expect(shellSingleQuote("line1\nline2")).toBe("'line1\nline2'");
  });
});
