import axios from '@/plugins/axios';
import type { XRoadRequest, XRoadResponse } from '@/types';

const API_URL = '/api/xroad/execute';

export async function executeRequest(request: XRoadRequest): Promise<XRoadResponse> {
  const response = await axios.post<XRoadResponse>(API_URL, request);
  return response.data;
}

export default {
  executeRequest,
};
