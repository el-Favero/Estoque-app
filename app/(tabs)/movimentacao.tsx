// app/(tabs)/movimentacao.tsx
import React, { useMemo, useState } from 'react';
import { MovimentacaoInput } from '../../services/movimentacao/types'; 
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';

export default function Movimentacao() {
  const { colors } = useTheme();
  const { produtos, registrarMovimentacao } = useEstoque();
  
  const [tipo, setTipo] = useState<'retirada' | 'retorno'>('retirada');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [quantidadeUnidades, setQuantidadeUnidades] = useState('');
  const [quantidadeKg, setQuantidadeKg] = useState('');
  const [finalidade, setFinalidade] = useState('');

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto.trim()) return produtos;
    return produtos.filter(p => 
      p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      (p.categoria || '').toLowerCase().includes(buscaProduto.toLowerCase())
    );
  }, [produtos, buscaProduto]);

  const handleSelecionarProduto = (produto: any) => {
    setProdutoSelecionado(produto);
    setBuscaProduto(produto.nome);
    setModalVisible(false);
    setQuantidadeUnidades('');
    setQuantidadeKg('');
  };

  const handleConfirmar = async () => {
  if (!produtoSelecionado) {
    Alert.alert('Erro', 'Selecione um produto');
    return;
  }

  const temUnidades = quantidadeUnidades.trim() !== '';
  const temKg = quantidadeKg.trim() !== '';

  if (!temUnidades && !temKg) {
    Alert.alert('Erro', 'Preencha pelo menos um campo: unidades ou kg');
    return;
  }

  if (temUnidades && (!/^\d+$/.test(quantidadeUnidades) || Number(quantidadeUnidades) <= 0)) {
    Alert.alert('Erro', 'Unidades deve ser um número inteiro positivo');
    return;
  }

  if (temKg && (!/^\d*\.?\d+$/.test(quantidadeKg) || Number(quantidadeKg) <= 0)) {
    Alert.alert('Erro', 'Kg deve ser um número positivo (ex: 1.5)');
    return;
  }

  if (tipo === 'retirada' && !finalidade.trim()) {
    Alert.alert('Erro', 'Informe a finalidade da retirada');
    return;
  }

  const unidades = Number(quantidadeUnidades || 0);
  const kg = Number(quantidadeKg || 0);

  // 🚨 Impedir retirada maior que o estoque
  if (tipo === 'retirada') {

    if (unidades > produtoSelecionado.quantidade) {
      Alert.alert(
        'Estoque insuficiente',
        `Disponível: ${produtoSelecionado.quantidade} unidades`
      );
      return;
    }

    if (produtoSelecionado.quantidadeKg && kg > produtoSelecionado.quantidadeKg) {
      Alert.alert(
        'Estoque insuficiente',
        `Disponível: ${produtoSelecionado.quantidadeKg} kg`
      );
      return;
    }
  }

  try {

    const movimentacaoData: any = {
      tipo,
      produtoId: produtoSelecionado.id,
      finalidade: tipo === 'retirada' ? finalidade : undefined,
    };

    if (temUnidades) movimentacaoData.quantidadeUnidades = unidades;
    if (temKg) movimentacaoData.quantidadeKg = kg;

    await registrarMovimentacao(movimentacaoData);

    Alert.alert('Sucesso', 'Movimentação registrada!');

    // 🔄 limpar formulário
    setQuantidadeUnidades('');
    setQuantidadeKg('');
    setFinalidade('');
    setProdutoSelecionado(null);
    setBuscaProduto('');

  } catch (error: any) {

    Alert.alert('Erro', error.message || 'Não foi possível registrar');

  }
};

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.title,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: 'center',
      marginTop: 4,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 30,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 26,
      alignItems: 'center',
    },
    toggleButtonAtivo: {
      backgroundColor: colors.icon,
    },
    toggleText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    toggleTextAtivo: {
      color: '#fff',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.title,
      marginBottom: 6,
      marginTop: 8,
    },
    input: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: '#0f172a',
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    inputFlex: {
      flex: 1,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: '#0f172a',
    },
    badge: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
    },
    badgeText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.title,
    },
    produtoInfo: {
      backgroundColor: '#f8fafc',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    produtoNome: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },
    produtoEstoque: {
      fontSize: 14,
      color: colors.subtitle,
      marginTop: 4,
    },
    button: {
      backgroundColor: colors.icon,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    buttonRetirada: {
      backgroundColor: '#ef4444',
    },
    buttonRetorno: {
      backgroundColor: '#22c55e',
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.title,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.subtitle,
    },
    produtoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    produtoItemNome: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    produtoItemInfo: {
      fontSize: 13,
      color: colors.subtitle,
      marginRight: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {tipo === 'retirada' ? '📤 Retirada' : '📥 Retorno'}
          </Text>
          <Text style={styles.subtitle}>
            Registre a saída ou entrada de produtos
          </Text>
        </View>

        {/* Alternância */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, tipo === 'retirada' && styles.toggleButtonAtivo]}
            onPress={() => setTipo('retirada')}
          >
            <Text style={[styles.toggleText, tipo === 'retirada' && styles.toggleTextAtivo]}>
              Retirada
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, tipo === 'retorno' && styles.toggleButtonAtivo]}
            onPress={() => setTipo('retorno')}
          >
            <Text style={[styles.toggleText, tipo === 'retorno' && styles.toggleTextAtivo]}>
              Retorno
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {/* Seleção de Produto */}
          <Text style={styles.label}>Produto *</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                style={styles.input}
                placeholder="Toque para buscar um produto..."
                placeholderTextColor="#94a3b8"
                value={buscaProduto}
                onChangeText={setBuscaProduto}
                onFocus={() => setModalVisible(true)}
              />
            </View>
          </TouchableOpacity>

          {/* Info do Produto Selecionado */}
          {produtoSelecionado && (
            <View style={styles.produtoInfo}>
              <Text style={styles.produtoNome}>{produtoSelecionado.nome}</Text>
              <Text style={styles.produtoEstoque}>
                Estoque: {produtoSelecionado.quantidade} un
                {produtoSelecionado.quantidadeKg ? ` / ${produtoSelecionado.quantidadeKg} kg` : ''}
              </Text>
            </View>
          )}

          {/* Unidades */}
          <Text style={styles.label}>Unidades (opcional)</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Ex.: 5"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={quantidadeUnidades}
              onChangeText={setQuantidadeUnidades}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>un</Text>
            </View>
          </View>

          {/* KG */}
          <Text style={[styles.label, { marginTop: 12 }]}>Peso (kg) - opcional</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Ex.: 2.5"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={quantidadeKg}
              onChangeText={setQuantidadeKg}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>kg</Text>
            </View>
          </View>

          <Text style={{ color: colors.subtitle, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Preencha pelo menos um dos campos acima
          </Text>

          {/* Finalidade (só para retirada) */}
          {tipo === 'retirada' && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>Finalidade *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Polenta, Doação, Venda..."
                placeholderTextColor="#94a3b8"
                value={finalidade}
                onChangeText={setFinalidade}
              />
            </>
          )}

          <TouchableOpacity 
            style={[
              styles.button, 
              tipo === 'retirada' ? styles.buttonRetirada : styles.buttonRetorno
            ]} 
            onPress={handleConfirmar}
          >
            <Text style={styles.buttonText}>
              {tipo === 'retirada' ? 'Confirmar Retirada' : 'Confirmar Retorno'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de busca */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Produto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Buscar produto..."
              placeholderTextColor="#94a3b8"
              value={buscaProduto}
              onChangeText={setBuscaProduto}
              autoFocus
            />

            <FlatList
              data={produtosFiltrados}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.produtoItem}
                  onPress={() => handleSelecionarProduto(item)}
                >
                  <Text style={styles.produtoItemNome}>{item.nome}</Text>
                  <Text style={styles.produtoItemInfo}>
                    {item.quantidade} un
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}