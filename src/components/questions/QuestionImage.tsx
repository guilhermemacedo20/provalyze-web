"use client";

import { useEffect, useState } from "react";
import { questionsService } from "@/services/questions.service";

type QuestionImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

export function QuestionImage({
  src,
  alt = "",
  className,
}: QuestionImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) {
      return;
    }

    let cancelled = false;
    setFailed(false);
    setDataUrl(null);

    questionsService
      .getImage(src)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setDataUrl(result.image);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) {
    return <></>;
  }

  if (failed) {
    return (
      <p className="text-[13px] text-danger">
        Não foi possível carregar a imagem.
      </p>
    );
  }

  if (!dataUrl) {
    return (
      <div
        role="status"
        aria-label="Carregando imagem"
        className="h-32 w-full max-w-md animate-pulse rounded-xl bg-background"
      />
    );
  }

  return <img src={dataUrl} alt={alt} className={className} />;
}
