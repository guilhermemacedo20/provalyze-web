"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ExamDetailTeacher } from "@/components/exams/ExamDetailTeacher";
import { StudentExamsPlaceholder } from "@/components/exams/StudentExamsPlaceholder";

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "TEACHER") return <ExamDetailTeacher examId={id} />;
  return <StudentExamsPlaceholder />;
}