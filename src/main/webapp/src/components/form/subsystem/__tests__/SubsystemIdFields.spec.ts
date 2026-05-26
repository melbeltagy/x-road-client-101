import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import SubsystemIdFields from '../SubsystemIdFields.vue';
import type { SubsystemId } from '@/types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      xroad: {
        client: {
          instanceId: 'Instance ID',
          memberClass: 'Member Class',
          memberCode: 'Member Code',
          subsystemCode: 'Subsystem Code',
        },
        service: {
          instanceId: 'Instance ID',
          memberClass: 'Member Class',
          memberCode: 'Member Code',
          subsystemCode: 'Subsystem Code',
        },
        placeholders: {
          instanceId: 'e.g. DEV',
          memberClass: 'e.g. GOV',
          memberCode: 'e.g. 123',
          subsystemCode: 'e.g. Sub',
          serviceMemberCode: 'svc member',
          serviceSubsystemCode: 'svc subsystem',
        },
      },
    },
  },
});

const baseProps = {
  prefix: 'client' as const,
  instanceId: '',
  memberClass: '',
  memberCode: '',
  subsystemCode: '',
  errors: {},
};

function mountFields(propsOverride: Record<string, unknown> = {}) {
  return mount(SubsystemIdFields, {
    props: { ...baseProps, ...propsOverride } as never,
    global: { plugins: [i18n] },
  });
}

const sub = (overrides: Partial<SubsystemId> = {}): SubsystemId => ({
  instanceId: 'DEV', memberClass: 'GOV', memberCode: '123', subsystemCode: 'Sub',
  ...overrides,
});

describe('SubsystemIdFields', () => {
  describe('field-level update emits', () => {
    it.each([
      ['instanceId', 'update:instanceId'],
      ['memberClass', 'update:memberClass'],
      ['memberCode', 'update:memberCode'],
      ['subsystemCode', 'update:subsystemCode'],
    ])('updating %s emits %s', async (field, eventName) => {
      const wrapper = mountFields();

      // Find inputs by their generated id (matches `${idPrefix}${field}` = field when no idPrefix).
      const input = wrapper.find(`#${field}`);
      await input.setValue('typed-value');

      expect(wrapper.emitted(eventName)).toBeTruthy();
      expect(wrapper.emitted(eventName)?.[0]).toEqual(['typed-value']);
    });
  });

  describe('select event on subsystemCode match', () => {
    it('emits select with the full SubsystemId when a matching suggestion exists', async () => {
      const target = sub({ subsystemCode: 'Target' });
      const wrapper = mountFields({
        instanceId: 'DEV',
        memberClass: 'GOV',
        memberCode: '123',
        suggestions: [target],
      });

      const input = wrapper.find('#subsystemCode');
      await input.setValue('Target');

      expect(wrapper.emitted('update:subsystemCode')?.[0]).toEqual(['Target']);
      expect(wrapper.emitted('select')).toBeTruthy();
      expect(wrapper.emitted('select')?.[0]).toEqual([target]);
    });

    it('does not emit select when no suggestion matches', async () => {
      const wrapper = mountFields({
        instanceId: 'DEV',
        memberClass: 'GOV',
        memberCode: '123',
        suggestions: [sub({ subsystemCode: 'Other' })],
      });

      const input = wrapper.find('#subsystemCode');
      await input.setValue('Unknown');

      expect(wrapper.emitted('update:subsystemCode')).toBeTruthy();
      expect(wrapper.emitted('select')).toBeUndefined();
    });

    it('only matches a suggestion whose preceding fields also match', async () => {
      const wrapper = mountFields({
        instanceId: 'DEV',
        memberClass: 'GOV',
        memberCode: '999', // doesn't match suggestion's 123
        suggestions: [sub({ subsystemCode: 'Target' })],
      });

      const input = wrapper.find('#subsystemCode');
      await input.setValue('Target');

      expect(wrapper.emitted('select')).toBeUndefined();
    });
  });

  describe('idPrefix prop', () => {
    it('prefixes field DOM ids when idPrefix is set', () => {
      const wrapper = mountFields({ idPrefix: 'service' });

      expect(wrapper.find('#serviceinstanceId').exists()).toBe(true);
      expect(wrapper.find('#serviceCode').exists()).toBe(false); // no collision
    });
  });

  describe('placeholders differ by prefix for memberCode / subsystemCode', () => {
    it('uses service-specific placeholder when prefix=service', () => {
      const wrapper = mountFields({ prefix: 'service' });
      const memberCodeInput = wrapper.find('#memberCode');
      expect(memberCodeInput.attributes('placeholder')).toBe('svc member');

      const subsystemCodeInput = wrapper.find('#subsystemCode');
      expect(subsystemCodeInput.attributes('placeholder')).toBe('svc subsystem');
    });

    it('uses generic placeholder when prefix=client', () => {
      const wrapper = mountFields({ prefix: 'client' });
      const memberCodeInput = wrapper.find('#memberCode');
      expect(memberCodeInput.attributes('placeholder')).toBe('e.g. 123');
    });
  });
});
