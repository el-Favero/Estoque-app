// utils/historicoUtils.ts
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Produto } from '../types/produto'; // Ajuste o caminho conforme seu projeto

// Definição dos tipos localmente para evitar erros de import
interface Movimentacao {
  id: string;
  produtoId: string;
  tipo: 'retirada' | 'retorno';
  quantidade: number; // No seu tipo é só quantidade
  finalidade?: string;
  data: string;
  // Campos opcionais que podem existir
  quantidadeUnidades?: number;
  quantidadeKg?: number;
}

interface DiaHistorico {
  data: string;
  dataFormatada: string;
  diaSemana: string;
  movimentacoes: any[];
  totalUnidades: number;
  totalKg: number;
  observacao: string;
}

interface MesHistorico {
  mes: string;
  mesNumero: number;
  ano: number;
  dias: DiaHistorico[];
  totalCategorias: Record<string, { kg: number; unidades: number }>;
  totalProdutos: Array<{
    id: string;
    nome: string;
    categoria: string;
    totalKg: number;
    totalUnidades: number;
  }>;
  totais: {
    kg: number;
    unidades: number;
  };
}

export function processarDadosHistorico(
  movimentacoes: Movimentacao[],
  produtos: Produto[]
): MesHistorico[] {
  // Se não houver movimentações, retorna array vazio
  if (!movimentacoes || movimentacoes.length === 0) {
    return [];
  }

  // Agrupar movimentações por mês
  const mesesMap = new Map<string, Movimentacao[]>();

  movimentacoes.forEach((mov) => {
    const data = parseISO(mov.data);
    const chave = format(data, 'yyyy-MM');
    if (!mesesMap.has(chave)) {
      mesesMap.set(chave, []);
    }
    mesesMap.get(chave)!.push(mov);
  });

  // Converter para array e ordenar (mais recente primeiro)
  const mesesArray = Array.from(mesesMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([chave, movs]) => processarMes(chave, movs, produtos));

  return mesesArray;
}

function processarMes(
  chave: string,
  movimentacoes: Movimentacao[],
  produtos: Produto[]
): MesHistorico {
  const [ano, mes] = chave.split('-').map(Number);
  const dataReferencia = new Date(ano, mes - 1, 1);
  
  const nomeMes = format(dataReferencia, 'MMMM', { locale: ptBR });
  const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  
  // Agrupar por dia
  const diasMap = new Map<string, Movimentacao[]>();
  
  movimentacoes.forEach((mov) => {
    const data = parseISO(mov.data);
    const diaChave = format(data, 'yyyy-MM-dd');
    if (!diasMap.has(diaChave)) {
      diasMap.set(diaChave, []);
    }
    diasMap.get(diaChave)!.push(mov);
  });

  // Processar dias
  const dias: DiaHistorico[] = Array.from(diasMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([diaChave, movs]) => processarDia(diaChave, movs, produtos));

  // Calcular totais por categoria e produto
  const totalCategorias: Record<string, { kg: number; unidades: number }> = {};
  const totalProdutosMap = new Map<string, { kg: number; unidades: number; nome: string; categoria: string }>();

  movimentacoes.forEach((mov) => {
    const produto = produtos.find(p => p.id === mov.produtoId);
    if (!produto) return;

    const categoria = produto.categoria;
    if (!totalCategorias[categoria]) {
      totalCategorias[categoria] = { kg: 0, unidades: 0 };
    }

    // Como no seu tipo a movimentação tem apenas 'quantidade',
    // vamos considerar que se o produto tem pesoPorUnidade, a quantidade é em kg
    // caso contrário, é em unidades
    if (produto.pesoPorUnidade) {
      // É produto com peso, então quantidade é em kg
      totalCategorias[categoria].kg += mov.quantidade;
    } else {
      // É produto por unidade
      totalCategorias[categoria].unidades += mov.quantidade;
    }

    // Atualizar produto
    const produtoKey = mov.produtoId;
    if (!totalProdutosMap.has(produtoKey)) {
      totalProdutosMap.set(produtoKey, {
        kg: 0,
        unidades: 0,
        nome: produto.nome,
        categoria: produto.categoria,
      });
    }
    const prod = totalProdutosMap.get(produtoKey)!;
    if (produto.pesoPorUnidade) {
      prod.kg += mov.quantidade;
    } else {
      prod.unidades += mov.quantidade;
    }
  });

  // Converter produtos para array ordenado
  const totalProdutos = Array.from(totalProdutosMap.entries())
    .map(([id, data]) => ({
      id,
      nome: data.nome,
      categoria: data.categoria,
      totalKg: data.kg,
      totalUnidades: data.unidades,
    }))
    .sort((a, b) => (b.totalKg + b.totalUnidades) - (a.totalKg + a.totalUnidades));

  // Calcular totais gerais do mês
  const totais = {
    kg: movimentacoes.reduce((acc, mov) => {
      const produto = produtos.find(p => p.id === mov.produtoId);
      if (produto?.pesoPorUnidade) {
        return acc + mov.quantidade;
      }
      return acc;
    }, 0),
    unidades: movimentacoes.reduce((acc, mov) => {
      const produto = produtos.find(p => p.id === mov.produtoId);
      if (!produto?.pesoPorUnidade) {
        return acc + mov.quantidade;
      }
      return acc;
    }, 0),
  };

  return {
    mes: `${nomeMesCapitalizado}/${ano}`,
    mesNumero: mes,
    ano,
    dias,
    totalCategorias,
    totalProdutos,
    totais,
  };
}

function processarDia(
  diaChave: string,
  movimentacoes: Movimentacao[],
  produtos: Produto[]
): DiaHistorico {
  const data = parseISO(diaChave);
  const dataFormatada = format(data, 'dd/MM');
  const diaSemana = format(data, 'EEEE', { locale: ptBR });
  const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

  const movimentacoesComProduto = movimentacoes.map((mov) => {
    const produto = produtos.find(p => p.id === mov.produtoId);
    // Determinar se a quantidade é kg ou unidades baseado no produto
    const ehKg = produto?.pesoPorUnidade ? true : false;
    
    return {
      ...mov,
      nomeProduto: produto?.nome || 'Produto não encontrado',
      categoria: produto?.categoria || 'Sem categoria',
      quantidadeKg: ehKg ? mov.quantidade : 0,
      quantidadeUnidades: !ehKg ? mov.quantidade : 0,
    };
  });

  const totalUnidades = movimentacoes.reduce((acc, mov) => {
    const produto = produtos.find(p => p.id === mov.produtoId);
    if (!produto?.pesoPorUnidade) {
      return acc + mov.quantidade;
    }
    return acc;
  }, 0);
  
  const totalKg = movimentacoes.reduce((acc, mov) => {
    const produto = produtos.find(p => p.id === mov.produtoId);
    if (produto?.pesoPorUnidade) {
      return acc + mov.quantidade;
    }
    return acc;
  }, 0);

  // Observação (depois integrar com sistema de observações)
  const observacao = '';

  return {
    data: diaChave,
    dataFormatada,
    diaSemana: diaSemanaCapitalizado,
    movimentacoes: movimentacoesComProduto,
    totalUnidades,
    totalKg,
    observacao,
  };
}

export function calcularConsumoSemanal(
  mes: MesHistorico,
  produtos: Produto[]
): any[] {
  const semanas: any[] = [];
  
  // Agrupar dias por semana (simplificado)
  const diasPorSemana: Record<number, DiaHistorico[]> = {};
  
  mes.dias.forEach((dia) => {
    const data = parseISO(dia.data);
    const semana = Math.ceil(data.getDate() / 7);
    if (!diasPorSemana[semana]) {
      diasPorSemana[semana] = [];
    }
    diasPorSemana[semana].push(dia);
  });

  // Processar cada semana
  Object.entries(diasPorSemana).forEach(([semanaStr, dias]) => {
    const semana = parseInt(semanaStr);
    const produtosSemana: Map<string, { kg: number; unidades: number }> = new Map();

    dias.forEach((dia) => {
      dia.movimentacoes.forEach((mov: any) => {
        if (!produtosSemana.has(mov.produtoId)) {
          produtosSemana.set(mov.produtoId, { kg: 0, unidades: 0 });
        }
        const prod = produtosSemana.get(mov.produtoId)!;
        if (mov.quantidadeKg) prod.kg += mov.quantidadeKg;
        if (mov.quantidadeUnidades) prod.unidades += mov.quantidadeUnidades;
      });
    });

    const produtosArray = Array.from(produtosSemana.entries()).map(([id, totais]) => {
      const produto = produtos.find(p => p.id === id);
      return {
        id,
        nome: produto?.nome || 'Produto',
        kg: totais.kg,
        unidades: totais.unidades,
      };
    });

    semanas.push({
      semana,
      label: `Semana ${semana}`,
      produtos: produtosArray,
      totalKg: produtosArray.reduce((acc, p) => acc + p.kg, 0),
      totalUnidades: produtosArray.reduce((acc, p) => acc + p.unidades, 0),
    });
  });

  return semanas.sort((a, b) => a.semana - b.semana);
}