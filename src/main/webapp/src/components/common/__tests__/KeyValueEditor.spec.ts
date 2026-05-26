import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import KeyValueEditor from '../KeyValueEditor.vue';
import type { KeyValuePair } from '@/composables';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      entity: { action: { add: 'Add', clear: 'Clear' } },
      placeholders: { key: 'KEY', value: 'VAL', empty: 'No items' },
      myTitle: 'My Title',
    },
  },
});

function pair(id: string, key: string, value: string): KeyValuePair {
  return { id, key, value };
}

const baseProps = {
  items: [] as KeyValuePair[],
  keyPlaceholderKey: 'placeholders.key',
  valuePlaceholderKey: 'placeholders.value',
  emptyMessageKey: 'placeholders.empty',
};

function mountEditor(propsOverride: Partial<typeof baseProps & { titleKey: string; showTitle: boolean }> = {}) {
  return mount(KeyValueEditor, {
    props: { ...baseProps, ...propsOverride } as never,
    global: { plugins: [i18n] },
  });
}

describe('KeyValueEditor', () => {
  describe('empty state', () => {
    it('shows the empty message when items is empty', () => {
      const wrapper = mountEditor({ items: [] });
      expect(wrapper.text()).toContain('No items');
    });

    it('renders Add and Clear buttons even when empty', () => {
      const wrapper = mountEditor({ items: [] });
      const buttons = wrapper.findAll('button').map((b) => b.text());
      expect(buttons.some((t) => t.includes('Add'))).toBe(true);
      expect(buttons.some((t) => t.includes('Clear'))).toBe(true);
    });
  });

  describe('title', () => {
    it('shows the title when titleKey is set and showTitle is not false', () => {
      const wrapper = mountEditor({ titleKey: 'myTitle' });
      expect(wrapper.text()).toContain('My Title');
    });

    it('hides the title when showTitle=false even with a titleKey', () => {
      const wrapper = mountEditor({ titleKey: 'myTitle', showTitle: false });
      expect(wrapper.text()).not.toContain('My Title');
    });
  });

  describe('item rendering', () => {
    it('renders one row per item, each with two inputs and a delete button', () => {
      const wrapper = mountEditor({
        items: [pair('1', 'k1', 'v1'), pair('2', 'k2', 'v2')],
      });

      const inputs = wrapper.findAll('input').filter((i) => i.attributes('type') !== 'file');
      // 2 rows × 2 text inputs each = 4
      expect(inputs.length).toBe(4);
      expect(inputs[0].element.value).toBe('k1');
      expect(inputs[1].element.value).toBe('v1');
      expect(inputs[2].element.value).toBe('k2');
      expect(inputs[3].element.value).toBe('v2');
    });
  });

  describe('events', () => {
    it('emits add on Add click', async () => {
      const wrapper = mountEditor();
      const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add'));
      await addBtn?.trigger('click');

      expect(wrapper.emitted('add')).toBeTruthy();
      expect(wrapper.emitted('add')?.length).toBe(1);
    });

    it('emits clear on Clear click', async () => {
      const wrapper = mountEditor({ items: [pair('1', 'a', 'b')] });
      const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Clear'));
      await clearBtn?.trigger('click');

      expect(wrapper.emitted('clear')).toBeTruthy();
    });

    it('emits remove with the row index on delete click', async () => {
      const wrapper = mountEditor({
        items: [pair('1', 'a', '1'), pair('2', 'b', '2'), pair('3', 'c', '3')],
      });

      // The row delete buttons are identified by having only an icon (no text label).
      // Filter to the icon-only buttons.
      const rowDeleteButtons = wrapper.findAll('button').filter((b) => b.text().trim() === '');
      expect(rowDeleteButtons.length).toBeGreaterThanOrEqual(3);

      await rowDeleteButtons[1].trigger('click');
      expect(wrapper.emitted('remove')).toBeTruthy();
      expect(wrapper.emitted('remove')?.[0]).toEqual([1]);
    });

    it('emits update with (index, "key", value) on key input', async () => {
      const wrapper = mountEditor({ items: [pair('1', 'a', '1')] });

      const inputs = wrapper.findAll('input').filter((i) => i.attributes('type') !== 'file');
      await inputs[0].setValue('Authorization');

      const updates = wrapper.emitted('update');
      expect(updates).toBeTruthy();
      expect(updates?.[0]).toEqual([0, 'key', 'Authorization']);
    });

    it('emits update with (index, "value", value) on value input', async () => {
      const wrapper = mountEditor({ items: [pair('1', 'a', '1')] });

      const inputs = wrapper.findAll('input').filter((i) => i.attributes('type') !== 'file');
      await inputs[1].setValue('Bearer xyz');

      const updates = wrapper.emitted('update');
      expect(updates?.[0]).toEqual([0, 'value', 'Bearer xyz']);
    });
  });
});
