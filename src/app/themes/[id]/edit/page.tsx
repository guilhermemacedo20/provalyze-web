"use client";

import { useParams } from "next/navigation";
import { ThemeForm } from "@/components/themes/ThemeForm";

export default function EditThemePage() {
  const { id } = useParams<{ id: string }>();
  return <ThemeForm themeId={id} />;
}
