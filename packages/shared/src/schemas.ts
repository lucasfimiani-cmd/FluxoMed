import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RegimeTributario = z.enum([
  "PF_AUTONOMO",
  "SIMPLES_NACIONAL",
  "LUCRO_PRESUMIDO",
]);
export type RegimeTributario = z.infer<typeof RegimeTributario>;

export const TipoPerfilFiscal = z.enum(["PF", "PJ"]);
export type TipoPerfilFiscal = z.infer<typeof TipoPerfilFiscal>;

// ─── Perfil Fiscal Schemas ───────────────────────────────────────────────────

const regimePermitidoParaTipo: Record<string, string[]> = {
  PF: ["PF_AUTONOMO"],
  PJ: ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO"],
};

export const CriarPerfilFiscalSchema = z
  .object({
    tipo: TipoPerfilFiscal,
    regime: RegimeTributario,
    aliquotaEfetiva: z
      .number()
      .min(0, "Alíquota deve ser no mínimo 0%")
      .max(100, "Alíquota deve ser no máximo 100%"),
  })
  .refine(
    (data) => regimePermitidoParaTipo[data.tipo]?.includes(data.regime),
    {
      message: "Regime tributário incompatível com o tipo de perfil fiscal",
      path: ["regime"],
    }
  );
export type CriarPerfilFiscalInput = z.infer<typeof CriarPerfilFiscalSchema>;

export const EditarPerfilFiscalSchema = z
  .object({
    tipo: TipoPerfilFiscal.optional(),
    regime: RegimeTributario.optional(),
    aliquotaEfetiva: z
      .number()
      .min(0, "Alíquota deve ser no mínimo 0%")
      .max(100, "Alíquota deve ser no máximo 100%")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.tipo && data.regime) {
        return regimePermitidoParaTipo[data.tipo]?.includes(data.regime);
      }
      return true;
    },
    {
      message: "Regime tributário incompatível com o tipo de perfil fiscal",
      path: ["regime"],
    }
  );
export type EditarPerfilFiscalInput = z.infer<typeof EditarPerfilFiscalSchema>;

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
  id: z.string(),
  userId: z.string(),
  tipo: TipoPerfilFiscal,
  regime: RegimeTributario,
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

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});
export type LoginInput = z.infer<typeof LoginSchema>;