import type {
  AuthPayload,
  AuthResponse,
  HealthResponse,
  Movement,
  MovementPayload,
  MovementReviewPayload,
  MovementStats,
  MovementUpdatePayload,
  ReviewSummary,
  Support,
  User,
} from "../types";

const apiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL ?? "http://localhost:8000");
const AUTH_TOKEN_KEY = "cuentas-claras-auth-token";

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

export async function registerUser(payload: AuthPayload): Promise<AuthResponse> {
  return await postAuthPayload("/auth/register", payload);
}

export async function loginUser(payload: AuthPayload): Promise<AuthResponse> {
  return await postAuthPayload("/auth/login", payload);
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiFetch("/auth/me");

  if (!response.ok) {
    throw await buildRequestError(response, "Fetch current user failed");
  }

  return (await response.json()) as User;
}

export async function fetchMovements(): Promise<Movement[]> {
  const response = await apiFetch("/movements");

  if (!response.ok) {
    throw await buildRequestError(response, "Movements request failed");
  }

  return (await response.json()) as Movement[];
}

export async function createMovement(payload: MovementPayload): Promise<Movement> {
  const response = await apiFetch("/movements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Create movement failed");
  }

  return (await response.json()) as Movement;
}

export async function updateMovement(
  movementId: number,
  payload: MovementUpdatePayload,
): Promise<Movement> {
  const response = await apiFetch(`/movements/${movementId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Update movement failed");
  }

  return (await response.json()) as Movement;
}

export async function deleteMovement(movementId: number): Promise<void> {
  const response = await apiFetch(`/movements/${movementId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Delete movement failed");
  }
}

export async function updateMovementReview(
  movementId: number,
  payload: MovementReviewPayload,
): Promise<Movement> {
  const response = await apiFetch(`/movements/${movementId}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Update review failed");
  }

  return (await response.json()) as Movement;
}

export async function uploadMovementSupport(
  movementId: number,
  file: File,
): Promise<Support> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(`/movements/${movementId}/support`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Upload support failed");
  }

  return (await response.json()) as Support;
}

export async function deleteMovementSupport(movementId: number): Promise<void> {
  const response = await apiFetch(`/movements/${movementId}/support`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Delete support failed");
  }
}

export async function fetchMovementSupportFile(
  movementId: number,
  mode: "view" | "download" = "view",
): Promise<SupportFileResponse> {
  const path =
    mode === "download"
      ? `/movements/${movementId}/support/download`
      : `/movements/${movementId}/support/file`;

  const response = await apiFetch(path);

  if (!response.ok) {
    throw await buildRequestError(response, "Support file request failed");
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
  const response = await apiFetch("/movements/stats");

  if (!response.ok) {
    throw await buildRequestError(response, "Stats request failed");
  }

  return (await response.json()) as MovementStats;
}

export async function fetchReviewSummary(): Promise<ReviewSummary> {
  const response = await apiFetch("/review/summary");

  if (!response.ok) {
    throw await buildRequestError(response, "Review summary request failed");
  }

  return (await response.json()) as ReviewSummary;
}

export function getStoredAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
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
    return normalized
  }

  return `https://${normalized}`;
}

async function postAuthPayload(path: string, payload: AuthPayload): Promise<AuthResponse> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildRequestError(response, "Authentication request failed");
  }

  return (await response.json()) as AuthResponse;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getStoredAuthToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  });
}

async function buildRequestError(
  response: Response,
  fallbackMessage: string,
): Promise<Error> {
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

  return new Error(detail ?? `${fallbackMessage} with status ${response.status}`);
}
