import { httpPost } from "./http";

export function createClientOnboarding(payload) {
  return httpPost("/admin/onboarding-client", payload);
}
