import type {
  HealthResponse,
  Movement,
  MovementPayload,
  MovementStats,
  Support,
  MovementUpdatePayload,
} from "../types";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}

export async function fetchMovements(): Promise<Movement[]> {
  const response = await fetch(`${apiUrl}/movements`);

  if (!response.ok) {
    throw new Error(`Movements request failed with status ${response.status}`);
  }

  return (await response.json()) as Movement[];
}

export async function createMovement(payload: MovementPayload): Promise<Movement> {
  const response = await fetch(`${apiUrl}/movements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | {
          detail?:
            | string
            | Array<{
                msg?: string;
              }>;
        }
      | null;

    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).filter(Boolean).join(" ")
      : data?.detail;

    throw new Error(detail ?? `Create movement failed with status ${response.status}`);
  }

  return (await response.json()) as Movement;
}

export async function updateMovement(
  movementId: number,
  payload: MovementUpdatePayload,
): Promise<Movement> {
  const response = await fetch(`${apiUrl}/movements/${movementId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | {
          detail?:
            | string
            | Array<{
                msg?: string;
              }>;
        }
      | null;

    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).filter(Boolean).join(" ")
      : data?.detail;

    throw new Error(detail ?? `Update movement failed with status ${response.status}`);
  }

  return (await response.json()) as Movement;
}

export async function deleteMovement(movementId: number): Promise<void> {
  const response = await fetch(`${apiUrl}/movements/${movementId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `Delete movement failed with status ${response.status}`);
  }
}

export async function uploadMovementSupport(
  movementId: number,
  file: File,
): Promise<Support> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/movements/${movementId}/support`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `Upload support failed with status ${response.status}`);
  }

  return (await response.json()) as Support;
}

export async function deleteMovementSupport(movementId: number): Promise<void> {
  const response = await fetch(`${apiUrl}/movements/${movementId}/support`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `Delete support failed with status ${response.status}`);
  }
}

export async function fetchMovementStats(): Promise<MovementStats> {
  const response = await fetch(`${apiUrl}/movements/stats`);

  if (!response.ok) {
    throw new Error(`Stats request failed with status ${response.status}`);
  }

  return (await response.json()) as MovementStats;
}
