"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ExamCorrectionView } from "@/components/exams/ExamCorrectionView";

export default function ExamCorrectionPage() {
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const { user } = useAuth();

  if (!user || user.role !== "TEACHER") return null;

  return <ExamCorrectionView examId={id} studentId={studentId} />;
}