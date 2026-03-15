// app/(tabs)/estoque.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { useAlertasEstoque } from '../../hooks/useAlertasEstoque';
import { Produto } from '../../types/produto';

export default function EstoqueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { produtos, removerProduto } = useEstoque();
  const { 
    produtosAbaixoDoMinimo, 
    produtosVencendo, 
    produtosVencidos,
    totalAlertas 
  } = useAlertasEstoque();
  
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'alertas'>('todos');

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
      lista = lista.filter(p => 
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase())
      );
    }
    
    // Filtro por alertas
    if (filtro === 'alertas') {
      const idsAlertas = [
        ...produtosAbaixoDoMinimo.map(p => p.id),
        ...produtosVencendo.map(p => p.id),
        ...produtosVencidos.map(p => p.id)
      ];
      lista = lista.filter(p => idsAlertas.includes(p.id));
    }
    
    return lista;
  }, [produtos, busca, filtro, produtosAbaixoDoMinimo, produtosVencendo, produtosVencidos]);

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
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o produto');
            }
          }
        }
      ]
    );
  };

  const getStatusProduto = (produto: Produto) => {
    const estaAbaixoMinimo = produtosAbaixoDoMinimo.some(p => p.id === produto.id);
    const estaVencendo = produtosVencendo.some(p => p.id === produto.id);
    const estaVencido = produtosVencidos.some(p => p.id === produto.id);
    
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
    },
  });

  if (produtosFiltrados.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>
          {busca || filtro === 'alertas' 
            ? 'Nenhum produto encontrado com os filtros aplicados'
            : 'Nenhum produto cadastrado'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          placeholder="Buscar produto..."
          placeholderTextColor={colors.subtitle}
          value={busca}
          onChangeText={setBusca}
        />
        <TouchableOpacity
          style={[styles.filterButton, filtro === 'alertas' && styles.filterButtonAtivo]}
          onPress={() => setFiltro(filtro === 'alertas' ? 'todos' : 'alertas')}
        >
          <Text style={[styles.filterText, filtro === 'alertas' && styles.filterTextAtivo]}>
            ⚠️ Alertas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderProduto}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}