import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import RequestStatusPanel from '../RequestStatusPanel.vue';
import type { XRoadRequest, MTlsCertificates } from '@/types';

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      xroad: {
        status: {
          client: 'X-Road-Client',
          serviceUrl: 'Service URL',
          notSent: 'Not sent',
          success: 'Success',
          error: 'Error',
          notConfigured: 'Not configured',
          mtlsEnabled: 'mTLS Enabled',
          mtlsDisabled: 'mTLS Disabled',
          httpsNoAuth: 'HTTPS (No Auth)',
          noHttpsCert: 'No HTTPS Cert',
        },
        action: {
          exportCurl: 'Export cURL',
        },
        request: {
          submit: 'Send Request',
          sending: 'Sending...',
        },
        toast: {
          curlCopied: 'cURL command copied',
          curlCopyFailed: 'Failed to copy cURL',
        },
      },
    },
  },
});

const createDefaultProps = () => ({
  client: {
    subsystem: {
      instanceId: '',
      memberClass: '',
      memberCode: '',
      subsystemCode: '',
    },
    securityServerUrl: '',
  },
  service: {
    subsystem: {
      instanceId: '',
      memberClass: '',
      memberCode: '',
      subsystemCode: '',
    },
    serviceCode: '',
    serviceVersion: '',
  },
  requestPath: '',
  certificates: {
    securityServerCert: '',
    clientCert: '',
    clientPrivateKey: '',
  } as MTlsCertificates,
  lastRequestSuccess: null as boolean | null,
  loading: false,
  isFormValid: false,
  request: null as XRoadRequest | null,
});

const createCompleteProps = () => ({
  client: {
    subsystem: {
      instanceId: 'TEST',
      memberClass: 'GOV',
      memberCode: '1234567-8',
      subsystemCode: 'TestClient',
    },
    securityServerUrl: 'https://ss.example.com',
  },
  service: {
    subsystem: {
      instanceId: 'TEST',
      memberClass: 'GOV',
      memberCode: '9876543-2',
      subsystemCode: 'DataService',
    },
    serviceCode: 'getInfo',
    serviceVersion: 'v1',
  },
  requestPath: '/api/data',
  certificates: {
    securityServerCert: '-----BEGIN CERTIFICATE-----',
    clientCert: '-----BEGIN CERTIFICATE-----',
    clientPrivateKey: '-----BEGIN PRIVATE KEY-----',
  } as MTlsCertificates,
  lastRequestSuccess: true,
  loading: false,
  isFormValid: true,
  request: {
    client: {
      subsystem: {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234567-8',
        subsystemCode: 'TestClient',
      },
      securityServerUrl: 'https://ss.example.com',
    },
    service: {
      subsystem: {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '9876543-2',
        subsystemCode: 'DataService',
      },
      serviceCode: 'getInfo',
      serviceVersion: 'v1',
    },
    request: {
      method: 'GET',
      path: '/api/data',
    },
  } as XRoadRequest,
});

const mountComponent = (props = createDefaultProps()) => {
  return mount(RequestStatusPanel, {
    props,
    global: {
      plugins: [i18n],
      stubs: {
        VFooter: {
          template: '<div class="v-footer"><slot /></div>',
        },
      },
    },
  });
};

describe('RequestStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render X-Road-Client label', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('X-Road-Client');
    });

    it('should render Service URL label', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('Service URL');
    });

    it('should show "Not configured" when client is empty', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('Not configured');
    });

    it('should show client header when client fields are filled', () => {
      const props = createDefaultProps();
      props.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('TEST/GOV/1234/Client');
    });

    it('should show partial client header as user types', () => {
      const props = createDefaultProps();
      props.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '',
        subsystemCode: '',
      };
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('TEST/GOV//');
    });
  });

  describe('mTLS status', () => {
    it('should show mTLS Disabled when no certificates', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('mTLS Disabled');
    });

    it('should show mTLS Enabled when all certificates are provided', () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('mTLS Enabled');
    });

    it('should show mTLS Disabled when only some certificates are provided', () => {
      const props = createDefaultProps();
      props.certificates = {
        securityServerCert: '-----BEGIN CERTIFICATE-----',
        clientCert: '',
        clientPrivateKey: '',
      };
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('mTLS Disabled');
    });
  });

  describe('HTTPS status', () => {
    it('should show No HTTPS Cert when no server cert', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('No HTTPS Cert');
    });

    it('should show HTTPS (No Auth) when server cert is provided', () => {
      const props = createDefaultProps();
      props.certificates = {
        securityServerCert: '-----BEGIN CERTIFICATE-----',
        clientCert: '',
        clientPrivateKey: '',
      };
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('HTTPS (No Auth)');
    });
  });

  describe('request status', () => {
    it('should show Not sent when lastRequestSuccess is null', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('Not sent');
    });

    it('should show Success when lastRequestSuccess is true', () => {
      const props = createDefaultProps();
      props.lastRequestSuccess = true;
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('Success');
    });

    it('should show Error when lastRequestSuccess is false', () => {
      const props = createDefaultProps();
      props.lastRequestSuccess = false;
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('Error');
    });
  });

  describe('send button', () => {
    it('should show Send Request text when not loading', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('Send Request');
    });

    it('should show Sending... text when loading', () => {
      const props = createDefaultProps();
      props.loading = true;
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('Sending...');
    });

    it('should be disabled when client is incomplete', () => {
      const props = createDefaultProps();
      const wrapper = mountComponent(props);
      const sendBtn = wrapper.findAll('button').find((b) => b.text().includes('Send Request'));
      expect(sendBtn?.attributes('disabled')).toBeDefined();
    });

    it('should be enabled when all fields are complete', () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      const sendBtn = wrapper.findAll('button').find((b) => b.text().includes('Send Request'));
      expect(sendBtn?.attributes('disabled')).toBeUndefined();
    });

    it('should emit submit event when clicked', async () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      const sendBtn = wrapper.findAll('button').find((b) => b.text().includes('Send Request'));
      await sendBtn?.trigger('click');
      expect(wrapper.emitted('submit')).toBeTruthy();
    });
  });

  describe('export cURL button', () => {
    it('should show Export cURL button', () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain('Export cURL');
    });

    it('should be disabled when no request', () => {
      const wrapper = mountComponent();
      const curlBtn = wrapper.findAll('button').find((b) => b.text().includes('Export cURL'));
      expect(curlBtn?.attributes('disabled')).toBeDefined();
    });

    it('should be enabled when request is available and service is complete', () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      const curlBtn = wrapper.findAll('button').find((b) => b.text().includes('Export cURL'));
      expect(curlBtn?.attributes('disabled')).toBeUndefined();
    });

    it('should copy cURL to clipboard when clicked', async () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      const curlBtn = wrapper.findAll('button').find((b) => b.text().includes('Export cURL'));
      await curlBtn?.trigger('click');
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should emit showAlert with success when copy succeeds', async () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      const curlBtn = wrapper.findAll('button').find((b) => b.text().includes('Export cURL'));
      await curlBtn?.trigger('click');
      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(wrapper.emitted('showAlert')).toBeTruthy();
      expect(wrapper.emitted('showAlert')?.[0]).toEqual(['success', 'cURL command copied']);
    });

    it('should emit showAlert with error when copy fails', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Copy failed'));
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      const curlBtn = wrapper.findAll('button').find((b) => b.text().includes('Export cURL'));
      await curlBtn?.trigger('click');
      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(wrapper.emitted('showAlert')).toBeTruthy();
      expect(wrapper.emitted('showAlert')?.[0]).toEqual(['error', 'Failed to copy cURL']);
    });
  });

  describe('service URL display', () => {
    it('should show Not configured when no service fields', () => {
      const wrapper = mountComponent();
      // There should be two "Not configured" - one for client, one for service
      const matches = wrapper.text().match(/Not configured/g);
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    });

    it('should show service URL when fields are filled', () => {
      const props = createCompleteProps();
      const wrapper = mountComponent(props);
      expect(wrapper.text()).toContain('/r1/TEST/GOV/9876543-2/DataService/getInfo');
    });
  });
});
