export function getPasswordChecks(password: string) {
  return [
    { label: "Mínimo de 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { label: "Um número", met: /[0-9]/.test(password) },
  ];
}

export function isPasswordStrong(password: string) {
  return getPasswordChecks(password).every((check) => check.met);
}
