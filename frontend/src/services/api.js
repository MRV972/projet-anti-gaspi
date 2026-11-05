const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Le backend a répondu avec le statut ${response.status}`);
  }

  return response.json();
}

export async function getAvailableOfferings() {
  const response = await fetch(`${API_BASE_URL}/api/offerings`);
  if (!response.ok) throw new Error("Impossible de charger les denrées disponibles");
  return response.json();
}

export async function createOffering(offering) {
  const response = await fetch(`${API_BASE_URL}/api/offerings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offering),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Impossible de publier la denrée");
  }
  return response.json();
}

export async function requestPickup(request) {
  const response = await fetch(`${API_BASE_URL}/api/pickup-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Impossible d'envoyer la demande");
  }
  return response.json();
}

export async function getPendingPickupRequests() {
  const response = await fetch(`${API_BASE_URL}/api/pickup-requests`);
  if (!response.ok) throw new Error("Impossible de charger les demandes de récupération");
  return response.json();
}

export async function completePickupRequest(requestId) {
  const response = await fetch(`${API_BASE_URL}/api/pickup-requests/${requestId}/complete`, {
    method: "PATCH",
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Impossible de confirmer la récupération");
  }
  return response.json();
}

export async function getDistributableOfferings() {
  const response = await fetch(`${API_BASE_URL}/api/distributions/offerings`);
  if (!response.ok) throw new Error("Impossible de charger les distributions");
  return response.json();
}

export async function requestDistribution(request) {
  const response = await fetch(`${API_BASE_URL}/api/distributions/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Impossible de demander cette denrée");
  }
  return response.json();
}

export async function getPendingDistributionRequests() {
  const response = await fetch(`${API_BASE_URL}/api/distributions/requests`);
  if (!response.ok) throw new Error("Impossible de charger les demandes de retrait");
  return response.json();
}

export async function completeDistributionRequest(requestId) {
  const response = await fetch(`${API_BASE_URL}/api/distributions/requests/${requestId}/complete`, {
    method: "PATCH",
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Impossible de confirmer le retrait");
  }
  return response.json();
}
