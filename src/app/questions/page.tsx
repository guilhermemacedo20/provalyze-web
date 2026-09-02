"use client";
import Link from "next/link";
import { Question, questionsService } from "@/services/questions.service";
import { useEffect, useState } from "react";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  const fetchQuestions = async () => {
    try {
      setQuestions(await questionsService.listQuestions());
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const deleteQuestion = async (questionId?: string) => {
    if (!questionId) {
      return;
    }
    try {
      await questionsService.deleteQuestion(questionId);
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <>
      <h1>Questões</h1>
      <Link className="rounded border px-4 py-2 m-4" href="/questions/create">
        Nova questão
      </Link>
      <div>
        {questions.map((question) => (
          <div key={question.id}>
            <p>{question.statement}</p>
            <p>Tema: {question.theme}</p>
            <Link
              className="rounded border px-4 py-2"
              href={`/questions/${question.id}/edit`}
            >
              Editar
            </Link>
            <button
              className="rounded border px-4 py-2 m-4"
              onClick={() => deleteQuestion(question.id)}
            >
              Apagar
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
