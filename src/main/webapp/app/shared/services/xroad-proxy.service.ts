import axios from 'axios';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { XRoadResponse } from 'app/shared/model/xroad-response.model';

const API_URL = '/api/xroad';

/**
 * Service for making X-Road requests through the backend proxy.
 */
export const xroadProxyService = {
  /**
   * Execute X-Road request through Security Server.
   *
   * @param request the X-Road request
   * @returns Promise with X-Road response
   */
  async executeRequest(request: XRoadRequest): Promise<XRoadResponse> {
    const response = await axios.post<XRoadResponse>(`${API_URL}/execute`, request);
    return response.data;
  },
};
