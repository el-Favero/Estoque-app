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
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { useAlertasEstoque } from '../../hooks/useAlertasEstoque';
import { Produto } from '../../types/produto';
import { FEEDBACK } from '../../constants/feedbackMessages';
import { toast } from '../../utils/toast';

// Estilos definidos fora para evitar erro de referência
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1420' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  
  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10, alignItems: 'center' },
  searchInput: { 
    flex: 1, 
    backgroundColor: '#1A2332', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    color: '#fff',
    fontSize: 15,
  },
  scanButton: { 
    width: 48, 
    height: 48, 
    backgroundColor: '#1A2332', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  filterButton: { 
    paddingHorizontal: 14, 
    height: 48, 
    backgroundColor: '#1A2332', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  filterButtonAtivo: { backgroundColor: '#378ADD', borderColor: '#378ADD' },
  filterText: { color: 'rgba(255,255,255,0.7)', fontWeight: '500', fontSize: 13 },
  filterTextAtivo: { color: '#fff' },
  
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  
  card: { 
    backgroundColor: '#1A2332', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  produtoNome: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 2 },
  produtoCategoria: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIconContainer: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  
  lotesButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(55,138,221,0.1)', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.2)',
  },
  lotesButtonLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  lotesText: { color: '#378ADD', fontSize: 14, fontWeight: '500' },
  lotesAlert: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  lotesAlertText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  editButton: { backgroundColor: '#378ADD' },
  deleteButton: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  emptyCta: { marginTop: 20, backgroundColor: '#378ADD', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingText: { marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.5)' },
});

// Badge de status moderno
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; icon: string; label: string }> = {
    vencido: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: 'alert-circle', label: 'Vencido' },
    vencendo: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: 'warning', label: 'Vencendo' },
    baixo: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', icon: 'alert-circle-outline', label: 'Estoque baixo' },
  };
  
  const c = config[status];
  if (!c) return null;
  
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={12} color={c.color} />
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// Card de produto moderno
function ProdutoCard({ 
  produto, 
  status, 
  onEdit, 
  onDelete,
  onVerLotes,
  totalLotes,
  lotesProximos,
}: { 
  produto: Produto; 
  status: string;
  onEdit: () => void;
  onDelete: () => void;
  onVerLotes: () => void;
  totalLotes: number;
  lotesProximos: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.produtoNome}>{produto.nome}</Text>
          <Text style={styles.produtoCategoria}>{produto.categoria}</Text>
        </View>
        {status !== 'normal' && <StatusBadge status={status} />}
      </View>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="cube-outline" size={14} color="rgba(255,255,255,0.5)" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Unidades</Text>
            <Text style={styles.infoValue}>{produto.quantidade}</Text>
          </View>
        </View>
        
        {produto.quantidadeKg ? (
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="scale-outline" size={14} color="rgba(255,255,255,0.5)" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>{produto.quantidadeKg} kg</Text>
            </View>
          </View>
        ) : null}
        
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.5)" />
          </View>
          <View>
            <Text style={styles.infoLabel}>Validade</Text>
            <Text style={styles.infoValue}>
              {produto.validade 
                ? new Date(produto.validade).toLocaleDateString('pt-BR') 
                : 'Não definida'}
            </Text>
          </View>
        </View>
      </View>
      
      {totalLotes > 0 && (
        <Pressable style={styles.lotesButton} onPress={onVerLotes}>
          <View style={styles.lotesButtonLeft}>
            <Ionicons name="layers-outline" size={16} color="#378ADD" />
            <Text style={styles.lotesText}>{totalLotes} lote(s)</Text>
          </View>
          {lotesProximos > 0 && (
            <View style={styles.lotesAlert}>
              <Text style={styles.lotesAlertText}>{lotesProximos} próximos vencer</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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

  const calcularDiasRestantes = (validade: string): number => {
    if (!validade) return 999;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataValidade = new Date(validade);
    dataValidade.setHours(0, 0, 0, 0);
    return Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const produtosFiltrados = useMemo(() => {
    let lista = produtos;
    
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q))
      );
    }
    
    if (filtro === 'alertas') {
      const idsAlertas: string[] = [];
      alertasEstoque.forEach(a => { if (a && a.produto?.id) idsAlertas.push(a.produto.id); });
      alertasValidade.forEach(a => { if (a && a.produto?.id && !idsAlertas.includes(a.produto.id)) idsAlertas.push(a.produto.id); });
      lista = lista.filter(p => p && idsAlertas.includes(p.id));
    }
    
    return lista;
  }, [produtos, busca, filtro, alertasEstoque, alertasValidade]);

  const handleDelete = (produto: Produto) => {
    Alert.alert('Excluir Produto', `Tem certeza que deseja excluir ${produto.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try { await removerProduto(produto.id); }
        catch { toast.error(FEEDBACK.error.excluirProduto); }
      }}
    ]);
  };

  const getStatusProduto = (produto: Produto) => {
    if (isProdutoVencido(produto.id)) return 'vencido';
    if (isProdutoVencendo(produto.id)) return 'vencendo';
    if (isProdutoAbaixo(produto.id)) return 'baixo';
    return 'normal';
  };

  const renderProduto = ({ item }: { item: Produto }) => {
    const status = getStatusProduto(item);
    const totalLotes = item.lotes?.length || 0;
    const lotesProximos = item.lotes?.filter(l => {
      const dias = calcularDiasRestantes(l.validade);
      return dias <= 7 && dias >= 0;
    }).length || 0;

    return (
      <ProdutoCard
        produto={item}
        status={status}
        onEdit={() => router.push(`/editar-produto?id=${item.id}`)}
        onDelete={() => handleDelete(item)}
        onVerLotes={() => {
          Alert.alert(
            'Lotes do Produto',
            item.lotes?.map(l => 
              `${new Date(l.validade).toLocaleDateString('pt-BR')}: ${
                l.quantidadeUnidades ? `${l.quantidadeUnidades} un` : ''
              } ${
                l.quantidadeKg ? `${l.quantidadeKg} kg` : ''
              }`
            ).join('\n\n')
          );
        }}
        totalLotes={totalLotes}
        lotesProximos={lotesProximos}
      />
    );
  };

  if (produtosLoading && produtos.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <ActivityIndicator size="large" color="#378ADD" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  const listaVaziaPorFiltro = produtos.length > 0 && produtosFiltrados.length === 0;

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Estoque</Text>
        <Text style={styles.subtitle}>
          {totalAlertas > 0 ? `${totalAlertas} alerta(s) ativo(s)` : 'Todos os produtos OK'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto ou código..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={busca}
          onChangeText={setBusca}
        />
        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/escanear')}>
          <Ionicons name="barcode-outline" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filtro === 'alertas' && styles.filterButtonAtivo]}
          onPress={() => setFiltro(filtro === 'alertas' ? 'todos' : 'alertas')}
        >
          <Text style={[styles.filterText, filtro === 'alertas' && styles.filterTextAtivo]}>
            {filtro === 'alertas' ? '✓ Alertas' : 'Alertas'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const listEmpty = (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="rgba(255,255,255,0.15)" />
      <Text style={styles.emptyText}>
        {listaVaziaPorFiltro ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
      </Text>
      {listaVaziaPorFiltro ? (
        <Text style={styles.emptyHint}>Ajuste a busca ou filtre por alertas</Text>
      ) : (
        <>
          <Text style={styles.emptyHint}>Cadastre o primeiro item para começar</Text>
          <TouchableOpacity style={styles.emptyCta} onPress={() => router.push('/cadastro')}>
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
        contentContainerStyle={[styles.list, produtosFiltrados.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#378ADD']}
            tintColor="#378ADD"
          />
        }
      />
    </View>
  );
}