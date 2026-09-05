"use client";

import { useState } from "react";
import type { ReviewFact } from "./confirmation-api";

type Props = {
  fact: ReviewFact;
  editable: boolean;
  editLabel: string;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
  onSave: (factId: string, value: string) => Promise<boolean>;
};

export default function ConfirmationFact({
  fact,
  editable,
  editLabel,
  saveLabel,
  savingLabel,
  cancelLabel,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fact.value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (draft.trim().length === 0 || draft === fact.value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(fact.id, draft);
    setSaving(false);
    if (ok) setEditing(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#94a3b8]">
          {fact.field}
        </p>
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            maxLength={5000}
            className="mt-1 h-[40px] w-full rounded-[8px] border border-[#1768d5] bg-white px-3 text-[14px] outline-none disabled:opacity-60"
          />
        ) : (
          <p className="mt-1 text-[14px] font-medium text-[#253044]">{fact.value}</p>
        )}
      </div>
      {editable &&
        (editing ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(fact.value);
                setEditing(false);
              }}
              disabled={saving}
              className="text-[13px] font-medium text-[#64748b] hover:text-[#253044] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="text-[13px] font-semibold text-[#1768d5] hover:text-[#155fc3] disabled:opacity-50"
            >
              {saving ? savingLabel : saveLabel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(fact.value);
              setEditing(true);
            }}
            className="shrink-0 text-[13px] font-semibold text-[#1768d5] hover:text-[#155fc3]"
          >
            {editLabel}
          </button>
        ))}
    </div>
  );
}
