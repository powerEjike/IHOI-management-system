export class ClientApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export async function postJson<T>(
  url: string,
  body: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok)
    throw new ClientApiError(
      value.message ||
        "Unable to complete this request. Your entries are still here.",
      value.code,
      value.details,
    );
  return value as T;
}
