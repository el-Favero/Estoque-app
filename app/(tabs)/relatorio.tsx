// app/(tabs)/historico.tsx
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CardMes from '../../components/historico/CardMes';
import GraficoSemanal from '../../components/historico/GraficoSemanal';
import { processarDadosHistorico } from '../../utils/histoticoUtils';
import { useEstoque } from '../context/estoqueStorage';
import { useTheme } from '../context/ThemeContext';



export default function Historico() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { movimentacoes, produtos } = useEstoque();
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [modo, setModo] = useState<'mensal' | 'grafico'>('mensal');

  // Processa os dados brutos para o formato do histórico
  const dadosMensais = useMemo(() => {
    return processarDadosHistorico(movimentacoes, produtos);
  }, [movimentacoes, produtos]);

 

  if (!dadosMensais.length) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyText}>
         Nenhuma movimentação registrada ainda.

Adicione entradas ou saídas para visualizar o histórico.{'\n'}
          As movimentações aparecerão aqui automaticamente.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Histórico</Text>
        
        {/* Alternância entre modos */}
        <View style={styles.modoContainer}>
          <TouchableOpacity
            style={[styles.modoButton, modo === 'mensal' && styles.modoButtonAtivo]}
            onPress={() => setModo('mensal')}
          >
            <Text style={[styles.modoText, modo === 'mensal' && styles.modoTextAtivo]}>
              Visão Mensal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modoButton, modo === 'grafico' && styles.modoButtonAtivo]}
            onPress={() => setModo('grafico')}
          >
            <Text style={[styles.modoText, modo === 'grafico' && styles.modoTextAtivo]}>
              Gráficos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {modo === 'mensal' ? (
          // VISÃO MENSAL
          dadosMensais.map((mes) => (
            <CardMes
              key={`${mes.mes}-${mes.ano}`}
              mes={mes}
              expanded={mesSelecionado === `${mes.mes}-${mes.ano}`}
              onToggle={() => setMesSelecionado(
                mesSelecionado === `${mes.mes}-${mes.ano}` ? null : `${mes.mes}-${mes.ano}`
              )}
            />
          ))
        ) : (
          // VISÃO GRÁFICA
          dadosMensais.map((mes) => (
            <GraficoSemanal key={`${mes.mes}-${mes.ano}`} mes={mes} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.title,
      marginBottom: 16,
      textAlign: 'center',
    },
    modoContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 30,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    modoButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 26,
      alignItems: 'center',
    },
    modoButtonAtivo: {
      backgroundColor: colors.icon,
    },
    modoText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modoTextAtivo: {
      color: '#fff',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 30,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.subtitle,
      textAlign: 'center',
      marginTop: 20,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
  });
}