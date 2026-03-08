// app/(tabs)/cadastro.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useEstoque } from '../context/estoqueStorage';
import { useTheme } from '../context/ThemeContext';
import type { Produto } from '@/types/produto';

export default function CadastroProduto() {
  const { colors } = useTheme();
  const { adicionarProduto } = useEstoque();
  
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [validade, setValidade] = useState('');
  
  const [tipoControle, setTipoControle] = useState<'unidade' | 'kg' | 'ambos'>('unidade');
  const [quantidadeUnidades, setQuantidadeUnidades] = useState('');
  const [quantidadeKg, setQuantidadeKg] = useState('');
  const [minimo, setMinimo] = useState('');

  async function salvarProduto() {
    // Validações
   if (!nome.trim() || !categoria.trim()) {
  Alert.alert('Erro', 'Preencha nome e categoria');
  return;
}

if (nome.trim().length < 2) {
  Alert.alert('Erro', 'Nome do produto muito curto');
  return;
}

    if (!validade) {
      Alert.alert('Erro', 'Preencha a validade do produto');
      return;
    }

    if (tipoControle === 'unidade' && !quantidadeUnidades) {
      Alert.alert('Erro', 'Preencha a quantidade em unidades');
      return;
    }
    if (tipoControle === 'kg' && !quantidadeKg) {
      Alert.alert('Erro', 'Preencha a quantidade em kg');
      return;
    }
    if (tipoControle === 'ambos' && (!quantidadeUnidades || !quantidadeKg)) {
      Alert.alert('Erro', 'Preencha quantidade em unidades e kg');
      return;
    }

    // validar números
if (quantidadeUnidades && (!/^\d+$/.test(quantidadeUnidades) || Number(quantidadeUnidades) < 0)) {
  Alert.alert('Erro', 'Quantidade em unidades inválida');
  return;
}

if (quantidadeKg && (!/^\d*\.?\d+$/.test(quantidadeKg) || Number(quantidadeKg) < 0)) {
  Alert.alert('Erro', 'Quantidade em kg inválida');
  return;
}

if (minimo && (!/^\d+$/.test(minimo) || Number(minimo) < 0)) {
  Alert.alert('Erro', 'Estoque mínimo inválido');
  return;
}

    const novoProduto: Produto = {
  id: Date.now().toString(),
  nome: nome.trim(),
  categoria: categoria.trim(),
  descricao: descricao.trim() || undefined,
  validade,
  minimo: minimo ? Number(minimo) : 0,
  quantidade: 0,
};

    if (tipoControle === 'unidade') {
      novoProduto.quantidade = Number(quantidadeUnidades);
      novoProduto.tipoControle = 'unidade';
    } 
    else if (tipoControle === 'kg') {
      novoProduto.quantidade = 0;
      novoProduto.quantidadeKg = Number(quantidadeKg);
      novoProduto.tipoControle = 'kg';
    }
    else if (tipoControle === 'ambos') {
      novoProduto.quantidade = Number(quantidadeUnidades);
      novoProduto.quantidadeKg = Number(quantidadeKg);
      novoProduto.tipoControle = 'ambos';
    }

    try {
      await adicionarProduto(novoProduto);
      Alert.alert('Sucesso', `${nome} cadastrado com sucesso!`);
      
      // Limpar campos
      setNome('');
      setCategoria('');
      setDescricao('');
      setValidade('');
      setTipoControle('unidade');
      setQuantidadeUnidades('');
      setQuantidadeKg('');
      setMinimo('');
    } catch (error: any) {
  Alert.alert('Erro', error.message || 'Não foi possível salvar');
}
  }

  // Função para máscara de data
  const formatarData = (texto: string) => {
    const limpo = texto.replace(/[^\d]/g, '');
    if (limpo.length <= 4) {
      return limpo;
    } else if (limpo.length <= 6) {
      return limpo.replace(/^(\d{4})(\d{2})/, '$1-$2');
    } else {
      return limpo.replace(/^(\d{4})(\d{2})(\d{2})/, '$1-$2-$3').substring(0, 10);
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
    required: {
      color: '#ef4444',
    },
    optional: {
      color: colors.subtitle,
      fontSize: 12,
      fontStyle: 'italic',
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
    pickerContainer: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
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
    infoText: {
      fontSize: 12,
      color: colors.subtitle,
      fontStyle: 'italic',
      marginBottom: 8,
      marginLeft: 4,
    },
    button: {
      backgroundColor: colors.icon,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📦 Cadastrar Produto</Text>
          <Text style={styles.subtitle}>Preencha os dados do novo produto</Text>
        </View>

        <View style={styles.card}>
          {/* Nome */}
          <Text style={styles.label}>
            Nome <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Arroz Tio João"
            placeholderTextColor={colors.subtitle}
            value={nome}
            onChangeText={setNome}
          />

          {/* Categoria */}
          <Text style={styles.label}>
            Categoria <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Alimentos, Carnes, Bebidas..."
            placeholderTextColor={colors.subtitle}
            value={categoria}
            onChangeText={setCategoria}
          />

          {/* Tipo de Controle */}
          <Text style={styles.label}>
            Tipo <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoControle}
              onValueChange={(value) => setTipoControle(value)}
              style={{ color: '#0f172a' }}
            >
              <Picker.Item label="Apenas Unidades" value="unidade" />
              <Picker.Item label="Apenas KG" value="kg" />
              <Picker.Item label="Ambos (Unidades + KG)" value="ambos" />
            </Picker>
          </View>

          {/* Campo Unidades */}
          {(tipoControle === 'unidade' || tipoControle === 'ambos') && (
            <>
              <Text style={styles.label}>
                Quantidade (unidades) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Ex.: 50"
                  placeholderTextColor={colors.subtitle}
                  keyboardType="numeric"
                  value={quantidadeUnidades}
                  onChangeText={setQuantidadeUnidades}
                />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>un</Text>
                </View>
              </View>
            </>
          )}

          {/* Campo KG */}
          {(tipoControle === 'kg' || tipoControle === 'ambos') && (
            <>
              <Text style={styles.label}>
                Quantidade (kg) {tipoControle === 'kg' && <Text style={styles.required}>*</Text>}
                {tipoControle === 'ambos' && <Text style={styles.optional}> (opcional)</Text>}
              </Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder={tipoControle === 'kg' ? "Ex.: 15.5" : "Ex.: 15.5"}
                  placeholderTextColor={colors.subtitle}
                  keyboardType="numeric"
                  value={quantidadeKg}
                  onChangeText={setQuantidadeKg}
                />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>kg</Text>
                </View>
              </View>
            </>
          )}

          {/* Validade */}
          <Text style={styles.label}>
            Validade <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.subtitle}
            value={validade}
            onChangeText={(text) => setValidade(formatarData(text))}
            maxLength={10}
            keyboardType="numeric"
          />

          {/* Estoque Mínimo */}
          <Text style={styles.label}>
            Estoque mínimo <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputFlex}
              placeholder={tipoControle === 'kg' ? "Ex.: 5" : "Ex.: 10"}
              placeholderTextColor={colors.subtitle}
              keyboardType="numeric"
              value={minimo}
              onChangeText={setMinimo}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {tipoControle === 'kg' ? 'kg' : 'un'}
              </Text>
            </View>
          </View>

          {/* Descrição */}
          <Text style={styles.label}>
            Descrição <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Descrição do produto..."
            placeholderTextColor={colors.subtitle}
            multiline
            numberOfLines={3}
            value={descricao}
            onChangeText={setDescricao}
          />

          <TouchableOpacity style={styles.button} onPress={salvarProduto}>
            <Text style={styles.buttonText}>Salvar Produto</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}