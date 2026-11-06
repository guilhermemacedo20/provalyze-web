"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { examDraftKey } from "@/lib/auth-role-storage";
import {
  ExamQuestion,
  ExamReviewQuestion,
  StudentExam,
  StudentExamDetail,
  examsService,
} from "@/services/exams.service";
import { ExamResult } from "./exam-result";
import { ExamRunner } from "./exam-runner";
import { ExamStart } from "./exam-start";

type Draft = Record<string, { optionId?: string; content?: string }>;

type StoredExam = {
  exam: StudentExamDetail;
  answers: Draft;
};

type ResultView = {
  title: string;
  subjectName: string;
  score: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  review: ExamReviewQuestion[];
};

function readStoredExam(userId: string, examId: string): StoredExam | null {
  const saved = localStorage.getItem(examDraftKey(userId, examId));
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as StoredExam;
    if (!parsed.exam?.questions || !parsed.exam.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function TakeExamPage() {
  const { classId, examId } = useParams<{ classId: string; examId: string }>();
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentExam | null>(null);
  const [exam, setExam] = useState<StudentExamDetail | null>(null);
  const [answers, setAnswers] = useState<Draft>({});
  const [result, setResult] = useState<ResultView | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    examsService
      .listClassExams(classId)
      .then((data) => {
        const current = data.exams.find((item) => item.id === examId) ?? null;
        setSummary(current);
        if (!current?.finished) return;
        return examsService.getStudentExam(classId, examId).then((detail) => {
          setResult({
            title: detail.title ?? current.title,
            subjectName: current.subjectName,
            score: detail.score ?? current.score,
            startedAt: detail.startedAt,
            finishedAt: detail.finishedAt,
            review: detail.review ?? [],
          });
        });
      })
      .catch((loadError) => {
        console.error("Erro ao buscar prova:", loadError);
        setError("Não foi possível carregar a prova.");
      })
      .finally(() => setLoading(false));
  }, [classId, examId]);

  useEffect(() => {
    if (!user || !exam?.sessionId || !exam.questions) return;
    const stored: StoredExam = { exam, answers };
    localStorage.setItem(examDraftKey(user.id, examId), JSON.stringify(stored));
  }, [answers, exam, examId, user]);

  const openExam = (data: StudentExamDetail, savedAnswers: Draft = {}) => {
    setExam(data);
    setAnswers(savedAnswers);
    if (user && data.sessionId && data.questions) {
      const stored: StoredExam = { exam: data, answers: savedAnswers };
      localStorage.setItem(
        examDraftKey(user.id, examId),
        JSON.stringify(stored),
      );
    }
  };

  const beginExam = async () => {
    if (!user) return;
    setStarting(true);
    setError(null);
    try {
      const stored =
        summary?.sessionStatus === "STARTED"
          ? readStoredExam(user.id, examId)
          : null;
      if (stored) {
        openExam(stored.exam, stored.answers);
        return;
      }

      const data = await examsService.getStudentExam(classId, examId);
      if (!data.available || !data.questions) {
        setExam(data);
        return;
      }
      openExam(data);
    } catch (startError) {
      console.error("Erro ao iniciar prova:", startError);
      setError("Não foi possível iniciar a prova.");
    } finally {
      setStarting(false);
    }
  };

  const updateAnswer = (question: ExamQuestion, value: Draft[string]) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  };

  const handleSubmit = async () => {
    if (!exam?.questions || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = exam.questions.map((question) => ({
        examQuestionId: question.id,
        optionId: answers[question.id]?.optionId,
        content: answers[question.id]?.content,
      }));
      const response = await examsService.submitStudentExam(
        classId,
        examId,
        payload,
      );
      localStorage.removeItem(examDraftKey(user.id, examId));
      setExam(null);
      setResult({
        title: exam.title ?? summary?.title ?? "Prova",
        subjectName: summary?.subjectName ?? "",
        score: response.score,
        startedAt: exam.startedAt,
        finishedAt: response.finishedAt,
        review: response.questions,
      });
    } catch (submitError) {
      console.error("Erro ao entregar prova:", submitError);
      setError("Não foi possível entregar a prova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-10 py-9">
        <p className="text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (result) {
    return (
      <ExamResult
        title={result.title}
        subjectName={result.subjectName}
        score={result.score}
        startedAt={result.startedAt}
        finishedAt={result.finishedAt}
        review={result.review}
        backHref={`/my-classes/${classId}`}
      />
    );
  }

  if (exam?.questions) {
    return (
      <ExamRunner
        title={exam.title ?? summary?.title ?? "Prova"}
        subjectName={summary?.subjectName ?? ""}
        questions={exam.questions}
        answers={answers}
        expiresAt={exam.expiresAt}
        classId={classId}
        examId={examId}
        submitting={submitting}
        error={error}
        onAnswer={updateAnswer}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <ExamStart
      title={summary?.title ?? exam?.title ?? "Prova"}
      courseName={summary?.courseName}
      subjectName={summary?.subjectName}
      durationMinutes={summary?.durationMinutes}
      available={Boolean(summary?.available)}
      continuing={summary?.sessionStatus === "STARTED"}
      starting={starting}
      message={
        exam?.message ?? summary?.message ?? error ?? "Prova indisponível."
      }
      error={error}
      backHref={`/my-classes/${classId}`}
      onStart={beginExam}
    />
  );
}