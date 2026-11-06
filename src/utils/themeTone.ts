export function themeTone(percent: number) {
  if (percent >= 70) {
    return { bar: "bg-success", text: "text-success" };
  }
  if (percent >= 50) {
    return { bar: "bg-warning", text: "text-warning" };
  }
  return { bar: "bg-danger", text: "text-danger" };
}
