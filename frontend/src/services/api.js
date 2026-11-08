const API_BASE_URL = import.meta.env.VITE_API_URL || "";

function apiRequest(path, options = {}) {
  const token = localStorage.getItem("anti-gaspi-token");
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).then(async (response) => {
    const body = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Erreur ${response.status}`);
    return body;
  });
}

export async function registerAccount(account) {
  const result = await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(account) });
  localStorage.setItem("anti-gaspi-token", result.token);
  return result.user;
}

export async function getAdminEntities() {
  return apiRequest("/api/admin/entities");
}

export async function createInvitation(invitation) {
  return apiRequest("/api/admin/invitations", { method: "POST", body: JSON.stringify(invitation) });
}

export async function createAdminEntity(entity) {
  return apiRequest("/api/admin/entities", { method: "POST", body: JSON.stringify(entity) });
}

export async function getAdminAccounts() {
  return apiRequest("/api/admin/accounts");
}

export async function deleteAdminAccount(accountId) {
  return apiRequest(`/api/admin/accounts/${accountId}`, { method: "DELETE" });
}

export async function createPasswordResetKey(accountId) {
  return apiRequest(`/api/admin/accounts/${accountId}/reset-key`, { method: "POST" });
}

export async function loginAccount(credentials) {
  const result = await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });
  localStorage.setItem("anti-gaspi-token", result.token);
  return result.user;
}

export async function resetAccountPassword(credentials) {
  return apiRequest("/api/auth/reset-password", { method: "POST", body: JSON.stringify(credentials) });
}

export async function logoutAccount() {
  await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("anti-gaspi-token");
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me").then((result) => result.user);
}

export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Le backend a répondu avec le statut ${response.status}`);
  }

  return response.json();
}

export async function getAvailableOfferings() {
  return apiRequest("/api/offerings");
}

export async function createOffering(offering) {
  return apiRequest("/api/offerings", { method: "POST", body: JSON.stringify(offering) });
}

export async function requestPickup(request) {
  return apiRequest("/api/pickup-requests", { method: "POST", body: JSON.stringify(request) });
}

export async function getPendingPickupRequests() {
  return apiRequest("/api/pickup-requests");
}

export async function completePickupRequest(requestId) {
  return apiRequest(`/api/pickup-requests/${requestId}/complete`, { method: "PATCH" });
}

export async function getDistributableOfferings() {
  return apiRequest("/api/distributions/offerings");
}

export async function getAssociationStock() {
  return apiRequest("/api/distributions/stock");
}

export async function requestDistribution(request) {
  return apiRequest("/api/distributions/requests", { method: "POST", body: JSON.stringify(request) });
}

export async function getPendingDistributionRequests() {
  return apiRequest("/api/distributions/requests");
}

export async function completeDistributionRequest(requestId) {
  return apiRequest(`/api/distributions/requests/${requestId}/complete`, { method: "PATCH" });
}
