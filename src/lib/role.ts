export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "COORDINATOR" ;

export function getCurrentRole(): Role {
  //TO-DO: Implementar autenticação por role
  const role = process.env.NEXT_PUBLIC_ROLE;
  if (
    role === "ADMIN" ||
    role === "TEACHER" ||
    role === "STUDENT" ||
    role === "COORDINATOR"
  ) {
    return role;
  }
  return "STUDENT";
}
