import { describe, it, expect } from "vitest";
import { useKeyValueList } from "../useKeyValueList";

describe("useKeyValueList", () => {
  it("starts empty", () => {
    const list = useKeyValueList("p");
    expect(list.items.value).toEqual([]);
  });

  describe("add", () => {
    it("appends an empty row", () => {
      const list = useKeyValueList("qp");
      list.add();

      expect(list.items.value).toHaveLength(1);
      expect(list.items.value[0]).toMatchObject({ key: "", value: "" });
      expect(list.items.value[0].id).toMatch(/^qp-/);
    });

    it("generates distinct ids per row", () => {
      const list = useKeyValueList("p");
      list.add();
      list.add();
      list.add();

      const ids = list.items.value.map((i) => i.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe("update", () => {
    it("updates the key of a given row", () => {
      const list = useKeyValueList("p");
      list.add();
      list.update(0, "key", "Authorization");

      expect(list.items.value[0].key).toBe("Authorization");
    });

    it("updates the value of a given row", () => {
      const list = useKeyValueList("p");
      list.add();
      list.update(0, "value", "Bearer xyz");

      expect(list.items.value[0].value).toBe("Bearer xyz");
    });

    it("updates the correct row by index", () => {
      const list = useKeyValueList("p");
      list.add();
      list.add();
      list.update(1, "key", "X-Custom");

      expect(list.items.value[0].key).toBe("");
      expect(list.items.value[1].key).toBe("X-Custom");
    });
  });

  describe("remove", () => {
    it("removes the row at the given index", () => {
      const list = useKeyValueList("p");
      list.add();
      list.add();
      list.add();
      list.update(0, "key", "a");
      list.update(1, "key", "b");
      list.update(2, "key", "c");

      list.remove(1);

      expect(list.items.value.map((i) => i.key)).toEqual(["a", "c"]);
    });

    it("is a no-op for an out-of-range index", () => {
      const list = useKeyValueList("p");
      list.add();
      expect(() => list.remove(5)).not.toThrow();
      expect(list.items.value).toHaveLength(1);
    });
  });

  it("clear empties the list", () => {
    const list = useKeyValueList("p");
    list.add();
    list.add();
    list.clear();
    expect(list.items.value).toEqual([]);
  });

  describe("setFromRecord", () => {
    it("populates from a record", () => {
      const list = useKeyValueList("qp");
      list.setFromRecord({ q: "test", page: "1" });

      expect(list.items.value).toHaveLength(2);
      expect(list.items.value.map((i) => ({ k: i.key, v: i.value }))).toEqual([
        { k: "q", v: "test" },
        { k: "page", v: "1" },
      ]);
      // Ids use the configured prefix.
      list.items.value.forEach((i) => expect(i.id).toMatch(/^qp-/));
    });

    it("clears existing rows when called with undefined", () => {
      const list = useKeyValueList("p");
      list.add();
      list.setFromRecord(undefined);
      expect(list.items.value).toEqual([]);
    });

    it("clears existing rows when called with a fresh record (replace, not merge)", () => {
      const list = useKeyValueList("p");
      list.setFromRecord({ a: "1", b: "2" });
      list.setFromRecord({ c: "3" });
      expect(list.items.value.map((i) => i.key)).toEqual(["c"]);
    });
  });

  describe("toRecord", () => {
    it("returns undefined for an empty list (so XRoadRequest can omit the field entirely)", () => {
      const list = useKeyValueList("p");
      expect(list.toRecord()).toBeUndefined();
    });

    it("returns a record of non-empty rows", () => {
      const list = useKeyValueList("p");
      list.setFromRecord({ q: "foo", page: "1" });
      expect(list.toRecord()).toEqual({ q: "foo", page: "1" });
    });

    it("omits rows missing key or value", () => {
      const list = useKeyValueList("p");
      list.add(); // empty
      list.add();
      list.update(1, "key", "k"); // value missing
      list.add();
      list.update(2, "value", "v"); // key missing
      list.add();
      list.update(3, "key", "k2");
      list.update(3, "value", "v2");

      expect(list.toRecord()).toEqual({ k2: "v2" });
    });

    it("returns undefined when all rows are partial", () => {
      const list = useKeyValueList("p");
      list.add();
      list.update(0, "key", "k"); // no value

      expect(list.toRecord()).toBeUndefined();
    });

    it("round-trips through setFromRecord → toRecord", () => {
      const list = useKeyValueList("p");
      const record = { a: "1", b: "2", c: "3" };
      list.setFromRecord(record);
      expect(list.toRecord()).toEqual(record);
    });
  });

  describe("id prefix isolation", () => {
    it("two lists with different prefixes generate distinguishable ids", () => {
      const queryParams = useKeyValueList("qp");
      const headers = useKeyValueList("ch");
      queryParams.add();
      headers.add();

      expect(queryParams.items.value[0].id).toMatch(/^qp-/);
      expect(headers.items.value[0].id).toMatch(/^ch-/);
    });
  });
});
