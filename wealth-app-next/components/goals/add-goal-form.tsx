"use client";

import { useState } from "react";
import type { Goal } from "@/lib/engine/types";

export function AddGoalForm({
  currency,
  onAdd,
}: {
  currency: string;
  onAdd: (goal: Goal) => void;
}) {
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState("");
  const [cat, setCat] = useState("other");
  const [tier, setTier] = useState<Goal["tier"]>("important");
  const [amt, setAmt] = useState(0);
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);

  return (
    <div className="rounded-xl bg-[#f8faff] p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <input
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={inputClass}
        >
          <option value="retirement">🏖 Retirement</option>
          <option value="home">🏠 Home purchase</option>
          <option value="education">🎓 Education</option>
          <option value="travel">✈️ Travel</option>
          <option value="emergency">🛡 Emergency fund</option>
          <option value="business">💼 Business</option>
          <option value="wedding">💍 Wedding</option>
          <option value="vehicle">🚗 Vehicle</option>
          <option value="healthcare">🏥 Healthcare</option>
          <option value="legacy">🎁 Legacy / Inheritance</option>
          <option value="other">⭐ Other</option>
        </select>

        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as Goal["tier"])}
          className={inputClass}
        >
          <option value="essential">Essential — must have</option>
          <option value="important">Important — strongly want</option>
          <option value="aspirational">Aspirational — nice to have</option>
        </select>

        <input
          type="number"
          placeholder={`Amount (${currency}/yr)`}
          value={amt}
          onChange={(e) => setAmt(Number(e.target.value))}
          className={inputClass}
        />

        <input
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(Number(e.target.value))}
          className={inputClass}
        />

        <input
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(Number(e.target.value))}
          className={inputClass}
        />
      </div>

      <button
        type="button"
        className="mt-4 rounded-lg bg-[#0057b8] px-5 py-2 text-sm font-semibold text-white"
        onClick={() => {
          if (!name.trim()) return;

          onAdd({
            id: crypto.randomUUID(),
            name: name.trim(),
            cat,
            tier,
            amt,
            startYear,
            endYear: Math.max(startYear, endYear),
          });
        }}
      >
        Add
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#dbe3ef] bg-white px-3 py-2 text-sm";