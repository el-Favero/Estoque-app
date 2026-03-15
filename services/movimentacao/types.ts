// services/movimentacao/types.ts
export type TipoMovimentacao = 'retirada' | 'retorno';

export interface Movimentacao {
  id: string;  // OBRIGATÓRIO (vem do Firestore)
  tipo: TipoMovimentacao;
  produtoId: string;
  data: string; // Vamos usar string ISO (ex: 2024-01-15T10:30:00)
  
  // Quantidades (pelo menos uma deve existir)
  quantidadeUnidades?: number;
  quantidadeKg?: number;
  
  // Campo de compatibilidade com o histórico ANTIGO
  quantidade: number; // OBRIGATÓRIO para o utils
  
  finalidade?: string;
  observacao?: string;
  usuarioId?: string;
  
  // Auditoria
  estoqueAnterior?: {
    quantidade: number;
    quantidadeKg?: number;
  };
  estoqueNovo?: {
    quantidade: number;
    quantidadeKg?: number;
  };
  
  createdAt?: string;
  updatedAt?: string;
}

export interface MovimentacaoInput {
  tipo: TipoMovimentacao;
  produtoId: string;
  quantidadeUnidades?: number;
  quantidadeKg?: number;
  finalidade?: string;
  observacao?: string;
}

export interface FiltroMovimentacao {
  dataInicio?: string;
  dataFim?: string;
  produtoId?: string;
  tipo?: TipoMovimentacao;
}