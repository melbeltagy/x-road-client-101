import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import CurlImportDialog from '../CurlImportDialog.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      entity: { action: { cancel: 'Cancel' } },
      xroad: {
        curlImport: {
          title: 'Import from cURL',
          description: 'Paste a cURL command…',
          importButton: 'Import',
        },
      },
    },
  },
});

function mountDialog(modelValue = true) {
  return mount(CurlImportDialog, {
    props: { modelValue },
    global: {
      plugins: [i18n],
      // Stub VDialog so content renders inline (avoids teleport-to-body in tests).
      stubs: {
        VDialog: { template: '<div class="v-dialog-stub"><slot /></div>' },
      },
    },
  });
}

const validCurl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
const invalidCurl = `not a curl command`;

describe('CurlImportDialog', () => {
  describe('rendering', () => {
    it('renders the title and import button when open', () => {
      const wrapper = mountDialog(true);
      expect(wrapper.text()).toContain('Import from cURL');
      expect(wrapper.text()).toContain('Import');
    });

    it('emits update:modelValue=false when cancel is clicked', async () => {
      const wrapper = mountDialog(true);
      const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
      await cancelBtn?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('parse + import flow', () => {
    it('Import button is disabled when textarea is empty', () => {
      const wrapper = mountDialog(true);
      const importBtn = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Import');
      expect(importBtn?.attributes('disabled')).toBeDefined();
    });

    it('Import button enables when a valid cURL is pasted', async () => {
      const wrapper = mountDialog(true);
      const textarea = wrapper.find('textarea');
      await textarea.setValue(validCurl);
      await nextTick();

      const importBtn = wrapper.findAll('button').find((b) => b.text() === 'Import');
      expect(importBtn?.attributes('disabled')).toBeUndefined();
    });

    it('shows error alert + keeps Import disabled on invalid input', async () => {
      const wrapper = mountDialog(true);
      const textarea = wrapper.find('textarea');
      await textarea.setValue(invalidCurl);
      await nextTick();

      // v-alert rendered for the parse error.
      const alerts = wrapper.findAll('.v-alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);

      const importBtn = wrapper.findAll('button').find((b) => b.text() === 'Import');
      expect(importBtn?.attributes('disabled')).toBeDefined();
    });

    it('emits import with parsed request on Import click', async () => {
      const wrapper = mountDialog(true);
      const textarea = wrapper.find('textarea');
      await textarea.setValue(validCurl);
      await nextTick();

      const importBtn = wrapper.findAll('button').find((b) => b.text() === 'Import');
      await importBtn?.trigger('click');

      const importEvents = wrapper.emitted('import');
      expect(importEvents).toBeTruthy();
      const payload = importEvents![0][0] as { request: { service: { serviceCode: string } } };
      expect(payload.request.service.serviceCode).toBe('getInfo');

      // Also closes the dialog.
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('reopen behavior', () => {
    it('clears textarea when dialog reopens', async () => {
      const wrapper = mountDialog(false);
      await wrapper.setProps({ modelValue: true });
      await nextTick();

      let textarea = wrapper.find('textarea');
      await textarea.setValue('stale content');
      await nextTick();
      expect((textarea.element as HTMLTextAreaElement).value).toBe('stale content');

      await wrapper.setProps({ modelValue: false });
      await wrapper.setProps({ modelValue: true });
      await nextTick();

      textarea = wrapper.find('textarea');
      expect((textarea.element as HTMLTextAreaElement).value).toBe('');
    });
  });
});
