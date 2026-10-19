import Link from "next/link";
import { StudentExam, ExamListItem } from "@/services/exams.service";
import { formatDashDate } from "@/utils/formatFunctions";
import { ExamStatusBadge } from "../exams/ExamStatusBadge";

export function StudentExamCardView({ exam }: { exam: StudentExam }) {
  return (
    <article className="flex flex-col rounded-[22px] border border-border bg-surface p-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
      <h3 className="text-[15px] font-semibold text-foreground">
        {exam.title}
      </h3>
      <p className="mt-1 text-[13px] text-muted">{exam.subjectName}</p>
      <p className="mt-4 text-[13px] text-muted">
        {formatDashDate(exam.startsAt)}
        {exam.durationMinutes ? ` · ${exam.durationMinutes} min` : ""}
      </p>
      {exam.available ? (
        <Link
          href={`/my-exams/${exam.classId}/${exam.id}`}
          className="mt-4 w-fit rounded-full bg-success px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        >
          {exam.sessionStatus === "STARTED" ? "Continuar prova" : "Começar prova"}
        </Link>
      ) : (
        <span className="mt-4 w-fit rounded-full bg-success/40 px-4 py-2 text-[13px] font-semibold text-white">
          {exam.message}
        </span>
      )}
    </article>
  );
}

export function TeacherExamRow({ exam }: { exam: ExamListItem }) {
  const classes = exam.classes
    .map((schoolClass) => schoolClass.name)
    .join(", ");

  return (
    <li className="flex flex-col gap-3 border-b border-border py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link
          href={`/exams/${exam.id}`}
          className="text-[15px] font-semibold text-foreground hover:text-primary"
        >
          {exam.title}
        </Link>
        {classes ? (
          <p className="mt-0.5 text-[13px] text-muted">{classes}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-6 text-[13px] text-muted">
        <span>{formatDashDate(exam.startsAt)}</span>
        <ExamStatusBadge status={exam.status} />
      </div>
    </li>
  );
}

export function AdminCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="flex flex-col gap-2 rounded-[22px] border border-border bg-surface px-5 py-5 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-[32px] font-bold leading-none text-foreground">
        {value}
      </p>
    </article>
  );
}
