"use client";
import { useState } from "react";
export function LibraryImage({ id, alt }: { id: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? null : (
    <img
      src={"/api/media/" + id}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="library-image"
    />
  );
}
