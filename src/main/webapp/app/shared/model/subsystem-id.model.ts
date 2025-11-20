export interface SubsystemId {
  instanceId: string; // e.g., "DEV", "PROD"
  memberClass: string; // e.g., "COM", "GOV"
  memberCode: string; // e.g., "1234567-8"
  subsystemCode: string; // e.g., "TestClient", "DataService"
}
