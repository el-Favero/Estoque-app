import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Produto } from "@/types/produto";

const STORAGE_KEY = "@estoque_produtos";


// Salvar lista completa
export async function salvarProdutos(produtos: Produto[]) {
  const json = JSON.stringify(produtos);
  await AsyncStorage.setItem(STORAGE_KEY, json);
}


// Carregar lista completa
export async function carregarProdutos(): Promise<Produto[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);

  if (json) {
    return JSON.parse(json);
  }

  return [];
}


// Adicionar produto sem apagar os anteriores
export async function adicionarProduto(novoProduto: Produto) {
  const produtosAtuais = await carregarProdutos();

  const novaLista = [...produtosAtuais, novoProduto];

  await salvarProdutos(novaLista);
}