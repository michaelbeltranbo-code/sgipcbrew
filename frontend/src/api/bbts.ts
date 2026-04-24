const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
export async function startBbtBottling(payload: { orderId: number }) {
  const res = await fetch(`${API_URL}/bbt/start-bottling`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || 'Error iniciando embotellado desde BBT');
  }

  return data;
}

export async function finishBbtBottling(payload: {
  orderId: number;
  units330: number;
  units269: number;
  lossLiters: number;
  note?: string;
}) {
  const res = await fetch(`${API_URL}/bbt/finish-bottling`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || 'Error finalizando embotellado desde BBT');
  }

  return data;
}
export async function getBbts() {
  const res = await fetch(`${API_URL}/bbt`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Error al cargar BBTs');
  return res.json();
}

export async function getAvailableBbts() {
  const res = await fetch(`${API_URL}/bbt/available`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Error al cargar BBTs disponibles');
  return res.json();
}

export async function getAvailableFromFermenters() {
  const res = await fetch(`${API_URL}/bbt/available-from-fermenters`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Error al cargar cervezas en trasiego');
  return res.json();
}

export async function transferToBbt(payload: {
  fermenterId: number;
  bbtId: number;
  processType: 'CLARIFICAR' | 'CARBONATAR';
  litersTransferred: number;
  lossLiters: number;
  notes?: string;
}) {
  const res = await fetch(`${API_URL}/bbt/transfer`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Error al transferir al BBT');
  }

  return res.json();
}

export async function updateBbtStatus(
  id: number,
  payload: { status: string },
) {
  const res = await fetch(`${API_URL}/bbt/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Error al actualizar estado del BBT');
  }

  return res.json();
}

export async function getBbtById(id: number) {
  const res = await fetch(`${API_URL}/bbt/${id}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error('Error al cargar BBT');
  return res.json();
}

export async function kegDownFromBbt(
  id: number,
  payload: {
    kegs60: number;
    kegs50: number;
    kegs30: number;
    partialLiters?: number;
    lossLiters: number;
    note?: string;
  },
) {
  const res = await fetch(`${API_URL}/bbt/${id}/keg-down`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Error al registrar barriles desde el BBT');
  }

  return res.json();
}

export async function sendToBottlingFromBbt(
  id: number,
  payload: { note?: string },
) {
  const res = await fetch(`${API_URL}/bbt/${id}/send-to-bottling`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Error al enviar el BBT a embotellado');
  }

  return res.json();
}