import axios from "@/plugins/axios";
import type { FrontendConfig } from "@/types";

const CONFIG_URL = "/api/config";

export async function fetchConfig(): Promise<FrontendConfig> {
  const response = await axios.get<FrontendConfig>(CONFIG_URL);
  return response.data;
}
