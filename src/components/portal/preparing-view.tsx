"use client";
import { useRouter } from "next/navigation";
export function PreparingView() {
  const router = useRouter();
  return (
    <section className="workspace-panel">
      <h2>Preparing this data view</h2>
      <p>
        Firestore is building the indexes for this new module. Your records are
        safe. Retry shortly to load the live figures.
      </p>
      <button
        className="button"
        type="button"
        style={{ marginTop: 20 }}
        onClick={() => router.refresh()}
      >
        Refresh view
      </button>
    </section>
  );
}
