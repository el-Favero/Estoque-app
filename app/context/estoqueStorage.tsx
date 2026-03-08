// context/estoqueStorage.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Produto } from '@/types/produto';

export interface Movimentacao {
  id: string;
  produtoId: string;
  tipo: 'retirada' | 'retorno';
  quantidade: number;
  finalidade?: string; // obrigatório para retirada
  data: string; // ISO string para facilitar
}

export interface ObservacaoDia {
  data: string; // YYYY-MM-DD
  texto: string;
}

interface EstoqueContextType {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  observacoes: ObservacaoDia[];
  carregando: boolean;
  adicionarProduto: (produto: Produto) => Promise<void>;
  registrarMovimentacao: (mov: Omit<Movimentacao, 'id' | 'data'>) => Promise<void>;
  salvarObservacao: (data: string, texto: string) => Promise<void>;
}

const EstoqueContext = createContext<EstoqueContextType>({} as EstoqueContextType);

export const EstoqueProvider = ({ children }: { children: React.ReactNode }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [observacoes, setObservacoes] = useState<ObservacaoDia[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Carregar dados do AsyncStorage ao iniciar
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const produtosSalvos = await AsyncStorage.getItem('@estoque:produtos');
      const movSalvas = await AsyncStorage.getItem('@estoque:movimentacoes');
      const obsSalvas = await AsyncStorage.getItem('@estoque:observacoes');

      if (produtosSalvos) setProdutos(JSON.parse(produtosSalvos));
      if (movSalvas) setMovimentacoes(JSON.parse(movSalvas));
      if (obsSalvas) setObservacoes(JSON.parse(obsSalvas));
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const salvarProdutos = async (novosProdutos: Produto[]) => {
    setProdutos(novosProdutos);
    await AsyncStorage.setItem('@estoque:produtos', JSON.stringify(novosProdutos));
  };

  const salvarMovimentacoes = async (novasMov: Movimentacao[]) => {
    setMovimentacoes(novasMov);
    await AsyncStorage.setItem('@estoque:movimentacoes', JSON.stringify(novasMov));
  };

  const salvarObservacoes = async (novasObs: ObservacaoDia[]) => {
    setObservacoes(novasObs);
    await AsyncStorage.setItem('@estoque:observacoes', JSON.stringify(novasObs));
  };

  const adicionarProduto = async (produto: Produto) => {
    const novosProdutos = [...produtos, produto];
    await salvarProdutos(novosProdutos);
  };

  const registrarMovimentacao = async (mov: Omit<Movimentacao, 'id' | 'data'>) => {
    // Atualizar saldo do produto
    const produtoIndex = produtos.findIndex(p => p.id === mov.produtoId);
    if (produtoIndex === -1) throw new Error('Produto não encontrado');

    const produto = produtos[produtoIndex];
    let novaQuantidade = produto.quantidade;

    if (mov.tipo === 'retirada') {
      if (produto.quantidade < mov.quantidade) {
        throw new Error('Quantidade insuficiente em estoque');
      }
      novaQuantidade = produto.quantidade - mov.quantidade;
    } else {
      novaQuantidade = produto.quantidade + mov.quantidade;
    }

    const produtoAtualizado = { ...produto, quantidade: novaQuantidade };
    const novosProdutos = [...produtos];
    novosProdutos[produtoIndex] = produtoAtualizado;
    await salvarProdutos(novosProdutos);

    // Registrar movimentação
    const novaMov: Movimentacao = {
      ...mov,
      id: Date.now().toString(),
      data: new Date().toISOString(),
    };
    const novasMov = [...movimentacoes, novaMov];
    await salvarMovimentacoes(novasMov);
  };

  const salvarObservacao = async (data: string, texto: string) => {
    const index = observacoes.findIndex(o => o.data === data);
    let novasObs: ObservacaoDia[];
    if (index >= 0) {
      novasObs = [...observacoes];
      novasObs[index].texto = texto;
    } else {
      novasObs = [...observacoes, { data, texto }];
    }
    await salvarObservacoes(novasObs);
  };

  return (
    <EstoqueContext.Provider value={{
      produtos,
      movimentacoes,
      observacoes,
      carregando,
      adicionarProduto,
      registrarMovimentacao,
      salvarObservacao,
    }}>
      {children}
    </EstoqueContext.Provider>
  );
};

export const useEstoque = () => useContext(EstoqueContext);