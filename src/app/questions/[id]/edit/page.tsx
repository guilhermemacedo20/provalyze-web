"use client";

import { useParams } from "next/navigation";
import { QuestionForm } from "@/components/questions/QuestionForm";

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  return <QuestionForm questionId={id} />;
}
