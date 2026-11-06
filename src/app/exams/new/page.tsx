"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { ExamWizard } from "@/components/exams/ExamWizard";

export default function NewExamPage() {
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return null; 
  return <ExamWizard />;
}