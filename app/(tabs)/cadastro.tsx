import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Alert } from "react-native";
import { adicionarLoteOuCriarProduto } from "../../services/produtoService";
import { useTheme } from "../../context/ThemeContext";
import { formatarDataInput } from "../../utils/validadeUtils";

export default function CadastroProduto() {
  const { colors } = useTheme();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidadeUnidades, setQuantidadeUnidades] = useState("");
  const [quantidadeKg, setQuantidadeKg] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleChangeValidade = (text: string) => {
    setValidade(formatarDataInput(text));
  };

  async function salvarProduto() {
    if (!nome.trim() || !categoria.trim() || !validade.trim()) {
      Alert.alert(
        "Erro",
        "Preencha o nome, a categoria e a validade do produto."
      );
      return;
    }

    const unidades = Number(quantidadeUnidades.replace(",", ".")) || 0;
    const kg = Number(quantidadeKg.replace(",", ".")) || 0;

    if (unidades <= 0 && kg <= 0) {
      Alert.alert(
        "Erro",
        "Informe pelo menos uma forma de quantidade: em unidades ou em kg."
      );
      return;
    }

    try {
      await adicionarLoteOuCriarProduto({
        nome: nome.trim(),
        categoria: categoria.trim(),
        descricao: descricao.trim() || undefined,
        validade,
        quantidadeUnidades: unidades,
        quantidadeKg: kg > 0 ? kg : undefined,
      });
      Alert.alert("Sucesso", "Produto cadastrado!");

      setNome("");
      setCategoria("");
      setValidade("");
      setQuantidadeUnidades("");
      setQuantidadeKg("");
      setDescricao("");
    } catch (error: any) {
      Alert.alert("Erro", "Falha ao cadastrar: " + (error.message || ""));
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: colors.title,
              textAlign: "center",
            }}
          >
            Cadastrar Produto
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.subtitle,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Informe os dados básicos do insumo
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            marginBottom: 16,
          }}
        >
          {/* Nome */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.title,
              marginBottom: 6,
            }}
          >
            Nome do produto <Text style={{ color: "#ef4444" }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: "#0f172a",
              marginBottom: 8,
            }}
            placeholder="Ex.: Fubá, Frango, Óleo de soja..."
            placeholderTextColor="#94a3b8"
            value={nome}
            onChangeText={setNome}
          />

          {/* Categoria */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.title,
              marginBottom: 6,
              marginTop: 8,
            }}
          >
            Categoria <Text style={{ color: "#ef4444" }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: "#0f172a",
              marginBottom: 8,
            }}
            placeholder="Ex.: Grãos, Carnes, Limpeza..."
            placeholderTextColor="#94a3b8"
            value={categoria}
            onChangeText={setCategoria}
          />

          {/* Validade */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.title,
              marginBottom: 6,
              marginTop: 8,
            }}
          >
            Validade <Text style={{ color: "#ef4444" }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: "#0f172a",
              marginBottom: 8,
            }}
            placeholder="Digite a data assim: 01012026 (vira 01/01/2026)"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={10}
            value={validade}
            onChangeText={handleChangeValidade}
          />

          {/* Quantidades */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.title,
              marginBottom: 4,
              marginTop: 12,
            }}
          >
            Quantidade em estoque
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.subtitle,
              marginBottom: 8,
            }}
          >
            Preencha pelo menos um dos campos abaixo. Você pode usar só
            unidades, só kg ou os dois.
          </Text>

          {/* Unidades */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: colors.title,
              marginBottom: 4,
            }}
          >
            Em unidades
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: "#0f172a",
              marginBottom: 8,
            }}
            placeholder="Ex.: 50 (50 unidades desse produto)"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={quantidadeUnidades}
            onChangeText={setQuantidadeUnidades}
          />

          {/* Kg */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: colors.title,
              marginBottom: 4,
              marginTop: 4,
            }}
          >
            Em kg
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: "#0f172a",
              marginBottom: 8,
            }}
            placeholder="Ex.: 12,5 (12,5 kg desse produto)"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={quantidadeKg}
            onChangeText={setQuantidadeKg}
          />

          {/* Descrição opcional */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.title,
              marginBottom: 4,
              marginTop: 12,
            }}
          >
            Observações{" "}
            <Text
              style={{
                color: colors.subtitle,
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              (opcional)
            </Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: "#0f172a",
              marginBottom: 16,
              minHeight: 60,
            }}
            placeholder="Anote qualquer detalhe importante sobre esse produto"
            placeholderTextColor="#94a3b8"
            multiline
            value={descricao}
            onChangeText={setDescricao}
          />

          <Button title="Salvar produto" onPress={salvarProduto} />
        </View>
      </View>
    </ScrollView>
  );
}