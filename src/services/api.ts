const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      // TO-DO: Alterar para autenticação real quando o login estiver implementado
      "x-user-email": process.env.TEACHER_EMAIL ?? "professor@escola.com",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}
