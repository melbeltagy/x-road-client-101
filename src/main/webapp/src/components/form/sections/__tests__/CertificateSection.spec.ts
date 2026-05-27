import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CertificateSection from "../CertificateSection.vue";
import { CertificateType } from "@/types";
import { createTestI18n } from "@/test/i18n";

function mountSection(certificates: Record<string, string> = {}) {
  return mount(CertificateSection, {
    props: { certificates } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        ClearButton: {
          template: '<button class="clear-stub" @click="$emit(\'click\')">clear</button>',
          emits: ["click"],
        },
        CertificateUploadModal: {
          props: ["modelValue", "certificateType", "currentValue"],
          emits: ["update:modelValue", "save"],
          template: '<div class="modal-stub" :data-open="modelValue" :data-type="certificateType" :data-value="currentValue" />',
        },
      },
    },
  });
}

describe("CertificateSection", () => {
  it("shows an add button for each certificate type when none are configured", () => {
    const wrapper = mountSection();
    const addButtons = wrapper.findAll('button[title="Add"]');
    // 3 certificate slots → 3 add buttons.
    expect(addButtons.length).toBe(3);
  });

  it("shows view + delete buttons in place of add when a certificate is configured", () => {
    const wrapper = mountSection({ [CertificateType.SECURITY_SERVER]: "PEM" });
    // The configured row replaces its add button with view + delete.
    const viewBtn = wrapper.find('button[title="View"]');
    const deleteBtns = wrapper.findAll('button[title="Delete"]');
    expect(viewBtn.exists()).toBe(true);
    expect(deleteBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("emits update:certificates({}) when the global clear is clicked", async () => {
    const wrapper = mountSection({
      [CertificateType.SECURITY_SERVER]: "x",
      [CertificateType.CLIENT_CERT]: "y",
    });
    await wrapper.find(".clear-stub").trigger("click");
    const ev = wrapper.emitted("update:certificates");
    expect(ev).toBeTruthy();
    expect(ev![0][0]).toEqual({});
  });

  it("emits update:certificates omitting a deleted cert", async () => {
    const wrapper = mountSection({
      [CertificateType.SECURITY_SERVER]: "ss",
      [CertificateType.CLIENT_CERT]: "cc",
    });
    // Click the first row's delete button.
    const deleteBtns = wrapper.findAll('button[title="Delete"]');
    expect(deleteBtns.length).toBeGreaterThanOrEqual(2);
    await deleteBtns[0].trigger("click");

    const ev = wrapper.emitted("update:certificates");
    expect(ev).toBeTruthy();
    // SECURITY_SERVER is first in the metadata list, so its row's delete fires first.
    expect((ev![0][0] as Record<string, string>)[CertificateType.SECURITY_SERVER]).toBe("");
    expect((ev![0][0] as Record<string, string>)[CertificateType.CLIENT_CERT]).toBe("cc");
  });

  it("opens the upload modal with the right cert type and current value", async () => {
    const wrapper = mountSection({ [CertificateType.SECURITY_SERVER]: "PEM_SS" });

    // Click the view button for the configured SECURITY_SERVER row.
    const viewBtn = wrapper.find('button[title="View"]');
    expect(viewBtn.exists()).toBe(true);
    await viewBtn.trigger("click");
    await nextTick();

    const modal = wrapper.find(".modal-stub");
    expect(modal.exists()).toBe(true);
    expect(modal.attributes("data-type")).toBe(CertificateType.SECURITY_SERVER);
    expect(modal.attributes("data-value")).toBe("PEM_SS");
    expect(modal.attributes("data-open")).toBe("true");
  });

  it("emits update:certificates with the saved value after the modal saves", async () => {
    const wrapper = mountSection();

    // Open modal by clicking the first add button (SECURITY_SERVER row).
    await wrapper.find('button[title="Add"]').trigger("click");
    await nextTick();

    // The modal stub is now in the DOM. Locate it via its rendered element and
    // dispatch the 'save' event on the underlying component instance.
    const modalEl = wrapper.find(".modal-stub");
    expect(modalEl.exists()).toBe(true);
    const modalComp = wrapper.getComponent(".modal-stub");
    modalComp.vm.$emit("save", "NEW_PEM");
    await nextTick();

    const ev = wrapper.emitted("update:certificates");
    expect(ev).toBeTruthy();
    expect((ev![ev!.length - 1][0] as Record<string, string>)[CertificateType.SECURITY_SERVER]).toBe("NEW_PEM");
  });
});
