"use client";

import { useState } from "react";

interface PerfilConditionalFieldsProps {
  initialTipo?: string;
  initialRegime?: string;
}

const REGIMES_PF = [{ value: "PF_AUTONOMO", label: "PF Autônoma" }];

const REGIMES_PJ = [
  { value: "SIMPLES_NACIONAL", label: "Simples Nacional" },
  { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
];

export function PerfilConditionalFields({
  initialTipo = "",
  initialRegime = "",
}: PerfilConditionalFieldsProps) {
  const [tipo, setTipo] = useState(initialTipo);

  const regimes = tipo === "PF" ? REGIMES_PF : tipo === "PJ" ? REGIMES_PJ : [];

  return (
    <>
      {/* Tipo selector */}
      <div>
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Selecione...</option>
          <option value="PF">Pessoa Física (PF)</option>
          <option value="PJ">Pessoa Jurídica (PJ)</option>
        </select>
      </div>

      {/* Regime — changes based on tipo */}
      {tipo && (
        <div>
          <label htmlFor="regime" className="mb-1 block text-sm font-medium">
            Regime Tributário
          </label>
          <select
            id="regime"
            name="regime"
            required
            defaultValue={
              regimes.map((r) => r.value).includes(initialRegime)
                ? initialRegime
                : ""
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Selecione...</option>
            {regimes.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}