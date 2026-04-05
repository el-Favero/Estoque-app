import { db, auth } from "../src/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { Produto, LoteProduto } from "../types/produto";
import { validadeParaISO } from "../utils/validadeUtils";

function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    // Retornar string vazia em vez de erro - callers devem tratar
    return "";
  }
  return user.uid;
}

// Verifica se pode fazer operações que precisam de usuário
function checkAuth(): boolean {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn("Operação requer login");
    return false;
  }
  return true;
}

// Remove qualquer campo com valor undefined antes de enviar ao Firestore
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const novo: Record<string, any> = {};
  Object.keys(obj).forEach((chave) => {
    const valor = obj[chave];
    if (valor !== undefined) {
      novo[chave] = valor;
    }
  });
  return novo as T;
}

// Gera ID único para lote
function gerarIdLote(): string {
  return `lote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Encontra índice de lote pela validade
function encontrarIndiceLotePorValidade(
  lotes: LoteProduto[],
  validade: string
): number {
  return lotes.findIndex((l) => l.validade === validade);
}

// Ordena lotes por validade (mais próxima primeiro) - FIFO
function ordenarLotesPorValidade(lotes: LoteProduto[]): LoteProduto[] {
  return [...lotes].sort(
    (a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime()
  );
}

export const createProduto = async (
  produto: Omit<Produto, "id" | "userId">
): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("Usuário não está logado");
    }
    const docRef = await addDoc(collection(db, "produtos"), {
      ...produto,
      userId,
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }
};

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn("getProdutos: Usuário não logado, retornando array vazio");
      return [];
    }
    const q = query(collection(db, "produtos"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const produtos: Produto[] = [];
    querySnapshot.forEach((snap) => {
      produtos.push({ id: snap.id, ...snap.data() } as Produto);
    });
    return produtos;
  } catch (error) {
    console.error("Erro detalhado ao buscar produtos:", error);
    return [];
  }
};
// Adicione esta função depois da getProdutos
export const getProduto = async (id: string): Promise<Produto | null> => {
  try {
    const produtoRef = doc(db, "produtos", id);
    const produtoSnap = await getDoc(produtoRef);
    
    if (produtoSnap.exists()) {
      return { id: produtoSnap.id, ...produtoSnap.data() } as Produto;
    } else {
      return null; // Produto não encontrado
    }
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    throw error;
  }
};

export const updateProduto = async (
  id: string,
  updates: Partial<Omit<Produto, "id">>
): Promise<void> => {
  try {
    const produtoRef = doc(db, "produtos", id);
    const dados = removeUndefined(updates as Record<string, any>);
    await updateDoc(produtoRef, dados);
  } catch (error) {
    console.error("Erro detalhado ao atualizar produto:", error);
    throw error;
  }
};

export const deleteProduto = async (id: string): Promise<void> => {
  try {
    const produtoRef = doc(db, "produtos", id);
    await deleteDoc(produtoRef);
  } catch (error) {
    console.error("Erro detalhado ao deletar produto:", error);
    throw error;
  }
};

// Busca um produto existente pelo par (nome, categoria)
export const findProdutoPorNomeECategoria = async (
  nome: string,
  categoria: string
): Promise<Produto | null> => {
  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }
  const produtosRef = collection(db, "produtos");
  const q = query(
    produtosRef,
    where("userId", "==", userId),
    where("nome", "==", nome),
    where("categoria", "==", categoria)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as any) } as Produto;
};

export const findProdutoPorCodigoBarras = async (
  codigo: string
): Promise<Produto | null> => {
  const c = codigo.trim();
  if (!c) return null;
  const userId = getCurrentUserId();
  if (!userId) return null;
  const produtosRef = collection(db, "produtos");
  const q = query(
    produtosRef,
    where("userId", "==", userId),
    where("codigoBarras", "==", c)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as any) } as Produto;
};

// Adiciona um lote a um produto existente OU cria o produto se ainda não existir
export const adicionarLoteOuCriarProduto = async (params: {
  nome: string;
  categoria: string;
  descricao?: string;
  validade: string;
  quantidadeUnidades: number;
  quantidadeKg?: number;
  codigoBarras?: string;
}): Promise<string> => {
  const {
    nome,
    categoria,
    descricao,
    validade,
    quantidadeUnidades,
    quantidadeKg,
    codigoBarras,
  } = params;

  const validadeISO = validadeParaISO(validade);
  const dataEntrada = new Date().toISOString();

  const existente = await findProdutoPorNomeECategoria(nome, categoria);

  // Se não existe, criar novo produto com primeiro lote
  if (!existente) {
    const userId = getCurrentUserId();
    const novoLote: LoteProduto = {
      id: gerarIdLote(),
      validade: validadeISO,
      quantidadeUnidades:
        quantidadeUnidades > 0 ? quantidadeUnidades : undefined,
      quantidadeKg: quantidadeKg && quantidadeKg > 0 ? quantidadeKg : undefined,
      dataEntrada,
    };

    const novoProduto: Omit<Produto, "id"> = removeUndefined({
      userId,
      nome,
      categoria,
      descricao,
      quantidade: quantidadeUnidades,
      quantidadeKg: quantidadeKg,
      validade: validadeISO, // mais próxima
      lotes: [novoLote],
      codigoBarras: codigoBarras?.trim() || undefined,
    });
    return await createProduto(novoProduto);
  }

  // Produto existe - verificar se já tem lote com mesma validade
  const lotesAtuais: LoteProduto[] = existente.lotes || [];
  const indiceLoteExistente = encontrarIndiceLotePorValidade(
    lotesAtuais,
    validadeISO
  );

  let novosLotes: LoteProduto[];
  let quantidadeTotalUnidades = existente.quantidade || 0;
  let quantidadeTotalKg = existente.quantidadeKg || 0;

  if (indiceLoteExistente >= 0) {
    // Lote com mesma validade existe - SOMAR quantidade
    const loteExistente = lotesAtuais[indiceLoteExistente];
    const novaQtdUnidades =
      (loteExistente.quantidadeUnidades || 0) + quantidadeUnidades;
    const novaQtdKg =
      (loteExistente.quantidadeKg || 0) + (quantidadeKg || 0);

    lotesAtuais[indiceLoteExistente] = {
      ...loteExistente,
      quantidadeUnidades:
        novaQtdUnidades > 0 ? novaQtdUnidades : undefined,
      quantidadeKg: novaQtdKg > 0 ? novaQtdKg : undefined,
    };
    novosLotes = lotesAtuais;
    quantidadeTotalUnidades += quantidadeUnidades;
    quantidadeTotalKg += quantidadeKg || 0;
  } else {
    // Novo lote com validade diferente - ADICIONAR à lista
    const novoLote: LoteProduto = {
      id: gerarIdLote(),
      validade: validadeISO,
      quantidadeUnidades:
        quantidadeUnidades > 0 ? quantidadeUnidades : undefined,
      quantidadeKg: quantidadeKg && quantidadeKg > 0 ? quantidadeKg : undefined,
      dataEntrada,
    };
    novosLotes = [...lotesAtuais, novoLote];
    quantidadeTotalUnidades += quantidadeUnidades;
    quantidadeTotalKg += quantidadeKg || 0;
  }

  // Atualizar validade principal para a mais próxima
  const lotesOrdenados = ordenarLotesPorValidade(novosLotes);
  const validadeMaisProxima = lotesOrdenados.find(
    (l) => (l.quantidadeUnidades || 0) > 0
  )?.validade;

  const produtoRef = doc(db, "produtos", existente.id);
  const dadosAtualizados = removeUndefined({
    quantidade: quantidadeTotalUnidades,
    quantidadeKg: quantidadeTotalKg || undefined,
    validade: validadeMaisProxima,
    lotes: novosLotes,
    codigoBarras:
      codigoBarras?.trim() && !existente.codigoBarras
        ? codigoBarras.trim()
        : undefined,
  });

  await updateDoc(produtoRef, dadosAtualizados);

  return existente.id;
};

// Tipos para saída FIFO
export interface SaidaFIFOInput {
  produtoId: string;
  quantidadeUnidades?: number;
  quantidadeKg?: number;
}

export interface SaidaFIFOResult {
  sucesso: boolean;
  lotesAfetados: {
    loteId: string;
    validade: string;
    quantidadeRemovida: number;
    quantidadeRestante: number;
  }[];
  message: string;
}

// Saída de estoque com lógica FIFO automática
export const saidaEstoqueFIFO = async (
  input: SaidaFIFOInput
): Promise<SaidaFIFOResult> => {
  const { produtoId, quantidadeUnidades, quantidadeKg } = input;

  const produto = await getProduto(produtoId);
  if (!produto) {
    throw new Error("Produto não encontrado");
  }

  const lotes = produto.lotes || [];
  if (lotes.length === 0) {
    throw new Error("Produto sem lotes cadastrados");
  }

  // Ordenar por validade (mais próxima primeiro) - FIFO
  const lotesOrdenados = ordenarLotesPorValidade(lotes);

  let qtdUnidadesRemover = quantidadeUnidades || 0;
  let qtdKgRemover = quantidadeKg || 0;
  const lotesAfetados: SaidaFIFOResult["lotesAfetados"] = [];
  let novosLotes: LoteProduto[] = [];

  for (const lote of lotesOrdenados) {
    if (qtdUnidadesRemover <= 0 && qtdKgRemover <= 0) {
      novosLotes.push(lote);
      continue;
    }

    const qtdLoteUnidades = lote.quantidadeUnidades || 0;
    const qtdLoteKg = lote.quantidadeKg || 0;

    let removidoUnidades = 0;
    let removidoKg = 0;
    let restanteUnidades = qtdLoteUnidades;
    let restanteKg = qtdLoteKg;

    if (qtdUnidadesRemover > 0 && qtdLoteUnidades > 0) {
      removidoUnidades = Math.min(qtdUnidadesRemover, qtdLoteUnidades);
      restanteUnidades = qtdLoteUnidades - removidoUnidades;
      qtdUnidadesRemover -= removidoUnidades;
    }

    if (qtdKgRemover > 0 && qtdLoteKg > 0) {
      removidoKg = Math.min(qtdKgRemover, qtdLoteKg);
      restanteKg = qtdLoteKg - removidoKg;
      qtdKgRemover -= removidoKg;
    }

    if (restanteUnidades > 0 || restanteKg > 0) {
      lotesAfetados.push({
        loteId: lote.id,
        validade: lote.validade,
        quantidadeRemovida: removidoUnidades || removidoKg,
        quantidadeRestante: restanteUnidades || restanteKg,
      });
      novosLotes.push({
        ...lote,
        quantidadeUnidades:
          restanteUnidades > 0 ? restanteUnidades : undefined,
        quantidadeKg: restanteKg > 0 ? restanteKg : undefined,
      });
    } else {
      lotesAfetados.push({
        loteId: lote.id,
        validade: lote.validade,
        quantidadeRemovida: removidoUnidades || removidoKg,
        quantidadeRestante: 0,
      });
    }
  }

  // Verificar se foi possível atender toda a solicitação
  if (qtdUnidadesRemover > 0 || qtdKgRemover > 0) {
    const msg =
      qtdUnidadesRemover > 0
        ? `Estoque insuficiente. Faltam ${qtdUnidadesRemover} unidades`
        : `Estoque insuficiente. Faltam ${qtdKgRemover} kg`;
    throw new Error(msg);
  }

  // Calcular nova quantidade total
  const novaQuantidadeTotal = novosLotes.reduce(
    (acc, l) => acc + (l.quantidadeUnidades || 0),
    0
  );
  const novaQuantidadeKgTotal = novosLotes.reduce(
    (acc, l) => acc + (l.quantidadeKg || 0),
    0
  );

  // Atualizar validade principal
  const lotesComEstoque = novosLotes.filter(
    (l) => (l.quantidadeUnidades || 0) > 0 || (l.quantidadeKg || 0) > 0
  );
  const validadeMaisProxima = lotesComEstoque.length > 0
    ? ordenarLotesPorValidade(lotesComEstoque)[0].validade
    : undefined;

  // Salvar no Firestore
  const produtoRef = doc(db, "produtos", produtoId);
  await updateDoc(produtoRef, {
    quantidade: novaQuantidadeTotal,
    quantidadeKg: novaQuantidadeKgTotal || undefined,
    validade: validadeMaisProxima,
    lotes: novosLotes,
  });

  // Gerar mensagem de retorno
  const lotesMsg = lotesAfetados
    .map((l) => `${l.validade}: -${l.quantidadeRemovida}`)
    .join(", ");

  return {
    sucesso: true,
    lotesAfetados,
    message: `Removido: ${lotesMsg}`,
  };
};

//getProdutos por nome (para autofill)
export const buscarProdutosPorNome = async (
  nome: string
): Promise<Produto[]> => {
  const userId = getCurrentUserId();
  const produtosRef = collection(db, "produtos");
  const q = query(
    produtosRef,
    where("userId", "==", userId),
    where("nome", ">=", nome),
    where("nome", "<=", nome + "\uf8ff")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Produto));
};