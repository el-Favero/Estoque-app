import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEstoque } from "../../context/estoqueStorage";
import { useTheme } from "../../context/ThemeContext";
import { formatarDataInput } from "../../utils/validadeUtils";
import { FEEDBACK } from "../../constants/feedbackMessages";
import { toast } from "../../utils/toast";

// Componente de Input moderno
function ModernInput({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  required = false,
  icon,
  multiline = false,
  onIconPress,
  maxLength,
}: { 
  label: string; 
  value: string; 
  onChangeText: (text: string) => void; 
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
  required?: boolean;
  icon?: string;
  multiline?: boolean;
  onIconPress?: () => void;
  maxLength?: number;
}) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {required && <Text style={styles.required}>*obrigatório</Text>}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
        {icon && (
          <TouchableOpacity style={styles.inputIcon} onPress={onIconPress}>
            <Ionicons name={icon as any} size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Componente de Toggle para tipo de quantidade
function QuantityToggle({ 
  label, 
  value, 
  onChangeText, 
  unit,
  placeholder,
}: { 
  label: string; 
  value: string; 
  onChangeText: (text: string) => void; 
  unit: string;
  placeholder: string;
}) {
  return (
    <View style={styles.quantityBlock}>
      <Text style={styles.quantityLabel}>{label}</Text>
      <View style={styles.quantityInputContainer}>
        <TextInput
          style={styles.quantityInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="numeric"
        />
        <View style={styles.quantityUnit}>
          <Text style={styles.quantityUnitText}>{unit}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CadastroProduto() {
  const router = useRouter();
  const params = useLocalSearchParams<{ codigoBarras?: string | string[] }>();
  const codigoParam = Array.isArray(params.codigoBarras) ? params.codigoBarras[0] : params.codigoBarras;

  const { colors } = useTheme();
  const { cadastrarProdutoComLote } = useEstoque();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidadeUnidades, setQuantidadeUnidades] = useState("");
  const [quantidadeKg, setQuantidadeKg] = useState("");
  const [descricao, setDescricao] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (codigoParam) setCodigoBarras(codigoParam);
  }, [codigoParam]);

  const handleChangeValidade = (text: string) => {
    setValidade(formatarDataInput(text));
  };

  async function salvarProduto() {
    if (!nome.trim() || !categoria.trim() || !validade.trim()) {
      Alert.alert("Ops!", "Preencha os campos obrigatórios");
      return;
    }

    const unidades = Number(quantidadeUnidades.replace(",", ".")) || 0;
    const kg = Number(quantidadeKg.replace(",", ".")) || 0;

    if (unidades <= 0 && kg <= 0) {
      Alert.alert("Ops!", "Informe a quantidade (unidades ou kg)");
      return;
    }

    setSalvando(true);
    try {
      await cadastrarProdutoComLote({
        nome: nome.trim(),
        categoria: categoria.trim(),
        descricao: descricao.trim() || undefined,
        validade,
        quantidadeUnidades: unidades,
        quantidadeKg: kg > 0 ? kg : undefined,
        codigoBarras: codigoBarras.trim() || undefined,
      });
      toast.success("Produto cadastrado com sucesso!");
      
      setNome("");
      setCategoria("");
      setValidade("");
      setQuantidadeUnidades("");
      setQuantidadeKg("");
      setDescricao("");
      setCodigoBarras("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      toast.error(msg || "Erro ao cadastrar produto");
    } finally {
      setSalvando(false);
    }
  }

  const temAlgumCampo = nome || categoria || validade || quantidadeUnidades || quantidadeKg || descricao || codigoBarras;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Novo Produto</Text>
          <Text style={styles.subtitle}>Preencha os dados para cadastrar</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Nome */}
          <ModernInput
            label="Nome do produto"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Fubá, Frango, Óleo..."
            required
            icon="cube-outline"
          />

          {/* Categoria */}
          <ModernInput
            label="Categoria"
            value={categoria}
            onChangeText={setCategoria}
            placeholder="Ex.: Grãos, Carnes, Limpeza..."
            required
            icon="pricetag-outline"
          />

          {/* Código de Barras */}
          <View style={styles.codeRow}>
            <View style={styles.codeInputWrapper}>
              <ModernInput
                label="Código de barras"
                value={codigoBarras}
                onChangeText={setCodigoBarras}
                placeholder="EAN / código do produto"
                icon="barcode-outline"
              />
            </View>
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={() => router.push('/escanear')}
            >
              <Ionicons name="camera-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Validade */}
          <ModernInput
            label="Data de validade"
            value={validade}
            onChangeText={handleChangeValidade}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            required
            maxLength={10}
            icon="calendar-outline"
          />

          {/* Quantidades */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantidade em estoque</Text>
            <Text style={styles.sectionHint}>Preencha ao menos um dos campos</Text>
            
            <View style={styles.quantityGrid}>
              <QuantityToggle
                label="Unidades"
                value={quantidadeUnidades}
                onChangeText={setQuantidadeUnidades}
                unit="un"
                placeholder="0"
              />
              <QuantityToggle
                label="Peso (kg)"
                value={quantidadeKg}
                onChangeText={setQuantidadeKg}
                unit="kg"
                placeholder="0"
              />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Observações</Text>
              <Text style={styles.optional}>opcional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Anote detalhes importantes..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Botão salvar */}
          <Pressable
            onPress={salvarProduto}
            disabled={salvando}
            style={({ pressed }) => [
              styles.submitButton,
              salvando && styles.submitButtonDisabled,
              pressed && !salvando && styles.submitButtonPressed,
            ]}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Salvar produto</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Dica */}
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={18} color="rgba(255,255,255,0.4)" />
          <Text style={styles.tipText}>Campos com * são obrigatórios</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1420' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  
  formCard: { 
    backgroundColor: '#1A2332', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)',
  },
  
  inputGroup: { marginBottom: 20 },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  required: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  optional: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  
  inputContainer: { position: 'relative' },
  input: { 
    backgroundColor: '#0B1420', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 14, 
    color: '#fff',
    fontSize: 15,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
  inputIcon: { 
    position: 'absolute', 
    right: 14, 
    top: 14, 
    width: 24, 
    height: 24, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  codeInputWrapper: { flex: 1 },
  scanButton: { 
    width: 52, 
    height: 52, 
    backgroundColor: '#378ADD', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 24,
  },
  
  quantitySection: { marginBottom: 24, paddingTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  sectionHint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  
  quantityGrid: { flexDirection: 'row', gap: 12 },
  quantityBlock: { flex: 1 },
  quantityLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  quantityInputContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityInput: { 
    flex: 1,
    backgroundColor: '#0B1420', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityUnit: { 
    position: 'absolute', 
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  quantityUnitText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  
  submitButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    backgroundColor: '#378ADD', 
    borderRadius: 14, 
    paddingVertical: 16,
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: 'rgba(55,138,221,0.5)' },
  submitButtonPressed: { backgroundColor: '#2d6cb5' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, justifyContent: 'center' },
  tipText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});