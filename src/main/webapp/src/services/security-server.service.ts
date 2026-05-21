import axios from '@/plugins/axios';
import type { SubsystemId, ServiceInfo } from '@/types';

const CLIENTS_URL = '/api/security-server/clients';
const SERVICES_URL = '/api/security-server/services';

export async function fetchRegisteredClients(securityServerUrl: string): Promise<SubsystemId[]> {
  const response = await axios.get<SubsystemId[]>(CLIENTS_URL, {
    params: { securityServerUrl },
  });
  return response.data;
}

export async function fetchServices(
  securityServerUrl: string,
  clientSubsystem: SubsystemId,
  serviceSubsystem: SubsystemId
): Promise<ServiceInfo[]> {
  const response = await axios.get<ServiceInfo[]>(SERVICES_URL, {
    params: {
      securityServerUrl,
      clientInstanceId: clientSubsystem.instanceId,
      clientMemberClass: clientSubsystem.memberClass,
      clientMemberCode: clientSubsystem.memberCode,
      clientSubsystemCode: clientSubsystem.subsystemCode,
      serviceInstanceId: serviceSubsystem.instanceId,
      serviceMemberClass: serviceSubsystem.memberClass,
      serviceMemberCode: serviceSubsystem.memberCode,
      serviceSubsystemCode: serviceSubsystem.subsystemCode,
    },
  });
  return response.data;
}

export default {
  fetchRegisteredClients,
  fetchServices,
};
