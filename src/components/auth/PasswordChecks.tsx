import { Check, XIcon } from "lucide-react";
import { getPasswordChecks } from "@/lib/password-validate";

export function PasswordChecks({ password }: { password: string }) {
  const checks = getPasswordChecks(password);

  return (
    <ul className="flex flex-col gap-1">
      {checks.map((check) => (
        <li key={check.label} className="flex items-center gap-1.5 text-[12px]">
          {check.met ? (
            <Check size={14} className="text-success" />
          ) : (
            <XIcon size={14} className="text-muted" />
          )}
          <span className={check.met ? "text-success" : "text-muted"}>
            {check.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
