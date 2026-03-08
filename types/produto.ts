// types/produto.ts
export type Produto = {
    id: string;
    nome: string;
    quantidade: number; // unidades (sempre obrigatório)
    pesoPorUnidade?: number; // kg por unidade (opcional)
    unidadePeso?: 'kg' | 'g'; // unidade do peso (kg ou g)
    minimo: number; // corrigido de "mínimo" para "minimo" (sem acento)
    categoria: string;
    descricao?: string;
    validade?: string;
    
    // NOVOS CAMPOS (opcionais)
    tipoControle?: 'unidade' | 'kg' | 'ambos'; // se não existir, assume comportamento antigo
    quantidadeKg?: number; // para produtos controlados por kg
}