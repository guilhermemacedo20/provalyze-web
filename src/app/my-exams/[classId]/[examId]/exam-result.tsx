import Link from "next/link";
import { ExamReviewQuestion } from "@/services/exams.service";
import { formatPoints } from "@/lib/exam-format";

function usedTime(startedAt?: string | null, finishedAt?: string | null) {
  if (!startedAt || !finishedAt) return "Pendente";
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000,
    ),
  );
  return `${minutes} min`;
}

function themeStats(review: ExamReviewQuestion[]) {
  const groups = new Map<string, { correct: number; total: number }>();

  for (const question of review) {
    if (question.gradeStatus === "PENDING") continue;
    const name = question.themeName || "Sem tema";
    const current = groups.get(name) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (question.isCorrect) current.correct += 1;
    groups.set(name, current);
  }

  return [...groups.entries()].map(([name, stat]) => ({
    name,
    percent: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));
}

function reviewStatus(question: ExamReviewQuestion) {
  if (question.type === "MULTIPLE_CHOICE") {
    return { label: "Correção automática", className: "text-muted" };
  }
  if (question.gradeStatus === "PENDING") {
    return {
      label: "Aguardando correção do professor",
      className: "text-[#8a5a00]",
    };
  }
  return { label: "Corrigida pelo professor", className: "text-[#16A34A]" };
}

export function ExamResult({
  title,
  subjectName,
  score,
  startedAt,
  finishedAt,
  review,
  backHref,
}: {
  title: string;
  subjectName: string;
  score: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  review: ExamReviewQuestion[];
  backHref: string;
}) {
  const correct = review.filter((question) => question.isCorrect).length;
  const themes = themeStats(review);
  const details = review.filter((question) => question.statement);

  const sentAt = finishedAt
    ? new Date(finishedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="px-10 py-9">
      <div className="mb-6 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-6 py-5">
        <h1 className="text-lg font-semibold text-foreground">
          Prova finalizada!
        </h1>
        <p className="mt-1 text-sm text-muted">
          {title}
          {subjectName ? `, ${subjectName}` : ""}
          {sentAt ? ` · Enviada às ${sentAt}` : ""}
        </p>
      </div>

      <div className="mb-6 grid max-w-3xl grid-cols-3 gap-4">
        <article className="rounded-2xl border border-[#E2E8F0] px-5 py-4">
          <p className="text-xs font-semibold tracking-wide text-muted">NOTA</p>
          <p className="mt-2 text-3xl font-semibold">
            {score == null
              ? "Pendente"
              : score.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          </p>
          {review.length > 0 &&
            review.some(
              (question) =>
                question.type === "OPEN_ENDED" &&
                question.gradeStatus === "PENDING",
            ) && (
              <p className="mt-1 text-xs text-muted">
                Questões dissertativas ainda estão sendo corrigidas.
              </p>
            )}
        </article>
        <article className="rounded-2xl border border-[#E2E8F0] px-5 py-4">
          <p className="text-xs font-semibold tracking-wide text-muted">
            ACERTOS
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {review.length > 0 ? `${correct} de ${review.length}` : "Pendente"}
          </p>
          {review.length > 0 &&
            review.some(
              (question) =>
                question.type === "OPEN_ENDED" &&
                question.gradeStatus === "PENDING",
            ) && (
              <p className="mt-1 text-xs text-muted">
                Questões dissertativas ainda estão sendo corrigidas.
              </p>
            )}
        </article>
        <article className="rounded-2xl border border-[#E2E8F0] px-5 py-4">
          <p className="text-xs font-semibold tracking-wide text-muted">
            TEMPO UTILIZADO
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {usedTime(startedAt, finishedAt)}
          </p>
        </article>
      </div>

      {themes.length > 0 && (
        <section className="mb-6 max-w-3xl rounded-2xl border border-[#E2E8F0] px-6 py-5">
          <h2 className="mb-4 font-semibold">Seu desempenho por tema</h2>
          <div className="flex flex-col gap-4">
            {themes.map((theme) => (
              <div key={theme.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{theme.name}</span>
                  <span className="text-muted">{theme.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                  <div
                    className={`h-full rounded-full ${
                      theme.percent >= 80 ? "bg-[#16A34A]" : "bg-[#F59E0B]"
                    }`}
                    style={{ width: `${theme.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {details.length > 0 && (
        <section className="mb-6 max-w-3xl rounded-2xl border border-[#E2E8F0] px-6 py-5">
          <h2 className="mb-4 font-semibold">Correção das questões</h2>
          <ul className="flex flex-col">
            {details.map((question) => {
              const status = reviewStatus(question);
              const pending =
                question.type === "OPEN_ENDED" &&
                question.gradeStatus === "PENDING";

              return (
                <li
                  key={question.examQuestionId}
                  className="border-t border-[#E2E8F0] py-4 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {question.number}. {question.statement}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-foreground">
                      {pending
                        ? "-"
                        : `${formatPoints(question.score)}${
                            question.maxScore !== undefined
                              ? ` / ${formatPoints(question.maxScore)}`
                              : ""
                          }`}
                    </p>
                  </div>
                  <p className={`mt-1 text-xs ${status.className}`}>
                    {question.themeName} · {status.label}
                  </p>

                  <div className="mt-3 rounded-xl border border-[#E2E8F0] px-4 py-3">
                    <p className="text-xs font-semibold tracking-wide text-muted">
                      SUA RESPOSTA
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                      {question.studentAnswer || (
                        <span className="italic text-muted">
                          Não respondida.
                        </span>
                      )}
                    </p>
                  </div>

                  {question.teacherFeedback && (
                    <div className="mt-3 rounded-xl bg-[#F8FAFC] px-4 py-3">
                      <p className="text-xs font-semibold tracking-wide text-muted">
                        FEEDBACK DO PROFESSOR
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                        {question.teacherFeedback}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex max-w-3xl justify-end">
        <Link
          href={backHref}
          className="rounded-full bg-[#16A34A] px-4 py-2 text-sm text-white"
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}