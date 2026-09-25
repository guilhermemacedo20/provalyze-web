export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.message) return parsed.message;
    } catch {
    }
    return error.message;
  }
  return "Não foi possível concluir a ação.";
}