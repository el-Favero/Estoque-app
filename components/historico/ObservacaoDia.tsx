// components/historico/ObservacaoDia.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { useEstoque } from '../../app/context/estoqueStorage';

interface Props {
  data: string;
  observacao: string;
}

export default function ObservacaoDia({ data, observacao }: Props) {
  const { colors } = useTheme();
  const { salvarObservacao } = useEstoque();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(observacao);

  const handleSalvar = async () => {
    try {
      await salvarObservacao(data, texto);
      setEditando(false);
      Alert.alert('Sucesso', 'Observação salva!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar');
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    label: {
      fontSize: 12,
      color: colors.subtitle,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    texto: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic',
    },
    placeholder: {
      fontSize: 14,
      color: colors.subtitle,
      fontStyle: 'italic',
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: colors.text,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8,
    },
    button: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    buttonSalvar: {
      backgroundColor: colors.icon,
    },
    buttonCancelar: {
      backgroundColor: colors.border,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    buttonTextSalvar: {
      color: '#fff',
    },
    buttonTextCancelar: {
      color: colors.text,
    },
    editButton: {
      marginTop: 4,
      alignSelf: 'flex-start',
    },
    editButtonText: {
      fontSize: 12,
      color: colors.icon,
      fontWeight: '600',
    },
  });

  if (editando) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Observações do dia</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={3}
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite suas observações..."
          placeholderTextColor="#94a3b8"
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCancelar]}
            onPress={() => {
              setTexto(observacao);
              setEditando(false);
            }}
          >
            <Text style={[styles.buttonText, styles.buttonTextCancelar]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSalvar]}
            onPress={handleSalvar}
          >
            <Text style={[styles.buttonText, styles.buttonTextSalvar]}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Observações</Text>
      {observacao ? (
        <Text style={styles.texto}>"{observacao}"</Text>
      ) : (
        <Text style={styles.placeholder}>Nenhuma observação</Text>
      )}
      <TouchableOpacity style={styles.editButton} onPress={() => setEditando(true)}>
        <Text style={styles.editButtonText}>
          {observacao ? '✏️ Editar' : '➕ Adicionar observação'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}