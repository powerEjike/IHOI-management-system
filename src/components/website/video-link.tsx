"use client";
import { useState } from "react";
export function SupportedVideo({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  let id = "";
  try {
    const u = new URL(url);
    if (
      ["www.youtube.com", "youtube.com", "m.youtube.com"].includes(u.hostname)
    )
      id =
        u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/)?.[1] ||
        "";
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  } catch {}
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return (
    <div className="video-panel">
      {open ? (
        <iframe
          title="Ministry video"
          src={"https://www.youtube-nocookie.com/embed/" + id}
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          <p>
            Play this message using YouTube. Loading the player connects to an
            external service.
          </p>
          <button className="button" onClick={() => setOpen(true)}>
            Load video player ▶
          </button>
        </>
      )}
    </div>
  );
}
