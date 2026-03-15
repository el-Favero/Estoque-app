import { db } from '../../src/firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { getProduto, updateProduto } from '../produtoService';
import { Movimentacao, MovimentacaoInput } from './types';

export const registrarMovimentacao = async (data: MovimentacaoInput) => {
  try {
    // 1. Buscar o produto atual
    const produto = await getProduto(data.produtoId);
    
    // 2. Verificar se o produto existe
    if (!produto) {
      throw new Error('Produto não encontrado');
    }
    
    // 3. Validar estoque (para retirada)
    if (data.tipo === 'retirada') {
      if (data.quantidadeUnidades && data.quantidadeUnidades > produto.quantidade) {
        throw new Error(`Unidades insuficientes. Disponível: ${produto.quantidade}`);
      }
      if (data.quantidadeKg && data.quantidadeKg > (produto.quantidadeKg || 0)) {
        throw new Error(`Peso insuficiente. Disponível: ${produto.quantidadeKg} kg`);
      }
    }
    
    // 4. Calcular novo estoque
    const multiplicador = data.tipo === 'retirada' ? -1 : 1;
    const novaQuantidade = produto.quantidade + (data.quantidadeUnidades || 0) * multiplicador;
    const novoKg = produto.quantidadeKg 
      ? produto.quantidadeKg + (data.quantidadeKg || 0) * multiplicador 
      : undefined;
    
    // 5. Determinar a quantidade principal para compatibilidade
    const quantidadePrincipal = data.quantidadeUnidades || data.quantidadeKg || 0;
    
    // 6. Criar objeto completo da movimentação
    const movimentacaoCompleta = {
      ...data,
      quantidade: quantidadePrincipal,
      data: new Date().toISOString(),
      estoqueAnterior: {
        quantidade: produto.quantidade,
        quantidadeKg: produto.quantidadeKg
      },
      estoqueNovo: {
        quantidade: novaQuantidade,
        quantidadeKg: novoKg
      }
    };
    
    // 7. Salvar no Firestore
    const movimentacaoRef = await addDoc(collection(db, 'movimentacoes'), movimentacaoCompleta);
    
    // 8. Atualizar o produto
    await updateProduto(data.produtoId, {
      quantidade: novaQuantidade,
      quantidadeKg: novoKg
    });
    
    return movimentacaoRef.id;
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    throw error;
  }
};

export const getTodasMovimentacoes = async (): Promise<Movimentacao[]> => {
  try {
    const q = query(
      collection(db, 'movimentacoes'),
      orderBy('data', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Determinar qual quantidade usar para compatibilidade
      const quantidade = data.quantidadeUnidades || data.quantidadeKg || 0;
      
      return {
        id: doc.id,
        ...data,
        quantidade,
      } as Movimentacao;
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    throw error;
  }
};