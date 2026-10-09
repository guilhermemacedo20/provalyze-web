export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
