"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SchoolClass, classesService } from "@/services/classes.service";
import { examsService } from "@/services/exams.service";
import type { Theme } from "@/services/themes.service";
import {
  completeDuration,
  durationToMinutes,
  formatPeriod,
  formatPoints,
  fromLocalInput,
  maskDuration,
  minutesToDuration,
  pluralize,
  toLocalInput,
} from "@/lib/exam-format";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { QuestionPicker } from "./QuestionPicker";
import { WizardSteps } from "./WizardSteps";
import {
  SelectedQuestion,
  sumPoints,
  typeLabel,
} from "./exam-wizard-types";

type Step = 1 | 2 | 3 | 4;

const inputClass =
  "rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted";
const cardClass =
  "rounded-[22px] border border-border bg-surface px-7 py-6 shadow-[0px_1px_3px_0px_rgba(13,20,38,0.06)]";
const primaryBtn =
  "cursor-pointer rounded-md bg-primary px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
const linkBtn =
  "cursor-pointer text-sm font-medium text-muted hover:text-foreground";

export function ExamWizard({ examId }: { examId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(examId);

  const [step, setStep] = useState<Step>(1);

  // passo 1
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(""); 
  const [endsAt, setEndsAt] = useState("");
  const [duration, setDuration] = useState(""); 

  // passo 2
  const [questions, setQuestions] = useState<SelectedQuestion[]>([]);
  const [openTheme, setOpenTheme] = useState<Theme | null>(null);

  // passo 3
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [loadingExam, setLoadingExam] = useState(isEdit);
  const [notEditable, setNotEditable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);

  useEffect(() => {
    classesService
      .listClasses()
      .then(setClasses)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setClassesLoading(false));
  }, []);

  useEffect(() => {
    if (!examId) return;

    examsService
      .getExam(examId)
      .then((exam) => {
        if (exam.status !== "DRAFT") {
          setNotEditable(true);
          return;
        }
        setTitle(exam.title);
        setStartsAt(toLocalInput(exam.startsAt));
        setEndsAt(toLocalInput(exam.endsAt));
        setDuration(minutesToDuration(exam.durationMinutes));
        setQuestions(
          exam.questions.map((q) => ({
            questionId: q.questionId,
            points: q.points,
            statement: q.statement,
            themeId: q.themeId,
            themeName: q.themeName,
            type: q.type,
          })),
        );
        setClassIds(exam.classes.map((c) => c.id));
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoadingExam(false));
  }, [examId]);

  const durationMinutes = durationToMinutes(duration);

  const validateInfo = (): string | null => {
    if (!title.trim()) return "Informe o nome da prova.";
    if (!startsAt || !endsAt) {
      return "Informe a data e hora inicial e final.";
    }
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    if (end <= start) return "A data final deve ser posterior à data inicial.";
    if (durationMinutes === null) {
      return "Informe o tempo de prova no formato HH:MM (ex.: 01:30).";
    }
    if (durationMinutes > (end - start) / 60000) {
      return "O tempo de prova não pode ser maior que o período de aplicação.";
    }
    return null;
  };

  const goNext = () => {
    let problem: string | null = null;
    if (step === 1) problem = validateInfo();
    if (step === 2 && questions.length === 0) {
      problem = "Adicione ao menos uma questão à prova.";
    }
    if (step === 3 && classIds.length === 0) {
      problem = "Selecione ao menos uma turma.";
    }

    setError(problem);
    if (!problem) setStep((step + 1) as Step);
  };

  const goBack = () => {
    setError(null);
    setStep((step - 1) as Step);
  };

  const save = async (publish: boolean) => {
    const problem = validateInfo();
    if (problem) {
      setError(problem);
      setStep(1);
      return;
    }
    if (publish && new Date(endsAt).getTime() <= Date.now()) {
      setError(
        "A data final da prova já passou. Volte à etapa 1 e ajuste o período.",
      );
      return;
    }

    setError(null);
    setSaving(publish ? "publish" : "draft");

    const payload = {
      title: title.trim(),
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      durationMinutes: durationMinutes as number,
      questions: questions.map((q) => ({
        questionId: q.questionId,
        points: q.points,
      })),
      classIds,
      publish,
    };

    try {
      const saved = examId
        ? await examsService.updateExam(examId, payload)
        : await examsService.createExam(payload);
      router.push(`/exams/${saved.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
      setSaving(null);
    }
  };

  const toggleClass = (id: string) =>
    setClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  if (loadingExam) {
    return (
      <div className="px-10 py-9">
        <p className="text-[13px] text-muted">Carregando prova...</p>
      </div>
    );
  }

  if (notEditable) {
    return (
      <div className="px-10 py-9">
        <p className="text-[14px] text-foreground">
          Só é possível editar provas que ainda estão em rascunho.
        </p>
        <Link
          href="/exams"
          className="mt-3 inline-block text-[13px] font-medium text-primary hover:underline"
        >
          Voltar para Provas
        </Link>
      </div>
    );
  }

  const selectedClasses = classes.filter((c) => classIds.includes(c.id));
  const inPickerSubView = step === 2 && openTheme !== null;

  return (
    <div className="px-10 py-9">
      <p className="mb-2 text-xs text-muted">
        <Link href="/exams" className="hover:underline">
          Provas
        </Link>{" "}
        / {isEdit ? "Editar prova" : "Nova prova"}
      </p>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {isEdit ? "Editar Prova" : "Nova Prova"}
      </h1>

      <WizardSteps current={step} />

      {/*Informações*/}
      {step === 1 && (
        <div className={`${cardClass} flex flex-col gap-5`}>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="exam-title"
              className="text-[13px] font-medium text-foreground"
            >
              Nome da prova
            </label>
            <input
              id="exam-title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova Bimestral"
              className={inputClass}
            />
          </div>

          <div className="flex gap-5">
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="exam-starts"
                className="text-[13px] font-medium text-foreground"
              >
                Data/hora inicial
              </label>
              <input
                id="exam-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="exam-ends"
                className="text-[13px] font-medium text-foreground"
              >
                Data/hora final
              </label>
              <input
                id="exam-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="exam-duration"
              className="text-[13px] font-medium text-foreground"
            >
              Tempo de prova
            </label>
            <input
              id="exam-duration"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(maskDuration(e.target.value))}
              onBlur={() => setDuration((v) => completeDuration(v))}
              placeholder="HH:MM (ex.: 01:30)"
              className={inputClass}
            />
            <p className="text-[12px] text-muted">
              Quanto tempo cada aluno tem para responder. Não pode passar do
              período entre a data inicial e a final.
            </p>
          </div>
        </div>
      )}

      {/*Questões*/}
      {step === 2 && (
        <QuestionPicker
          selected={questions}
          onChange={setQuestions}
          openTheme={openTheme}
          onOpenTheme={setOpenTheme}
        />
      )}

      {/*Destinatários*/}
      {step === 3 && (
        <div className={cardClass}>
          <h2 className="mb-4 text-[14px] font-semibold text-foreground">
            Selecionar turma
          </h2>

          {classesLoading && (
            <p className="text-[13px] text-muted">Carregando turmas...</p>
          )}
          {!classesLoading && classes.length === 0 && (
            <p className="text-[13px] text-muted">
              Você ainda não tem turmas.{" "}
              <Link href="/classes/new" className="font-medium text-primary">
                Crie uma turma
              </Link>{" "}
              para aplicar a prova.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {classes.map((schoolClass) => (
              <label
                key={schoolClass.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                  classIds.includes(schoolClass.id)
                    ? "border-primary bg-primary-light/40"
                    : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={classIds.includes(schoolClass.id)}
                  onChange={() => toggleClass(schoolClass.id)}
                  className="size-4 accent-primary"
                />
                <span className="flex-1 text-[14px] font-medium text-foreground">
                  {schoolClass.name}
                  <span className="ml-2 text-[12px] font-normal text-muted">
                    {schoolClass.subjectName} · {schoolClass.courseName}
                  </span>
                </span>
                <span className="text-[13px] text-muted">
                  {pluralize(schoolClass.studentsCount, "aluno", "alunos")}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/*Revisão*/}
      {step === 4 && (
        <div className={cardClass}>
          <h2 className="mb-5 text-[18px] font-semibold text-foreground">
            {title.trim()}
          </h2>

          <div className="mb-6 grid grid-cols-3 gap-x-6 gap-y-4">
            <Summary label="Questões" value={String(questions.length)} />
            <Summary
              label="Pontuação total"
              value={formatPoints(sumPoints(questions))}
            />
            <Summary
              label="Período"
              value={formatPeriod(
                fromLocalInput(startsAt),
                fromLocalInput(endsAt),
              )}
            />
            <Summary
              label="Turmas"
              value={
                selectedClasses
                  .map(
                    (c) =>
                      `${c.name} (${pluralize(c.studentsCount, "aluno", "alunos")})`,
                  )
                  .join(", ") || "—"
              }
            />
            <Summary
              label="Tempo de prova"
              value={`${duration} (${durationMinutes} min)`}
            />
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">
              Questões incluídas
            </h3>
            <ol className="flex flex-col gap-2.5 text-[13px] text-muted">
              {questions.map((q, index) => (
                <li key={q.questionId}>
                  {index + 1}. {q.statement} — {q.themeName} ·{" "}
                  {typeLabel(q.type)} · {formatPoints(q.points)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-[13px] text-danger">{error}</p>}

      {!inPickerSubView && (
        <div className="mt-6 flex items-center justify-between">
          {step === 1 ? (
            <Link href="/exams" className={linkBtn}>
              Cancelar
            </Link>
          ) : (
            <button type="button" onClick={goBack} className={linkBtn}>
              ← Voltar: {step === 2 ? "Informações" : step === 3 ? "Questões" : "Destinatários"}
            </button>
          )}

          {step < 4 ? (
            <button type="button" onClick={goNext} className={primaryBtn}>
              Próximo:{" "}
              {step === 1 ? "Questões" : step === 2 ? "Destinatários" : "Revisão"}{" "}
              →
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => save(false)}
                disabled={saving !== null}
                className="cursor-pointer rounded-md border border-border bg-surface px-[18px] py-2.5 text-[13px] font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving === "draft" ? "Salvando..." : "Salvar rascunho"}
              </button>
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving !== null}
                className={primaryBtn}
              >
                {saving === "publish" ? "Publicando..." : "Publicar prova ✓"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-muted">{label}</p>
      <p className="text-[14px] font-semibold text-foreground">{value}</p>
    </div>
  );
}