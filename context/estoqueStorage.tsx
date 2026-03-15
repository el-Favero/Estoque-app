// context/estoqueStorage.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Produto } from '../types/produto';
import { getProdutos, createProduto, updateProduto, deleteProduto } from '../services/produtoService';
import { registrarMovimentacao as registrarMovimentacaoService } from '../services/movimentacao/movimentacaoServices';
import { MovimentacaoInput, Movimentacao } from '../services/movimentacao/types';
import { getTodasMovimentacoes } from '../services/movimentacao/movimentacaoServices';

interface EstoqueContextType {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  loading: boolean;
  carregarProdutos: () => Promise<void>;
  carregarMovimentacoes: () => Promise<void>;
  adicionarProduto: (produto: Omit<Produto, 'id'>) => Promise<string>;
  editarProduto: (id: string, updates: Partial<Omit<Produto, 'id'>>) => Promise<void>;
  removerProduto: (id: string) => Promise<void>;
  registrarMovimentacao: (data: MovimentacaoInput) => Promise<string>;
}

const EstoqueContext = createContext<EstoqueContextType>({} as EstoqueContextType);

export const EstoqueProvider = ({ children }: { children: React.ReactNode }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar produtos
  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const dados = await getProdutos();
      setProdutos(dados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Carregar movimentações
  const carregarMovimentacoes = async () => {
    try {
      const dados = await getTodasMovimentacoes();
      setMovimentacoes(dados);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  // Carregar dados ao iniciar
  useEffect(() => {
    carregarProdutos();
    carregarMovimentacoes();
  }, []);

  // Adicionar produto
  const adicionarProduto = async (produto: Omit<Produto, 'id'>) => {
    try {
      const id = await createProduto(produto);
      await carregarProdutos(); // Recarrega para ter dados consistentes
      return id;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    }
  };

  // Editar produto
  const editarProduto = async (id: string, updates: Partial<Omit<Produto, 'id'>>) => {
    try {
      await updateProduto(id, updates);
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      throw error;
    }
  };

  // Remover produto
  const removerProduto = async (id: string) => {
    try {
      await deleteProduto(id);
      setProdutos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      throw error;
    }
  };

  // Registrar movimentação
  const registrarMovimentacao = async (data: MovimentacaoInput) => {
    try {
      const movimentacaoId = await registrarMovimentacaoService(data);
      // Recarregar ambos para garantir consistência
      await Promise.all([
        carregarProdutos(),
        carregarMovimentacoes()
      ]);
      return movimentacaoId;
    } catch (error) {
      console.error('Erro no contexto ao registrar movimentação:', error);
      throw error;
    }
  };

  return (
    <EstoqueContext.Provider value={{
      produtos,
      movimentacoes,
      loading,
      carregarProdutos,
      carregarMovimentacoes,
      adicionarProduto,
      editarProduto,
      removerProduto,
      registrarMovimentacao,
    }}>
      {children}
    </EstoqueContext.Provider>
  );
};

export const useEstoque = () => useContext(EstoqueContext);