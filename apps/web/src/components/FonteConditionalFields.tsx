"use client";

import { useState } from "react";

interface FonteConditionalFieldsProps {
  initialModelo?: string;
  initialValorMensal?: number | null;
  initialValorPorAtividade?: number | null;
  initialPrecos?: Record<string, number>;
}

export function FonteConditionalFields({
  initialModelo = "",
  initialValorMensal = null,
  initialValorPorAtividade = null,
  initialPrecos = {},
}: FonteConditionalFieldsProps) {
  const [modelo, setModelo] = useState(initialModelo);

  return (
    <>
      {/* Modelo selector */}
      <div>
        <label htmlFor="modelo" className="mb-1 block text-sm font-medium">
          Modelo de Remuneração
        </label>
        <select
          id="modelo"
          name="modelo"
          required
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Selecione...</option>
          <option value="FIXO_MENSAL">Fixo Mensal</option>
          <option value="POR_ATIVIDADE">Por Atividade</option>
          <option value="POR_UNIDADE">Por Unidade (tabela de preços)</option>
        </select>
      </div>

      {/* Fixo Mensal */}
      {modelo === "FIXO_MENSAL" && (
        <div id="campo-valor-mensal">
          <label htmlFor="valorMensal" className="mb-1 block text-sm font-medium">
            Valor Mensal (R$)
          </label>
          <input
            id="valorMensal"
            name="valorMensal"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValorMensal ?? undefined}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Ex.: 5000.00"
          />
        </div>
      )}

      {/* Por Atividade */}
      {modelo === "POR_ATIVIDADE" && (
        <div id="campo-valor-atividade">
          <label htmlFor="valorPorAtividade" className="mb-1 block text-sm font-medium">
            Valor por Atividade (R$)
          </label>
          <input
            id="valorPorAtividade"
            name="valorPorAtividade"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValorPorAtividade ?? undefined}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Ex.: 350.00"
          />
        </div>
      )}

      {/* Por Unidade — tabela de preços */}
      {modelo === "POR_UNIDADE" && (
        <div id="campo-precos">
          <label className="mb-1 block text-sm font-medium">
            Tabela de Preços por Tipo de Atividade
          </label>
          <p className="mb-1 text-xs text-zinc-400">
            Preencha pelo menos um tipo.
          </p>
          <div className="space-y-2">
            {[
              { tipo: "PLANTAO", label: "Plantão" },
              { tipo: "CONSULTA", label: "Consulta" },
              { tipo: "PROCEDIMENTO", label: "Procedimento" },
              { tipo: "OUTRO", label: "Outro" },
            ].map(({ tipo, label }) => (
              <div key={tipo} className="flex items-center gap-2">
                <span className="w-28 text-sm text-zinc-600">{label}</span>
                <input
                  id={`preco_${tipo}`}
                  name={`preco_${tipo}`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrecos[tipo] ?? undefined}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Valor (R$)"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}