// app/(tabs)/relatorio.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useEstoque } from '../../context/estoqueStorage';
import { useAlertasEstoque } from '../../hooks/useAlertasEstoque';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiltroPeriodo } from '@/components/FiltroPeriodo'; // ✅ caminho correto

type TipoRelatorio = 'validade' | 'movimentacoes' | 'categorias';

export default function RelatorioScreen() {
  const { colors } = useTheme();
  const { produtos, movimentacoes } = useEstoque();
  const { produtosVencendo, produtosVencidos } = useAlertasEstoque();
  
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('validade');
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });

  // Filtrar movimentações por período
  const movimentacoesFiltradas = useMemo(() => {
    if (!periodo.inicio || !periodo.fim) return movimentacoes;
    
    return movimentacoes.filter(m => {
      const dataMov = new Date(m.data);
      const dataInicio = new Date(periodo.inicio);
      const dataFim = new Date(periodo.fim);
      return dataMov >= dataInicio && dataMov <= dataFim;
    });
  }, [movimentacoes, periodo]);

  // Agrupar movimentações por dia
  const movimentacoesPorDia = useMemo(() => {
    const grupos: Record<string, typeof movimentacoes> = {};
    
    movimentacoesFiltradas.forEach(mov => {
      const data = format(parseISO(mov.data), 'yyyy-MM-dd');
      if (!grupos[data]) grupos[data] = [];
      grupos[data].push(mov);
    });
    
    return Object.entries(grupos)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([data, lista]) => ({
        data,
        dataFormatada: format(parseISO(data), "dd 'de' MMMM", { locale: ptBR }),
        movimentacoes: lista,
        totalEntradas: lista.filter(m => m.tipo === 'retorno').length,
        totalSaidas: lista.filter(m => m.tipo === 'retirada').length,
      }));
  }, [movimentacoesFiltradas]);

  // Estatísticas por categoria
  const statsCategorias = useMemo(() => {
    const categorias: Record<string, { total: number; produtos: number }> = {};
    
    produtos.forEach(p => {
      if (!categorias[p.categoria]) {
        categorias[p.categoria] = { total: 0, produtos: 0 };
      }
      categorias[p.categoria].total += p.quantidade;
      categorias[p.categoria].produtos += 1;
    });
    
    return Object.entries(categorias)
      .map(([nome, dados]) => ({
        nome,
        ...dados
      }))
      .sort((a, b) => b.total - a.total);
  }, [produtos]);

  const handleCompartilhar = async () => {
    try {
      let mensagem = '📊 RELATÓRIO MEUESTOQUE\n\n';
      
      if (tipoRelatorio === 'validade') {
        mensagem += '📅 PRODUTOS A VENCER:\n';
        produtosVencendo.forEach(p => {
          const dias = (p as any).diasRestantes;
          mensagem += `• ${p.nome}: ${dias} dias (${p.validade ? format(parseISO(p.validade), 'dd/MM/yyyy') : 'data não definida'})\n`; // ✅ corrigido
        });
        
        mensagem += '\n❌ PRODUTOS VENCIDOS:\n';
        produtosVencidos.forEach(p => {
          mensagem += `• ${p.nome} (${p.validade ? format(parseISO(p.validade), 'dd/MM/yyyy') : 'data não definida'})\n`; // ✅ corrigido
        });
      } 
      else if (tipoRelatorio === 'movimentacoes') {
        mensagem += `📦 MOVIMENTAÇÕES (${periodo.inicio || 'TODAS'}):\n\n`;
        movimentacoesPorDia.forEach(dia => {
          mensagem += `${dia.dataFormatada}:\n`;
          mensagem += `   📤 Saídas: ${dia.totalSaidas}\n`;
          mensagem += `   📥 Entradas: ${dia.totalEntradas}\n`;
        });
      } 
      else {
        mensagem += '📁 PRODUTOS POR CATEGORIA:\n\n';
        statsCategorias.forEach(cat => {
          mensagem += `${cat.nome}:\n`;
          mensagem += `   📦 Produtos: ${cat.produtos}\n`;
          mensagem += `   📊 Total unidades: ${cat.total}\n\n`;
        });
      }
      
      await Share.share({
        message: mensagem,
        title: 'Relatório MeuEstoque',
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabAtiva: {
      backgroundColor: colors.icon,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    tabTextAtiva: {
      color: '#fff',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.title,
      marginBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemNome: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    itemValor: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.title,
    },
    itemAlerta: {
      color: '#ef4444',
      fontWeight: 'bold',
    },
    itemAviso: {
      color: '#f59e0b',
      fontWeight: 'bold',
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.subtitle,
      textAlign: 'center',
    },
    shareButton: {
      backgroundColor: colors.icon,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    shareButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    estatisticaContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
    },
    estatisticaItem: {
      alignItems: 'center',
    },
    estatisticaValor: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.title,
    },
    estatisticaLabel: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 4,
    },
  });

  const renderValidade = () => (
    <View>
      {/* Produtos Vencendo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 A VENCER (7 DIAS)</Text>
        {produtosVencendo.length === 0 ? (
          <Text style={{ color: colors.subtitle, textAlign: 'center' }}>
            Nenhum produto próximo do vencimento
          </Text>
        ) : (
          produtosVencendo.map((p, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemNome}>{p.nome}</Text>
              <Text style={[styles.itemValor, styles.itemAviso]}>
                {(p as any).diasRestantes} dias
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Produtos Vencidos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>❌ VENCIDOS</Text>
        {produtosVencidos.length === 0 ? (
          <Text style={{ color: colors.subtitle, textAlign: 'center' }}>
            Nenhum produto vencido
          </Text>
        ) : (
          produtosVencidos.map((p, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemNome}>{p.nome}</Text>
              <Text style={[styles.itemValor, styles.itemAlerta]}>
                {(p as any).diasAtraso} dias atrasado
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Estatísticas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 RESUMO</Text>
        <View style={styles.estatisticaContainer}>
          <View style={styles.estatisticaItem}>
            <Text style={styles.estatisticaValor}>{produtos.length}</Text>
            <Text style={styles.estatisticaLabel}>Total</Text>
          </View>
          <View style={styles.estatisticaItem}>
            <Text style={[styles.estatisticaValor, { color: '#f59e0b' }]}>
              {produtosVencendo.length}
            </Text>
            <Text style={styles.estatisticaLabel}>A vencer</Text>
          </View>
          <View style={styles.estatisticaItem}>
            <Text style={[styles.estatisticaValor, { color: '#ef4444' }]}>
              {produtosVencidos.length}
            </Text>
            <Text style={styles.estatisticaLabel}>Vencidos</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMovimentacoes = () => (
    <View>
      <FiltroPeriodo onFiltrar={setPeriodo} />
      
      {movimentacoesPorDia.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>
            Nenhuma movimentação no período selecionado
          </Text>
        </View>
      ) : (
        movimentacoesPorDia.map((dia, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{dia.dataFormatada}</Text>
            
            {dia.movimentacoes.map((mov, i) => {
              const produto = produtos.find(p => p.id === mov.produtoId);
              return (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemNome}>
                    {mov.tipo === 'retirada' ? '📤' : '📥'} {produto?.nome || 'Produto'}
                  </Text>
                  <Text style={[
                    styles.itemValor,
                    mov.tipo === 'retirada' ? styles.itemAlerta : styles.itemAviso
                  ]}>
                    {mov.quantidadeUnidades || mov.quantidadeKg || 0}
                    {mov.quantidadeUnidades ? ' un' : ' kg'}
                  </Text>
                </View>
              );
            })}
            
            <View style={styles.estatisticaContainer}>
              <Text style={{ color: '#22c55e' }}>↑ {dia.totalEntradas}</Text>
              <Text style={{ color: '#ef4444' }}>↓ {dia.totalSaidas}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderCategorias = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📁 PRODUTOS POR CATEGORIA</Text>
      
      {statsCategorias.map((cat, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemNome}>{cat.nome}</Text>
          <View>
            <Text style={styles.itemValor}>{cat.produtos} produtos</Text>
            <Text style={[styles.itemValor, { fontSize: 12 }]}>
              {cat.total} unidades
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatórios</Text>
          <Text style={styles.subtitle}>
            Análise completa do seu estoque
          </Text>
        </View>

        {/* Abas */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tipoRelatorio === 'validade' && styles.tabAtiva]}
            onPress={() => setTipoRelatorio('validade')}
          >
            <Text style={[styles.tabText, tipoRelatorio === 'validade' && styles.tabTextAtiva]}>
              📅 Validade
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tipoRelatorio === 'movimentacoes' && styles.tabAtiva]}
            onPress={() => setTipoRelatorio('movimentacoes')}
          >
            <Text style={[styles.tabText, tipoRelatorio === 'movimentacoes' && styles.tabTextAtiva]}>
              🔄 Movimentações
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tipoRelatorio === 'categorias' && styles.tabAtiva]}
            onPress={() => setTipoRelatorio('categorias')}
          >
            <Text style={[styles.tabText, tipoRelatorio === 'categorias' && styles.tabTextAtiva]}>
              📁 Categorias
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo */}
        {tipoRelatorio === 'validade' && renderValidade()}
        {tipoRelatorio === 'movimentacoes' && renderMovimentacoes()}
        {tipoRelatorio === 'categorias' && renderCategorias()}

        {/* Botão Compartilhar */}
        <TouchableOpacity style={styles.shareButton} onPress={handleCompartilhar}>
          <Text style={styles.shareButtonText}>📤 Compartilhar Relatório</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}