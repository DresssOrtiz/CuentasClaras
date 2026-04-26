import type {
  HealthResponse,
  Movement,
  MovementPayload,
  MovementReviewPayload,
  MovementStats,
  ReviewSummary,
  Support,
  MovementUpdatePayload,
} from "../types";

const apiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL ?? "http://localhost:8000");

export type SupportFileResponse = {
  blob: Blob;
  contentType: string;
  filename: string;
};

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

export async function updateMovementReview(
  movementId: number,
  payload: MovementReviewPayload,
): Promise<Movement> {
  const response = await fetch(`${apiUrl}/movements/${movementId}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `Update review failed with status ${response.status}`);
  }

  return (await response.json()) as Movement;
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

export async function fetchMovementSupportFile(
  movementId: number,
  mode: "view" | "download" = "view",
): Promise<SupportFileResponse> {
  const endpoint =
    mode === "download"
      ? `${apiUrl}/movements/${movementId}/support/download`
      : `${apiUrl}/movements/${movementId}/support/file`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `Support file request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const filename = extractFilename(contentDisposition) ?? `support-${movementId}`;

  return {
    blob: await response.blob(),
    contentType,
    filename,
  };
}

export async function fetchMovementStats(): Promise<MovementStats> {
  const response = await fetch(`${apiUrl}/movements/stats`);

  if (!response.ok) {
    throw new Error(`Stats request failed with status ${response.status}`);
  }

  return (await response.json()) as MovementStats;
}

export async function fetchReviewSummary(): Promise<ReviewSummary> {
  const response = await fetch(`${apiUrl}/review/summary`);

  if (!response.ok) {
    throw new Error(`Review summary request failed with status ${response.status}`);
  }

  return (await response.json()) as ReviewSummary;
}

function extractFilename(contentDisposition: string): string | null {
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return null;
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, "");

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `https://${normalized}`;
}
