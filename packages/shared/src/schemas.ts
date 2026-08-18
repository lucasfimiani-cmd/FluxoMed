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

export const ModeloRemuneracao = z.enum([
  "FIXO_MENSAL",
  "POR_ATIVIDADE",
  "POR_UNIDADE",
]);
export type ModeloRemuneracao = z.infer<typeof ModeloRemuneracao>;

export const TipoAtividade = z.enum([
  "PLANTAO",
  "CONSULTA",
  "PROCEDIMENTO",
  "OUTRO",
]);
export type TipoAtividade = z.infer<typeof TipoAtividade>;

export const StatusAtividade = z.enum([
  "AGENDADA",
  "REALIZADA",
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

export const PrecoAtividadeSchema = z.object({
  tipo: TipoAtividade,
  valor: z.number().min(0, "Valor deve ser no mínimo 0"),
});
export type PrecoAtividade = z.infer<typeof PrecoAtividadeSchema>;

// ─── Fonte de Renda Schemas ───────────────────────────────────────────────────

const rotuloTipoAtividade: Record<string, string> = {
  PLANTAO: "Plantão",
  CONSULTA: "Consulta",
  PROCEDIMENTO: "Procedimento",
  OUTRO: "Outro",
};

export const CriarFonteDeRendaSchema = z
  .object({
    nome: z
      .string()
      .min(1, "Nome é obrigatório")
      .max(100, "Nome deve ter no máximo 100 caracteres"),
    perfilFiscalId: z.string().min(1, "Perfil fiscal é obrigatório"),
    modelo: ModeloRemuneracao,
    valorMensal: z.number().optional().nullable(),
    valorPorAtividade: z.number().optional().nullable(),
    prazoPagamentoDias: z
      .number()
      .int("Prazo deve ser um número inteiro")
      .min(0, "Prazo deve ser no mínimo 0 dias")
      .max(365, "Prazo deve ser no máximo 365 dias"),
    precos: z.array(PrecoAtividadeSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.modelo === "FIXO_MENSAL") {
      if (!data.valorMensal || data.valorMensal <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor mensal é obrigatório para modelo Fixo Mensal",
          path: ["valorMensal"],
        });
      }
      if (data.valorPorAtividade) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Valor por atividade não se aplica ao modelo Fixo Mensal",
          path: ["valorPorAtividade"],
        });
      }
      if (data.precos && data.precos.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tabela de preços não se aplica ao modelo Fixo Mensal",
          path: ["precos"],
        });
      }
    }

    if (data.modelo === "POR_ATIVIDADE") {
      if (!data.valorPorAtividade || data.valorPorAtividade <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Valor por atividade é obrigatório para modelo Por Atividade",
          path: ["valorPorAtividade"],
        });
      }
      if (data.valorMensal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Valor mensal não se aplica ao modelo Por Atividade",
          path: ["valorMensal"],
        });
      }
      if (data.precos && data.precos.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tabela de preços não se aplica ao modelo Por Atividade",
          path: ["precos"],
        });
      }
    }

    if (data.modelo === "POR_UNIDADE") {
      if (!data.precos || data.precos.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Tabela de preços é obrigatória para modelo Por Unidade (pelo menos um tipo)",
          path: ["precos"],
        });
      }
      if (data.valorMensal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Valor mensal não se aplica ao modelo Por Unidade",
          path: ["valorMensal"],
        });
      }
      if (data.valorPorAtividade) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Valor por atividade não se aplica ao modelo Por Unidade",
          path: ["valorPorAtividade"],
        });
      }

      // Validar valores positivos e tipos únicos
      if (data.precos) {
        const tiposVistos = new Set<string>();
        for (let i = 0; i < data.precos.length; i++) {
          const p = data.precos[i];
          if (p.valor <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Valor para ${rotuloTipoAtividade[p.tipo] ?? p.tipo} deve ser maior que zero`,
              path: ["precos", i, "valor"],
            });
          }
          if (tiposVistos.has(p.tipo)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Tipo ${rotuloTipoAtividade[p.tipo] ?? p.tipo} duplicado na tabela de preços`,
              path: ["precos", i, "tipo"],
            });
          }
          tiposVistos.add(p.tipo);
        }
      }
    }
  });
export type CriarFonteDeRendaInput = z.infer<typeof CriarFonteDeRendaSchema>;

export const EditarFonteDeRendaSchema = CriarFonteDeRendaSchema;
export type EditarFonteDeRendaInput = z.infer<typeof EditarFonteDeRendaSchema>;

export const FonteDeRendaSchema = z.object({
  id: z.string(),
  userId: z.string(),
  perfilFiscalId: z.string(),
  nome: z.string().min(1).max(100),
  modelo: ModeloRemuneracao,
  valorMensal: z.number().nullable().optional(),
  valorPorAtividade: z.number().nullable().optional(),
  prazoPagamentoDias: z.number().int().min(0).max(365),
  ativa: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type FonteDeRenda = z.infer<typeof FonteDeRendaSchema>;

// ─── Atividade Schemas ─────────────────────────────────────────────────────────

export const CriarAtividadeSchema = z.object({
  tipo: TipoAtividade,
  fonteDeRendaId: z.string().min(1, "Fonte de renda é obrigatória"),
  data: z
    .string()
    .min(1, "Data é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
});
export type CriarAtividadeInput = z.infer<typeof CriarAtividadeSchema>;

export const EditarAtividadeSchema = z.object({
  tipo: TipoAtividade,
  fonteDeRendaId: z.string().min(1, "Fonte de renda é obrigatória"),
  data: z
    .string()
    .min(1, "Data é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
});
export type EditarAtividadeInput = z.infer<typeof EditarAtividadeSchema>;

export const AtividadeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fonteDeRendaId: z.string(),
  tipo: TipoAtividade,
  data: z.string(),
  status: StatusAtividade,
  valor: z.number().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Atividade = z.infer<typeof AtividadeSchema>;

// ─── Recebimento Schemas ────────────────────────────────────────────────────

export const CriarRecebimentoSchema = z.object({
  fonteDeRendaId: z.string().min(1, "Fonte de renda é obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  data: z
    .string()
    .min(1, "Data é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
  observacao: z.string().max(300, "Observação deve ter no máximo 300 caracteres").optional().nullable(),
});
export type CriarRecebimentoInput = z.infer<typeof CriarRecebimentoSchema>;

export const RecebimentoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fonteDeRendaId: z.string(),
  valor: z.number().min(0),
  data: z.string(),
  observacao: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Recebimento = z.infer<typeof RecebimentoSchema>;

export const CriarMetaFinanceiraSchema = z.object({
  ano: z.number().int("Ano deve ser um número inteiro").min(2020, "Ano inválido").max(2100, "Ano inválido"),
  mes: z.number().int("Mês deve ser um número inteiro").min(1, "Mês inválido").max(12, "Mês inválido"),
  valorAlvo: z.number().positive("Valor alvo deve ser maior que zero"),
});
export type CriarMetaFinanceiraInput = z.infer<typeof CriarMetaFinanceiraSchema>;

export const EditarMetaFinanceiraSchema = z.object({
  valorAlvo: z.number().positive("Valor alvo deve ser maior que zero"),
});
export type EditarMetaFinanceiraInput = z.infer<typeof EditarMetaFinanceiraSchema>;

export const MetaFinanceiraSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ano: z.number().int(),
  mes: z.number().int(),
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