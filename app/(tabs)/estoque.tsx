// app/(tabs)/estoque.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { useAlertasEstoque } from '../../hooks/useAlertasEstoque';
import { Produto } from '../../types/produto';
import { FEEDBACK } from '../../constants/feedbackMessages';
import { toast } from '../../utils/toast';

export default function EstoqueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ busca?: string | string[] }>();
  const buscaParam = Array.isArray(params.busca) ? params.busca[0] : params.busca;

  const { colors } = useTheme();
  const {
    produtos,
    removerProduto,
    produtosLoading,
    carregarProdutos,
    carregarMovimentacoes,
  } = useEstoque();
  const alertasHook = useAlertasEstoque();
  const alertasValidade = (alertasHook.alertasValidade || []);
  const alertasEstoque = (alertasHook.alertasEstoqueMinimo || []);
  const totalAlertas = alertasHook.totalAlertas || 0;
  
  // Helper to check if product is in alerts - with null checks
  const isProdutoAbaixo = (id: string) => {
    if (!id || !alertasEstoque.length) return false;
    return alertasEstoque.some(a => a && a.produto?.id === id);
  };
  const isProdutoVencendo = (id: string) => {
    if (!id || !alertasValidade.length) return false;
    return alertasValidade.some(a => a && a.produto?.id === id && a.gravidade !== 'alta');
  };
  const isProdutoVencido = (id: string) => {
    if (!id || !alertasValidade.length) return false;
    return alertasValidade.some(a => a && a.produto?.id === id && a.gravidade === 'alta');
  };
  
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'alertas'>('todos');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (buscaParam) setBusca(buscaParam);
  }, [buscaParam]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        carregarProdutos({ showLoading: false }),
        carregarMovimentacoes({ showLoading: false }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [carregarProdutos, carregarMovimentacoes]);

  // Função para calcular dias restantes
  const calcularDiasRestantes = (validade: string): number => {
    if (!validade) return 999;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataValidade = new Date(validade);
    dataValidade.setHours(0, 0, 0, 0);
    
    const diffTime = dataValidade.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    let lista = produtos;
    
    // Filtro por busca
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q))
      );
    }
    
    // Filtro por alertas
    if (filtro === 'alertas') {
      const idsAlertas: string[] = [];
      // Add IDs from estoque alerts
      alertasEstoque.forEach(a => {
        if (a && a.produto?.id) idsAlertas.push(a.produto.id);
      });
      // Add IDs from validity alerts (vencendo and vencidos)
      alertasValidade.forEach(a => {
        if (a && a.produto?.id && !idsAlertas.includes(a.produto.id)) {
          idsAlertas.push(a.produto.id);
        }
      });
      lista = lista.filter(p => p && idsAlertas.includes(p.id));
    }
    
    return lista;
  }, [produtos, busca, filtro, alertasEstoque, alertasValidade]);

  const handleDelete = (produto: Produto) => {
    Alert.alert(
      'Excluir Produto',
      `Tem certeza que deseja excluir ${produto.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerProduto(produto.id);
            } catch {
              toast.error(FEEDBACK.error.excluirProduto);
            }
          }
        }
      ]
    );
  };

  const getStatusProduto = (produto: Produto) => {
    const estaAbaixoMinimo = isProdutoAbaixo(produto.id);
    const estaVencendo = isProdutoVencendo(produto.id);
    const estaVencido = isProdutoVencido(produto.id);
    
    if (estaVencido) return 'vencido';
    if (estaVencendo) return 'vencendo';
    if (estaAbaixoMinimo) return 'baixo';
    return 'normal';
  };

  const renderProduto = ({ item }: { item: Produto }) => {
    const status = getStatusProduto(item);
    
    let statusColor = colors.border;
    let statusText = '';
    
    if (status === 'vencido') {
      statusColor = '#ef4444';
      statusText = '⚠️ VENCIDO';
    } else if (status === 'vencendo') {
      statusColor = '#f59e0b';
      statusText = '⚠️ Vence logo';
    } else if (status === 'baixo') {
      statusColor = '#eab308';
      statusText = '⚠️ Estoque baixo';
    }

    // Calcular total de lotes e quantidade
    const totalLotes = item.lotes?.length || 0;
    const lotesProximos = item.lotes?.filter(l => {
      const dias = calcularDiasRestantes(l.validade);
      return dias <= 7 && dias >= 0;
    }).length || 0;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nome, { color: colors.title }]}>{item.nome}</Text>
            <Text style={[styles.categoria, { color: colors.subtitle }]}>{item.categoria}</Text>
          </View>
          {status !== 'normal' && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.subtitle }]}>Unidades:</Text>
            <Text style={[styles.infoValue, { color: colors.title }]}>{item.quantidade}</Text>
          </View>
          
          {item.quantidadeKg ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtitle }]}>Peso:</Text>
              <Text style={[styles.infoValue, { color: colors.title }]}>{item.quantidadeKg} kg</Text>
            </View>
          ) : null}
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.subtitle }]}>Validade:</Text>
            <Text style={[styles.infoValue, { color: colors.title }]}>
              {item.validade 
                ? new Date(item.validade).toLocaleDateString('pt-BR') 
                : 'Não definida'}
            </Text>
          </View>

          {/* Seção de lotes */}
          {totalLotes > 0 && (
            <View style={styles.lotesSection}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtitle }]}>Total de lotes:</Text>
                <Text style={[styles.infoValue, { color: colors.title }]}>{totalLotes}</Text>
              </View>
              
              {lotesProximos > 0 && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.subtitle }]}>Lotes a vencer:</Text>
                  <Text style={[styles.infoValue, { color: '#f59e0b', fontWeight: 'bold' }]}>
                    {lotesProximos}
                  </Text>
                </View>
              )}

              {/* Botão para ver detalhes dos lotes */}
              <TouchableOpacity 
                style={styles.verLotesButton}
                onPress={() => {
                  Alert.alert(
                    'Lotes do Produto',
                    item.lotes?.map(l => 
                      `📅 ${new Date(l.validade).toLocaleDateString('pt-BR')}: ${
                        l.quantidadeUnidades ? `${l.quantidadeUnidades} un` : ''
                      } ${
                        l.quantidadeKg ? `${l.quantidadeKg} kg` : ''
                      }`
                    ).join('\n\n')
                  );
                }}
              >
                <Text style={styles.verLotesText}>Ver detalhes dos lotes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.editButton]}
            onPress={() => router.push(`/editar-produto?id=${item.id}`)}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.buttonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
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
    searchContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
      alignItems: 'center',
    },
    scanButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      justifyContent: 'center',
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
    },
    filterButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    filterButtonAtivo: {
      backgroundColor: colors.icon,
      borderColor: colors.icon,
    },
    filterText: {
      color: colors.text,
      fontWeight: '500',
    },
    filterTextAtivo: {
      color: '#fff',
    },
    list: {
      padding: 16,
    },
    card: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    nome: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    categoria: {
      fontSize: 14,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    infoContainer: {
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    infoLabel: {
      fontSize: 14,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
    },
    lotesSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    verLotesButton: {
      marginTop: 8,
      padding: 8,
      backgroundColor: colors.background,
      borderRadius: 6,
      alignItems: 'center',
    },
    verLotesText: {
      color: colors.icon,
      fontSize: 12,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: colors.icon,
    },
    deleteButton: {
      backgroundColor: '#ef4444',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
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
      marginBottom: 8,
    },
    emptyHint: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: 'center',
      opacity: 0.9,
    },
    emptyCta: {
      marginTop: 20,
      backgroundColor: colors.icon,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    emptyCtaText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: colors.subtitle,
    },
  });

  if (produtosLoading && produtos.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <ActivityIndicator size="large" color={colors.icon} />
        <Text style={styles.loadingText}>Carregando produtos…</Text>
      </View>
    );
  }

  const listaVaziaPorFiltro =
    produtos.length > 0 && produtosFiltrados.length === 0;

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Estoque</Text>
        <Text style={styles.subtitle}>
          {totalAlertas > 0
            ? `⚠️ ${totalAlertas} alerta(s) ativo(s)`
            : 'Todos os produtos estão OK'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto ou código..."
          placeholderTextColor={colors.subtitle}
          value={busca}
          onChangeText={setBusca}
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/escanear')}
          accessibilityLabel="Escanear código de barras"
        >
          <Text style={{ fontSize: 20 }}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filtro === 'alertas' && styles.filterButtonAtivo]}
          onPress={() => setFiltro(filtro === 'alertas' ? 'todos' : 'alertas')}
        >
          <Text style={[styles.filterText, filtro === 'alertas' && styles.filterTextAtivo]}>
            ⚠️ Alertas
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const listEmpty = (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyText}>
        {listaVaziaPorFiltro
          ? 'Nenhum produto encontrado com os filtros aplicados'
          : 'Nenhum produto cadastrado ainda'}
      </Text>
      {listaVaziaPorFiltro ? (
        <Text style={styles.emptyHint}>
          Ajuste a busca ou toque em &quot;Alertas&quot; para ver todos.
        </Text>
      ) : (
        <>
          <Text style={styles.emptyHint}>
            Cadastre o primeiro item para começar a controlar o estoque.
          </Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={() => router.push('/cadastro')}
          >
            <Text style={styles.emptyCtaText}>Adicionar produto</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderProduto}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[
          styles.list,
          produtosFiltrados.length === 0 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.icon]}
            tintColor={colors.icon}
          />
        }
      />
    </View>
  );
}