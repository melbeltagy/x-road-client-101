import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TextareaWithErrorHighlight from "../TextareaWithErrorHighlight.vue";

function mountTextarea(props: Record<string, unknown> = {}) {
  return mount(TextareaWithErrorHighlight, {
    props: { modelValue: "", ...props } as never,
  });
}

describe("TextareaWithErrorHighlight", () => {
  it("renders a v-textarea", () => {
    const wrapper = mountTextarea();
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("emits update:modelValue when the textarea changes", async () => {
    const wrapper = mountTextarea({ modelValue: "" });
    const textarea = wrapper.find("textarea");
    await textarea.setValue("hello");

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["hello"]);
  });

  describe("highlight overlay", () => {
    it("does NOT render when errorSpan is null", () => {
      const wrapper = mountTextarea({ modelValue: "abc", errorSpan: null });
      expect(wrapper.find(".highlight-overlay").exists()).toBe(false);
    });

    it("does NOT render when modelValue is empty", () => {
      const wrapper = mountTextarea({ modelValue: "", errorSpan: { start: 0, end: 5 } });
      expect(wrapper.find(".highlight-overlay").exists()).toBe(false);
    });

    it("does NOT render when start === end (empty range)", () => {
      const wrapper = mountTextarea({ modelValue: "abc", errorSpan: { start: 1, end: 1 } });
      expect(wrapper.find(".highlight-overlay").exists()).toBe(false);
    });

    it("renders with before/bad/after split", () => {
      const wrapper = mountTextarea({
        modelValue: "curl -k https://x",
        errorSpan: { start: 5, end: 7 }, // "-k"
      });

      const overlay = wrapper.find(".highlight-overlay");
      expect(overlay.exists()).toBe(true);

      const spans = overlay.findAll("span");
      expect(spans).toHaveLength(3);
      // Use textContent to preserve leading/trailing whitespace — .text() trims.
      expect(spans[0].element.textContent).toBe("curl ");
      expect(spans[1].element.textContent).toBe("-k");
      expect(spans[2].element.textContent).toBe(" https://x");
      expect(spans[1].classes()).toContain("overlay-bad");
    });

    it("clamps a span that exceeds the text length", () => {
      const wrapper = mountTextarea({
        modelValue: "abc",
        errorSpan: { start: 1, end: 100 },
      });
      const spans = wrapper.find(".highlight-overlay").findAll("span");
      expect(spans[0].element.textContent).toBe("a");
      expect(spans[1].element.textContent).toBe("bc");
      expect(spans[2].element.textContent).toBe("");
    });

    it("clamps a negative start to 0", () => {
      const wrapper = mountTextarea({
        modelValue: "abc",
        errorSpan: { start: -5, end: 2 },
      });
      const spans = wrapper.find(".highlight-overlay").findAll("span");
      expect(spans[0].element.textContent).toBe("");
      expect(spans[1].element.textContent).toBe("ab");
      expect(spans[2].element.textContent).toBe("c");
    });
  });

  it("passes through placeholder + rows", () => {
    const wrapper = mountTextarea({
      placeholder: "paste cURL here",
      rows: 20,
    });
    const textarea = wrapper.find("textarea");
    expect(textarea.attributes("placeholder")).toBe("paste cURL here");
    expect(textarea.attributes("rows")).toBe("20");
  });
});
