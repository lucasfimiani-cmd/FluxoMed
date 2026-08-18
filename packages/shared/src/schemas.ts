import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RegimeTributario = z.enum([
  "SIMPLES_NACIONAL",
  "LUCRO_PRESUMIDO",
  "PF_AUTONOMA",
]);
export type RegimeTributario = z.infer<typeof RegimeTributario>;

export const TipoPerfilFiscal = z.enum(["PF", "PJ"]);
export type TipoPerfilFiscal = z.infer<typeof TipoPerfilFiscal>;

export const TipoRemuneracao = z.enum([
  "FIXO_MENSAL",
  "VARIAVEL_POR_ATIVIDADE",
]);
export type TipoRemuneracao = z.infer<typeof TipoRemuneracao>;

export const StatusAtividade = z.enum([
  "AGENDADA",
  "REALIZADA",
  "RECEBIDA",
  "CANCELADA",
]);
export type StatusAtividade = z.infer<typeof StatusAtividade>;

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const PerfilFiscalSchema = z.object({
  id: z.string().uuid(),
  profissionalId: z.string().uuid(),
  tipo: TipoPerfilFiscal,
  regimeTributario: RegimeTributario,
  aliquotaEfetiva: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PerfilFiscal = z.infer<typeof PerfilFiscalSchema>;

export const FonteDeRendaSchema = z.object({
  id: z.string().uuid(),
  perfilFiscalId: z.string().uuid(),
  nome: z.string().min(1).max(200),
  tipoRemuneracao: TipoRemuneracao,
  prazoPagamentoDias: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type FonteDeRenda = z.infer<typeof FonteDeRendaSchema>;

export const AtividadeSchema = z.object({
  id: z.string().uuid(),
  fonteDeRendaId: z.string().uuid(),
  descricao: z.string().min(1).max(500),
  data: z.string().datetime(),
  valorPrevisto: z.number().min(0),
  valorRealizado: z.number().min(0).optional(),
  status: StatusAtividade,
  recebimentoId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Atividade = z.infer<typeof AtividadeSchema>;

export const RecebimentoSchema = z.object({
  id: z.string().uuid(),
  fonteDeRendaId: z.string().uuid(),
  valor: z.number().min(0),
  data: z.string().datetime(),
  descricao: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Recebimento = z.infer<typeof RecebimentoSchema>;

export const MetaFinanceiraSchema = z.object({
  id: z.string().uuid(),
  profissionalId: z.string().uuid(),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  valorAlvo: z.number().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MetaFinanceira = z.infer<typeof MetaFinanceiraSchema>;