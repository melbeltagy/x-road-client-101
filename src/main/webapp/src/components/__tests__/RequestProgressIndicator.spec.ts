import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import RequestProgressIndicator from '../RequestProgressIndicator.vue';
import type { XRoadRequest, MTlsCertificates, SubsystemId } from '@/types';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      xroad: {
        progress: {
          securityServer: 'SS *',
          clientIdentifier: 'Client *',
          serviceIdentifier: 'Service *',
          endpoint: 'Endpoint *',
          queryParameters: 'Query Params',
          customHeaders: 'Headers',
          certificates: 'Certificates',
          next: 'Next',
        },
      },
    },
  },
});

const full = (overrides: Partial<SubsystemId> = {}): SubsystemId => ({
  instanceId: 'TEST', memberClass: 'GOV', memberCode: '1', subsystemCode: 'C',
  ...overrides,
});

function emptyFormData(): Partial<XRoadRequest> {
  return {};
}

function fullFormData(): Partial<XRoadRequest> {
  return {
    client: { subsystem: full(), securityServerUrl: 'https://ss.example.com' },
    service: { subsystem: full({ memberCode: '2', subsystemCode: 'S' }), serviceCode: 'getInfo' },
    request: { method: 'GET', path: '/api' },
  };
}

function mountIndicator(formData: Partial<XRoadRequest>, certificates: MTlsCertificates = {}) {
  return mount(RequestProgressIndicator, {
    props: { formData, certificates },
    global: { plugins: [i18n] },
  });
}

describe('RequestProgressIndicator', () => {
  describe('rendering', () => {
    it('renders all 7 step chips', () => {
      const wrapper = mountIndicator(emptyFormData());
      const steps = wrapper.findAll('.step');
      expect(steps).toHaveLength(7);
    });
  });

  describe('next-step marker', () => {
    it('points at securityServer first when form is empty', () => {
      const wrapper = mountIndicator(emptyFormData());
      // The "Next" marker appears only on the next required step.
      const nextMarkers = wrapper.findAll('.next-marker');
      expect(nextMarkers).toHaveLength(1);

      // Verify it's on the securityServer chip.
      const ssStep = wrapper.findAll('.step').find((s) => s.text().includes('SS'));
      expect(ssStep?.find('.next-marker').exists()).toBe(true);
    });

    it('advances to clientIdentifier when securityServer is filled', () => {
      const wrapper = mountIndicator({
        client: { securityServerUrl: 'https://ss.example.com', subsystem: undefined as never },
      });

      const clientStep = wrapper.findAll('.step').find((s) => s.text().includes('Client'));
      expect(clientStep?.find('.next-marker').exists()).toBe(true);
    });

    it('disappears when all required steps are complete', () => {
      const wrapper = mountIndicator(fullFormData());
      expect(wrapper.findAll('.next-marker')).toHaveLength(0);
    });

    it('does not point at optional steps even when they are unfilled', () => {
      // Required steps all complete; optional ones (query params, headers, certs) are empty.
      const wrapper = mountIndicator(fullFormData());
      expect(wrapper.findAll('.next-marker')).toHaveLength(0);
    });
  });

  describe('completeness icons', () => {
    it('uses check_circle for a completed step', () => {
      const wrapper = mountIndicator({
        client: { securityServerUrl: 'https://x', subsystem: undefined as never },
      });
      const ssStep = wrapper.findAll('.step').find((s) => s.text().includes('SS'));
      expect(ssStep?.html()).toContain('check_circle');
    });

    it('uses warning for the next required step', () => {
      const wrapper = mountIndicator(emptyFormData());
      const ssStep = wrapper.findAll('.step').find((s) => s.text().includes('SS'));
      expect(ssStep?.html()).toContain('warning');
    });

    it('uses radio_button_unchecked for optional steps that are not complete', () => {
      const wrapper = mountIndicator(emptyFormData());
      const qpStep = wrapper.findAll('.step').find((s) => s.text().includes('Query Params'));
      expect(qpStep?.html()).toContain('radio_button_unchecked');
    });

    it('marks optional steps as complete when filled', () => {
      const data = fullFormData();
      data.request!.queryParams = { q: 'test' };
      const wrapper = mountIndicator(data);

      const qpStep = wrapper.findAll('.step').find((s) => s.text().includes('Query Params'));
      expect(qpStep?.html()).toContain('check_circle');
    });
  });

  describe('navigation', () => {
    it('emits navigate with the step key when a chip is clicked', async () => {
      const wrapper = mountIndicator(emptyFormData());
      const clientStep = wrapper.findAll('.step').find((s) => s.text().includes('Client'));
      await clientStep?.trigger('click');

      expect(wrapper.emitted('navigate')).toBeTruthy();
      expect(wrapper.emitted('navigate')?.[0]).toEqual(['clientIdentifier']);
    });

    it.each([
      ['SS', 'securityServer'],
      ['Client', 'clientIdentifier'],
      ['Service', 'serviceIdentifier'],
      ['Endpoint', 'endpoint'],
      ['Query Params', 'queryParameters'],
      ['Headers', 'customHeaders'],
      ['Certificates', 'certificates'],
    ])('click "%s" emits navigate(%s)', async (label, key) => {
      const wrapper = mountIndicator(emptyFormData());
      const step = wrapper.findAll('.step').find((s) => s.text().includes(label));
      await step?.trigger('click');

      expect(wrapper.emitted('navigate')?.[0]).toEqual([key]);
    });
  });
});
