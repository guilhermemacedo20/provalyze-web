"use client";

import { useParams } from "next/navigation";

export default function AddStudentPage() {
  const { classId } = useParams<{ classId: string }>();
  console.log(classId);

  return (
    <div className="px-10 py-9">
      <p>Provas</p>
    </div>
  );
}
