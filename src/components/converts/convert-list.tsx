"use client";
import { useHydrated } from "@/lib/use-hydrated";
import Link from "next/link";
import { useState } from "react";
import { postJson } from "@/lib/client-api";
import type { ConvertList as Page } from "@/lib/converts/model";
export type ListFilters = {
  q: string;
  stage: string;
  lead: string;
  archived: boolean;
  recent: boolean;
};
export function ConvertList({
  initial,
  initialFilters,
}: {
  initial: Page;
  initialFilters: ListFilters;
}) {
  const hydrated = useHydrated();
  const [page, setPage] = useState(initial),
    [filters, setFilters] = useState(initialFilters),
    [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load(
    nextFilters: ListFilters,
    nextCursors: (string | null)[],
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setPage(
        await postJson("/api/converts/search", {
          ...nextFilters,
          after: nextCursors.at(-1),
        }),
      );
      setFilters(nextFilters);
      setCursors(nextCursors);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load converts.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-panel">
      <form
        method="post"
        className="record-filters"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void load(
            {
              q: String(form.get("q") || ""),
              stage: String(form.get("stage")),
              lead: String(form.get("lead")),
              archived: form.get("archived") === "on",
              recent: form.get("recent") === "on",
            },
            [null],
          );
        }}
      >
        <label className="filter-search">
          Search
          <input
            disabled={busy || !hydrated}
            name="q"
            defaultValue={initialFilters.q}
            maxLength={80}
            placeholder="Name, email, or phone starts with…"
          />
        </label>
        <label>
          Stage
          <select
            disabled={busy || !hydrated}
            name="stage"
            defaultValue={initialFilters.stage}
          >
            <option value="all">All stages</option>
            <option value="convert">Convert</option>
            <option value="disciple">Disciple</option>
            <option value="worker">Worker</option>
          </select>
        </label>
        <label>
          Follow-up lead
          <select
            disabled={busy || !hydrated}
            name="lead"
            defaultValue={initialFilters.lead}
          >
            <option value="all">All leads</option>
            <option value="unassigned">Unassigned</option>
            <option value="super_admin">Super Admin</option>
            <option value="president">President</option>
            <option value="coo">COO</option>
          </select>
        </label>
        <label className="check-label">
          <input
            disabled={busy || !hydrated}
            type="checkbox"
            name="archived"
            defaultChecked={initialFilters.archived}
          />{" "}
          Archived records
        </label>
        <label className="check-label">
          <input
            disabled={busy || !hydrated}
            type="checkbox"
            name="recent"
            defaultChecked={initialFilters.recent}
          />{" "}
          Registered this month
        </label>
        <button className="button" disabled={busy || !hydrated}>
          {busy ? "Loading…" : "Apply filters"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      <p className="list-context" role="status">
        {page.records.length} {filters.archived ? "archived" : "active"} record
        {page.records.length === 1 ? "" : "s"} on this page
        {filters.q ? " · Search applied" : ""}
      </p>
      {page.records.length ? (
        <div
          className="table-scroll"
          role="region"
          aria-label="Converts register"
          tabIndex={0}
        >
          <table className="records-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Contact</th>
                <th scope="col">Stage</th>
                <th scope="col">Follow-up lead</th>
                <th scope="col">Registered</th>
                <th scope="col">Contact permission</th>
              </tr>
            </thead>
            <tbody>
              {page.records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <Link
                      className="record-name"
                      href={`/portal/converts/${record.id}`}
                    >
                      {record.fullName}
                    </Link>
                    <small>{record.location || "Location not recorded"}</small>
                  </td>
                  <td>
                    {record.phone || "No phone"}
                    <small>{record.email || "No email"}</small>
                  </td>
                  <td>
                    <span className="record-badge">{record.stage}</span>
                  </td>
                  <td>
                    {record.assignedLeaderRole === "super_admin"
                      ? "Super Admin"
                      : record.assignedLeaderRole === "president"
                        ? "President"
                        : record.assignedLeaderRole === "coo"
                          ? "COO"
                          : "Unassigned"}
                  </td>
                  <td>{record.registeredDate}</td>
                  <td>
                    <span className={`permission-${record.contactPermission}`}>
                      {record.contactPermission}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="register-empty">
          <h2>No matching records yet</h2>
          <p>Try another filter, or manually register the first convert.</p>
          <Link href="/portal/converts/new" className="text-link">
            Register a convert ↗
          </Link>
        </div>
      )}
      <div className="pagination">
        <button
          className="button button-outline"
          type="button"
          disabled={busy || cursors.length === 1}
          onClick={() => void load(filters, cursors.slice(0, -1))}
        >
          Previous
        </button>
        <span>Page {cursors.length}</span>
        <button
          className="button button-outline"
          type="button"
          disabled={busy || !page.nextCursor}
          onClick={() => void load(filters, [...cursors, page.nextCursor])}
        >
          Next
        </button>
      </div>
    </section>
  );
}
