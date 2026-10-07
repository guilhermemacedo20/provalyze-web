"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { ExamListTeacher } from "@/components/exams/ExamListTeacher";
import { StudentExamsPlaceholder } from "@/components/exams/StudentExamsPlaceholder";

export default function ExamsPage() {
  const { user } = useAuth();

  if (!user) return null; 

  if (user.role === "TEACHER") return <ExamListTeacher />;
  return <StudentExamsPlaceholder />;
}