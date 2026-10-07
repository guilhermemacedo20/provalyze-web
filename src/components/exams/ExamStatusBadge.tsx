import { Badge } from "@/components/ui/Badge";
import type { ExamStatus, StudentExamStatus } from "@/services/exams.service";

const EXAM_STATUS: Record<
  ExamStatus,
  { label: string; tone: "success" | "neutral" }
> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  PUBLISHED: { label: "Publicada", tone: "success" },
  ENDED: { label: "Encerrada", tone: "neutral" },
};

const STUDENT_STATUS: Record<
  StudentExamStatus,
  { label: string; tone: "success" | "purple" | "warning" | "neutral" }
> = {
  NOT_STARTED: { label: "Não iniciada", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "warning" },
  FINISHED: { label: "Concluída", tone: "success" },
  GRADED: { label: "Corrigida", tone: "purple" },
  EXPIRED: { label: "Expirada", tone: "neutral" },
};

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const { label, tone } = EXAM_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function StudentStatusBadge({ status }: { status: StudentExamStatus }) {
  const { label, tone } = STUDENT_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}