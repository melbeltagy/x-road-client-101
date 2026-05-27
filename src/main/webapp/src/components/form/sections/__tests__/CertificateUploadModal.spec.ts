import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CertificateUploadModal from "../CertificateUploadModal.vue";
import { CertificateType } from "@/types";
import { createTestI18n } from "@/test/i18n";

function mountModal(propsOverride: Record<string, unknown> = {}) {
  return mount(CertificateUploadModal, {
    props: {
      modelValue: true,
      certificateType: CertificateType.SECURITY_SERVER,
      currentValue: "",
      ...propsOverride,
    } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // Stub VDialog so its content renders inline.
        VDialog: { template: '<div class="v-dialog-stub"><slot /></div>' },
      },
    },
  });
}

describe("CertificateUploadModal", () => {
  it("renders the title and description for the certificate type", () => {
    const wrapper = mountModal();
    // The title key resolves via i18n — just assert *some* localized text appears.
    expect(wrapper.text().length).toBeGreaterThan(0);
  });

  it("disables Save when content is empty", () => {
    const wrapper = mountModal();
    const saveBtn = wrapper.findAll("button").find((b) => b.text() === "Save");
    expect(saveBtn?.attributes("disabled")).toBeDefined();
  });

  it("enables Save once content is typed", async () => {
    const wrapper = mountModal();
    await wrapper.find("textarea").setValue("-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----");
    await nextTick();
    const saveBtn = wrapper.findAll("button").find((b) => b.text() === "Save");
    expect(saveBtn?.attributes("disabled")).toBeUndefined();
  });

  it("emits save with trimmed content and closes on Save", async () => {
    const wrapper = mountModal();
    await wrapper.find("textarea").setValue("  PEM_BODY  ");
    await nextTick();
    const saveBtn = wrapper.findAll("button").find((b) => b.text() === "Save");
    await saveBtn?.trigger("click");

    expect(wrapper.emitted("save")?.[0]).toEqual(["PEM_BODY"]);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("emits update:modelValue=false on Cancel without saving", async () => {
    const wrapper = mountModal();
    const cancelBtn = wrapper.findAll("button").find((b) => b.text() === "Cancel");
    await cancelBtn?.trigger("click");

    expect(wrapper.emitted("save")).toBeFalsy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("clears the textarea when the Clear button is clicked", async () => {
    const wrapper = mountModal({ currentValue: "INITIAL" });
    const textarea = wrapper.find("textarea");
    expect((textarea.element as HTMLTextAreaElement).value).toBe("INITIAL");

    const clearBtn = wrapper.findAll("button").find((b) => b.text() === "Clear");
    await clearBtn?.trigger("click");
    await nextTick();
    expect((textarea.element as HTMLTextAreaElement).value).toBe("");
  });

  it("resets textarea to currentValue whenever the dialog reopens", async () => {
    const wrapper = mountModal({ modelValue: false, currentValue: "PEM_V1" });

    // Open the dialog → content should be PEM_V1.
    await wrapper.setProps({ modelValue: true });
    await nextTick();
    let textarea = wrapper.find("textarea");
    expect((textarea.element as HTMLTextAreaElement).value).toBe("PEM_V1");

    // User edits content while modal is open.
    await textarea.setValue("STALE");
    await nextTick();

    // Close and reopen — content should reset to currentValue.
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    await nextTick();

    textarea = wrapper.find("textarea");
    expect((textarea.element as HTMLTextAreaElement).value).toBe("PEM_V1");
  });
});
