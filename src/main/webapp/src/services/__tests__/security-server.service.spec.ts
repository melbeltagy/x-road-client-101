import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRegisteredClients, fetchServices } from '../security-server.service';
import axios from '@/plugins/axios';
import type { SubsystemId, ServiceInfo } from '@/types';

vi.mock('@/plugins/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createMockSubsystem = (overrides?: Partial<SubsystemId>): SubsystemId => ({
  instanceId: 'TEST',
  memberClass: 'GOV',
  memberCode: '1234567-8',
  subsystemCode: 'TestClient',
  ...overrides,
});

const createMockServiceInfo = (overrides?: Partial<ServiceInfo>): ServiceInfo => ({
  serviceCode: 'getInfo',
  serviceType: 'REST',
  endpoints: [
    { method: 'GET', path: '/api/info' },
    { method: 'POST', path: '/api/data' },
  ],
  ...overrides,
});

describe('security-server.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchRegisteredClients', () => {
    it('should call the API with security server URL', async () => {
      const clients: SubsystemId[] = [createMockSubsystem()];
      vi.mocked(axios.get).mockResolvedValueOnce({ data: clients });

      await fetchRegisteredClients('https://ss.example.com');

      expect(axios.get).toHaveBeenCalledWith('/api/security-server/clients', {
        params: { securityServerUrl: 'https://ss.example.com' },
      });
    });

    it('should return list of clients', async () => {
      const clients: SubsystemId[] = [
        createMockSubsystem({ subsystemCode: 'Client1' }),
        createMockSubsystem({ subsystemCode: 'Client2' }),
      ];
      vi.mocked(axios.get).mockResolvedValueOnce({ data: clients });

      const result = await fetchRegisteredClients('https://ss.example.com');

      expect(result).toHaveLength(2);
      expect(result[0].subsystemCode).toBe('Client1');
      expect(result[1].subsystemCode).toBe('Client2');
    });

    it('should return empty array when no clients', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });

      const result = await fetchRegisteredClients('https://ss.example.com');

      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Network Error');
      vi.mocked(axios.get).mockRejectedValueOnce(error);

      await expect(fetchRegisteredClients('https://ss.example.com')).rejects.toThrow(
        'Network Error'
      );
    });
  });

  describe('fetchServices', () => {
    const clientSubsystem = createMockSubsystem({ subsystemCode: 'ClientApp' });
    const serviceSubsystem = createMockSubsystem({
      memberCode: '9876543-2',
      subsystemCode: 'ServiceProvider',
    });

    it('should call the API with all required parameters', async () => {
      const services: ServiceInfo[] = [createMockServiceInfo()];
      vi.mocked(axios.post).mockResolvedValueOnce({ data: services });

      await fetchServices('https://ss.example.com', clientSubsystem, serviceSubsystem);

      expect(axios.post).toHaveBeenCalledWith('/api/security-server/services', {
        securityServerUrl: 'https://ss.example.com',
        clientSubsystem,
        serviceSubsystem,
      });
    });

    it('should return list of services with endpoints', async () => {
      const services: ServiceInfo[] = [
        createMockServiceInfo({ serviceCode: 'getUserInfo' }),
        createMockServiceInfo({
          serviceCode: 'listUsers',
          endpoints: [{ method: 'GET', path: '/users' }],
        }),
      ];
      vi.mocked(axios.post).mockResolvedValueOnce({ data: services });

      const result = await fetchServices('https://ss.example.com', clientSubsystem, serviceSubsystem);

      expect(result).toHaveLength(2);
      expect(result[0].serviceCode).toBe('getUserInfo');
      expect(result[0].endpoints).toHaveLength(2);
      expect(result[1].serviceCode).toBe('listUsers');
      expect(result[1].endpoints).toHaveLength(1);
    });

    it('should return empty array when no services', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: [] });

      const result = await fetchServices('https://ss.example.com', clientSubsystem, serviceSubsystem);

      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Service unavailable');
      vi.mocked(axios.post).mockRejectedValueOnce(error);

      await expect(
        fetchServices('https://ss.example.com', clientSubsystem, serviceSubsystem)
      ).rejects.toThrow('Service unavailable');
    });
  });
});
