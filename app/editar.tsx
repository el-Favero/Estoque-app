import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { getProduto, updateProduto } from "@/services/produtoService";
import type { Produto } from "@/types/produto";

export default function TelaEditar() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [produto, setProduto] = useState<Produto | null>(null);

  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [minimo, setMinimo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [validade, setValidade] = useState("");

  // Carregar produto
  useEffect(() => {
    async function carregar() {
      if (!id) return;
      const encontrado = await getProduto(id);

      if (!encontrado) {
        Alert.alert("Erro", "Produto não encontrado");
        router.back();
        return;
      }

      setProduto(encontrado);

      setNome(encontrado.nome);
      setQuantidade(String(encontrado.quantidade));
      setMinimo(String(encontrado.minimo));
      setCategoria(encontrado.categoria);
      setDescricao(encontrado.descricao ?? "");
      setValidade(encontrado.validade ?? "");
    }

    carregar();
  }, [id]);

  // 🔹 Salvar alterações
  async function salvarEdicao() {
    if (!produto) return;

    if (!nome || !quantidade || !minimo || !categoria) {
      Alert.alert("Erro", "Preencha os campos obrigatórios");
      return;
    }

    const qtd = Number(quantidade);
    const min = Number(minimo);

    if (isNaN(qtd) || isNaN(min)) {
      Alert.alert("Erro", "Quantidade ou mínimo inválido");
      return;
    }

    try {
      await updateProduto(id!, {
        nome,
        quantidade: qtd,
        minimo: min,
        categoria,
        descricao: descricao || undefined,
        validade: validade || undefined,
      });

      Alert.alert("Sucesso", "Produto atualizado!");

      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar");
    }
  }

  if (!produto) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>✏️ Editar Produto</Text>

      <TextInput
        placeholder="Nome *"
        style={styles.input}
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        placeholder="Quantidade *"
        style={styles.input}
        keyboardType="numeric"
        value={quantidade}
        onChangeText={setQuantidade}
      />

      <TextInput
        placeholder="Estoque mínimo *"
        style={styles.input}
        keyboardType="numeric"
        value={minimo}
        onChangeText={setMinimo}
      />

      <TextInput
        placeholder="Categoria *"
        style={styles.input}
        value={categoria}
        onChangeText={setCategoria}
      />

      <TextInput
        placeholder="Descrição"
        style={styles.input}
        value={descricao}
        onChangeText={setDescricao}
      />

      <TextInput
        placeholder="Validade (YYYY-MM-DD)"
        style={styles.input}
        value={validade}
        onChangeText={setValidade}
      />

      <Button title="Salvar alterações" onPress={salvarEdicao} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
  },
});