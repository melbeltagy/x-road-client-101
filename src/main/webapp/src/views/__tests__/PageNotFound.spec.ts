import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PageNotFound from "../PageNotFound.vue";
import { createTestI18n } from "@/test/i18n";

const push = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push }),
}));

describe("PageNotFound", () => {
  it("renders the 404 heading and translated message", () => {
    const wrapper = mount(PageNotFound, { global: { plugins: [createTestI18n()] } });
    expect(wrapper.text()).toContain("404");
    // From en.json: "The page does not exist."
    expect(wrapper.text()).toContain("The page does not exist.");
  });

  it("renders a Home button that navigates to /", async () => {
    push.mockClear();
    const wrapper = mount(PageNotFound, { global: { plugins: [createTestI18n()] } });

    const homeBtn = wrapper.findAll("button").find((b) => b.text().includes("Home"));
    expect(homeBtn).toBeDefined();

    await homeBtn?.trigger("click");
    expect(push).toHaveBeenCalledWith("/");
  });
});
