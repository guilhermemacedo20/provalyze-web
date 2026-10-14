export function maskDuration(raw: string): string {
  const colon = raw.indexOf(":");
  if (colon > 0 && colon <= 2) {
    const hours = raw.slice(0, colon).replace(/\D/g, "").slice(0, 2);
    const minutes = raw
      .slice(colon + 1)
      .replace(/\D/g, "")
      .slice(0, 2);
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// completa o valor
export function completeDuration(value: string): string {
  if (!value) return "";
  const [hours = "", minutes = ""] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padEnd(2, "0")}`;
}

export function durationToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59) return null;

  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

export function minutesToDuration(total: number | null): string {
  if (!total) return "";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// datas

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

export function formatPeriod(startsAtIso: string, endsAtIso: string): string {
  const s = new Date(startsAtIso);
  const e = new Date(endsAtIso);
  const day = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  const hour = (d: Date) => `${pad(d.getHours())}h${pad(d.getMinutes())}`;

  const sameDay = day(s) === day(e) && s.getFullYear() === e.getFullYear();
  return sameDay
    ? `${day(s)} ${hour(s)} : ${hour(e)}`
    : `${day(s)} ${hour(s)} : ${day(e)} ${hour(e)}`;
}

// textos 

export function formatPoints(value: number): string {
  const text = value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${text} ${value === 1 ? "pt" : "pts"}`;
}

export function formatScore(value: number | null): string {
  if (value === null) return "-";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function pluralize(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function formatFullPeriod(startsAtIso: string, endsAtIso: string) {
  const s = new Date(startsAtIso);
  const e = new Date(endsAtIso);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  if (!sameDay) {
    return `${formatDateTime(startsAtIso)} - ${formatDateTime(endsAtIso)}`;
  }
  const hour = (d: Date) => `${pad(d.getHours())}h${pad(d.getMinutes())}`;
  return `${formatDateTime(startsAtIso).split(" ")[0]} ${hour(s)}-${hour(e)}`;
}