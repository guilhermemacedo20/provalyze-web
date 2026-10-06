import { Check } from "lucide-react";

export const WIZARD_STEPS = [
  "Informações",
  "Questões",
  "Destinatários",
  "Revisão",
] as const;

export function WizardSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mb-6 flex items-center" aria-label="Etapas da prova">
      {WIZARD_STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;

        return (
          <li key={label} className="flex items-center">
            {index > 0 && (
              <span
                className={`h-0.5 w-6 ${number <= current ? "bg-primary" : "bg-border"}`}
              />
            )}
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${
                active
                  ? "border-primary bg-primary text-white"
                  : done
                    ? "border-[#def2e6] bg-[#def2e6] text-success"
                    : "border-border bg-surface text-muted"
              }`}
            >
              <span
                className={`flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold ${
                  active
                    ? "bg-white text-primary"
                    : done
                      ? "bg-primary text-white"
                      : "bg-border text-muted"
                }`}
              >
                {done ? <Check size={11} strokeWidth={3} /> : number}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}