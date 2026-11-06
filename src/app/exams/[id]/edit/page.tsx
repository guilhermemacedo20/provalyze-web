"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ExamWizard } from "@/components/exams/ExamWizard";

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return null;
  return <ExamWizard examId={id} />;
}