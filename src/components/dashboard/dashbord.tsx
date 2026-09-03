"use client";

import { useState } from "react";
import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type QueuePatient = {
  id: string;
  name: string;
};

type Patient = {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F" | "O";
  department: string;
  alert?: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastHistory: string;
  medications: string;
  investigations: string;
};

type Tab = "summary" | "timeline" | "documents" | "fullHistory";

type DoctorDashboardProps = {
  locale: Locale;
  queue: QueuePatient[];
  patient: Patient;
  onSelectPatient?: (id: string) => void;
  onEditSummary?: () => void;
  onConfirm?: () => void;
};

export default function DoctorDashboard({
  locale,
  queue,
  patient,
  onSelectPatient,
  onEditSummary,
  onConfirm,
}: DoctorDashboardProps) {
  const dictionary = getDictionary(locale);
  const { doctorDashboard: dict } = dictionary;

  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const fields = [
    { label: dict.fields.chiefComplaint, value: patient.chiefComplaint },
    { label: dict.fields.historyOfPresentIllness, value: patient.historyOfPresentIllness },
    { label: dict.fields.pastHistory, value: patient.pastHistory },
    { label: dict.fields.medications, value: patient.medications },
    { label: dict.fields.investigations, value: patient.investigations },
  ];

  return (
    <div
      className="min-h-screen bg-[#e9e9e9] p-6"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">

        {/* =========================================================
            TOP NAV
            ========================================================= */}
        <header className="flex items-center justify-between border-b border-[#e2e8f0] px-8 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-[#1768d5]">
              {dict.brand}
            </span>
            <span className="text-[13px] font-medium text-[#94a3b8]">
              {dict.subtitle}
            </span>
          </div>

          <div className="text-[13px] font-medium text-[#64748b]">
            {dict.doctorLabel} · {dict.settingsLabel}
          </div>
        </header>

        <div className="flex">

          {/* =========================================================
              QUEUE SIDEBAR
              ========================================================= */}
          <aside className="w-[240px] shrink-0 border-r border-[#e2e8f0] bg-[#fafbfc] px-5 py-6">
            <h2 className="mb-4 text-[13px] font-semibold text-[#172033]">
              {dict.queueTitle}
            </h2>

            <div className="flex flex-col gap-1">
              {queue.map((q) => {
                const isActive = q.id === patient.id;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelectPatient?.(q.id)}
                    className={`
                      flex
                      items-center
                      gap-2
                      rounded-[8px]
                      px-3
                      py-2.5
                      text-left
                      text-[13px]
                      font-medium
                      transition-colors
                      ${
                        isActive
                          ? "bg-[#eaf3ff] text-[#1768d5]"
                          : "text-[#334155] hover:bg-[#f1f5f9]"
                      }
                    `}
                  >
                    <span>{q.id}</span>
                    <span className="truncate">{q.name}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* =========================================================
              PATIENT PANEL
              ========================================================= */}
          <section className="flex-1 bg-[#f8fafc] px-8 py-6">

            {/* Patient header */}
            <div className="mb-5">
              <h1 className="text-[22px] font-semibold text-[#172033]">
                {dict.patientLabel.replace("{id}", patient.id)}
              </h1>
              <p className="mt-1 text-[13px] text-[#64748b]">
                {patient.name} · {patient.age}{patient.sex} · {patient.department}
              </p>
            </div>

            {/* Alert */}
            {patient.alert && (
              <div
                className="
                  mb-6
                  flex
                  items-center
                  justify-between
                  rounded-[12px]
                  border
                  border-[#fecaca]
                  bg-[#fef2f2]
                  px-5
                  py-3.5
                "
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#dc2626]">
                    {dict.alertLabel}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#b91c1c]">
                    {dict.alertTitle}
                  </p>
                </div>
                <span className="text-[13px] font-medium text-[#dc2626]">
                  {patient.alert}
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-7 border-b border-[#e2e8f0]">
              {(
                [
                  ["summary", dict.tabs.summary],
                  ["timeline", dict.tabs.timeline],
                  ["documents", dict.tabs.documents],
                  ["fullHistory", dict.tabs.fullHistory],
                ] as [Tab, string][]
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`
                    -mb-px
                    border-b-2
                    pb-3
                    text-[13px]
                    font-medium
                    transition-colors
                    ${
                      activeTab === tab
                        ? "border-[#1768d5] text-[#1768d5]"
                        : "border-transparent text-[#64748b] hover:text-[#172033]"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Summary fields */}
            {activeTab === "summary" && (
              <div className="flex flex-col gap-5">
                {fields.map((field) => (
                  <div key={field.label}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#94a3b8]">
                      {field.label}
                    </p>
                    <p className="mt-1 text-[14px] text-[#253044]">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-10 flex justify-end gap-3">
              <button
                type="button"
                onClick={onEditSummary}
                className="
                  h-[42px]
                  rounded-[9px]
                  border
                  border-[#e2e8f0]
                  bg-white
                  px-5
                  text-[13px]
                  font-semibold
                  text-[#253044]
                  transition-colors
                  hover:border-[#cbd5e1]
                "
              >
                {dict.editSummary}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="
                  h-[42px]
                  rounded-[9px]
                  bg-[#15803d]
                  px-6
                  text-[13px]
                  font-semibold
                  text-white
                  transition-colors
                  hover:bg-[#166534]
                "
              >
                {dict.confirm}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}