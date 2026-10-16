export function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green";
}) {
  const color = tone === "blue" ? "bg-primary" : "bg-success";

  return (
    <article className={`rounded-[22px] px-6 py-5 text-white ${color}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
        {label}
      </p>
      <p className="mt-3 text-[32px] font-bold leading-none">{value}</p>
    </article>
  );
}
