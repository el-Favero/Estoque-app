import { db } from "../src/firebaseConfig";
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

export const createProduto = async (
  produto: Omit<Produto, "id">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "produtos"), produto);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }
};

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    const produtos: Produto[] = [];
    querySnapshot.forEach((snap) => {
      produtos.push({ id: snap.id, ...snap.data() } as Produto);
    });
    return produtos;
  } catch (error) {
    console.error("Erro detalhado ao buscar produtos:", error);
    throw error;
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
  const produtosRef = collection(db, "produtos");
  const q = query(
    produtosRef,
    where("nome", "==", nome),
    where("categoria", "==", categoria)
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
}): Promise<string> => {
  const {
    nome,
    categoria,
    descricao,
    validade,
    quantidadeUnidades,
    quantidadeKg,
  } = params;

  const validadeISO = validadeParaISO(validade);

  const lote: LoteProduto = removeUndefined({
    validade: validadeISO,
    quantidadeUnidades:
      quantidadeUnidades > 0 ? quantidadeUnidades : undefined,
    quantidadeKg: quantidadeKg && quantidadeKg > 0 ? quantidadeKg : undefined,
  });

  const existente = await findProdutoPorNomeECategoria(nome, categoria);

  if (!existente) {
    const novoProduto: Omit<Produto, "id"> = removeUndefined({
      nome,
      categoria,
      descricao,
      quantidade: quantidadeUnidades,
      quantidadeKg: quantidadeKg,
      validade: validadeISO,
      lotes: [lote],
    });
    return await createProduto(novoProduto);
  }

  const produtoRef = doc(db, "produtos", existente.id);
  const lotesAtuais: LoteProduto[] = existente.lotes || [];

  const quantidadeTotalUnidades =
    (existente.quantidade || 0) + (quantidadeUnidades || 0);
  const quantidadeTotalKg =
    (existente.quantidadeKg || 0) + (quantidadeKg || 0);

  const dadosAtualizados = removeUndefined({
    quantidade: quantidadeTotalUnidades,
    quantidadeKg: quantidadeTotalKg || undefined,
    validade: validadeISO,
    lotes: [...lotesAtuais, lote],
  });

  await updateDoc(produtoRef, dadosAtualizados);

  return existente.id;
};