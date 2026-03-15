// types/produto.ts
export type LoteProduto = {
  validade: string; // formato DD/MM/AAAA ou ISO
  quantidadeUnidades?: number;
  quantidadeKg?: number;
  estoqueMinimoUnidades?: number;
  estoqueMinimoKg?: number;
};

export type Produto = {
  id: string;
  nome: string;
  quantidade: number; // estoque total em unidades
  quantidadeKg?: number; // estoque total em kg
  categoria: string;
  descricao?: string;
  validade?: string; // validade principal (pode ser a mais próxima)
  minimo?: number;
  pesoPorUnidade?: number;
  unidadePeso?: "kg" | "g";
  tipoControle?: "unidade" | "kg" | "ambos";
  lotes?: LoteProduto[]; // diferentes validades para o mesmo produto
};