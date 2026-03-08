// app/(tabs)/estoque.tsx
import React, { useState, useMemo } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useEstoque } from '../context/estoqueStorage';
import { useTheme } from '../context/ThemeContext';
import { format, parseISO, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Ativar animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Estoque() {
  const { colors } = useTheme();
  const { produtos } = useEstoque();
  
  // Estados de expansão
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null);
  const [produtoExpandido, setProdutoExpandido] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Função para animar expansões
  const toggleAnimation = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  // Agrupar produtos por categoria e ordenar
  const produtosPorCategoria = useMemo(() => {
    // Filtrar por busca se houver
    let produtosFiltrados = produtos;
    if (busca.trim()) {
     produtosFiltrados = produtos.filter(p => 
  p.nome.toLowerCase().includes(busca.toLowerCase()) ||
  (p.categoria || '').toLowerCase().includes(busca.toLowerCase())
);
    }

    // Agrupar por categoria
    const categorias: Record<string, typeof produtos> = {};
    
    produtosFiltrados.forEach(produto => {
      const cat = produto.categoria || 'Sem categoria';
      if (!categorias[cat]) {
        categorias[cat] = [];
      }
      categorias[cat].push(produto);
    });

    // Ordenar produtos dentro de cada categoria (alfabeticamente)
    Object.keys(categorias).forEach(cat => {
      categorias[cat].sort((a, b) => a.nome.localeCompare(b.nome));
    });

    // Ordenar categorias (alfabeticamente)
    return Object.keys(categorias)
      .sort((a, b) => a.localeCompare(b))
      .map(cat => ({
        nome: cat,
        produtos: categorias[cat],
        quantidade: categorias[cat].length,
      }));
  }, [produtos, busca]);

  // Calcular alertas
  const alertas = useMemo(() => {
    const vencidos: any[] = [];
    const vencendo: any[] = [];
    const estoqueBaixo: any[] = [];
    const hoje = new Date();

    produtos.forEach(produto => {
      // Verificar validade (se existir)
      if (produto.validade) {
        try {
          const dataValidade = parseISO(produto.validade);
          const diasRestantes = differenceInDays(dataValidade, hoje);
          
          if (isBefore(dataValidade, hoje)) {
            vencidos.push(produto);
          } else if (diasRestantes <= 60) {
            vencendo.push(produto);
          }
        } catch (e) {
          // Data inválida, ignorar
        }
      }

      // Verificar estoque baixo
      if (produto.minimo > 0 && produto.quantidade <= produto.minimo) {
        estoqueBaixo.push(produto);
      }
    });

    return { vencidos, vencendo, estoqueBaixo };
  }, [produtos]);

  // Função para determinar cor da validade
  const getValidadeCor = (validade?: string) => {
    if (!validade) return colors.text; // Sem validade
    
    try {
      const hoje = new Date();
      const dataValidade = parseISO(validade);
      
      if (isBefore(dataValidade, hoje)) return '#ef4444'; // Vencido - vermelho
      
      const diasRestantes = differenceInDays(dataValidade, hoje);
      if (diasRestantes <= 60) return '#f97316'; // Vencendo - laranja
      return '#22c55e'; // Normal - verde
    } catch (e) {
      return colors.text;
    }
  };

  // Formatar data
  const formatarData = (data?: string) => {
    if (!data) return 'Sem validade';
    try {
      return format(parseISO(data), 'dd/MM/yyyy');
    } catch (e) {
      return data;
    }
  };

  // Calcular dias para vencer
  const getDiasParaVencer = (validade?: string) => {
    if (!validade) return null;
    try {
      const hoje = new Date();
      const dataValidade = parseISO(validade);
      const dias = differenceInDays(dataValidade, hoje);
      return dias;
    } catch (e) {
      return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.title,
      marginBottom: 12,
      textAlign: 'center',
    },
    buscaInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 30,
      padding: 12,
      paddingHorizontal: 20,
      fontSize: 16,
      color: colors.text,
    },
    alertasContainer: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    alertaCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    alertaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    alertaIcon: {
      fontSize: 20,
    },
    alertaTitulo: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    alertaContagem: {
      fontSize: 14,
      fontWeight: '700',
    },
    alertaLista: {
      marginTop: 8,
      paddingLeft: 28,
    },
    alertaItem: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    categoriaContainer: {
      marginBottom: 8,
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoriaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
    },
    categoriaIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    categoriaNome: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.title,
      flex: 1,
    },
    categoriaBadge: {
      backgroundColor: colors.icon + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    categoriaBadgeTexto: {
      fontSize: 12,
      color: colors.icon,
      fontWeight: '600',
    },
    expandIcon: {
      fontSize: 18,
      color: colors.subtitle,
    },
    produtoItem: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    produtoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
    },
    produtoIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    produtoNome: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    produtoEstoque: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.title,
      marginRight: 8,
    },
    produtoBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginRight: 8,
    },
    produtoBadgeTexto: {
      fontSize: 10,
      color: '#fff',
      fontWeight: '600',
    },
    produtoExpandido: {
      padding: 16,
      paddingTop: 0,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detalheRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detalheLabel: {
      fontSize: 14,
      color: colors.subtitle,
    },
    detalheValor: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    validadeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    validadeIndicador: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    botoesContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    botaoAcao: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    botaoAcaoTexto: {
      fontSize: 12,
      color: colors.text,
    },
    botaoPerigo: {
      borderColor: '#ef4444',
    },
    botaoPerigoTexto: {
      color: '#ef4444',
    },
    addButton: {
      backgroundColor: colors.icon,
      marginHorizontal: 16,
      marginVertical: 20,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.subtitle,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📦 Estoque</Text>
          <TextInput
  style={styles.buscaInput}
  placeholder="Buscar produto ou categoria..."
  placeholderTextColor={colors.subtitle}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Painel de Alertas */}
        {(alertas.vencidos.length > 0 || alertas.vencendo.length > 0 || alertas.estoqueBaixo.length > 0) && (
          <View style={styles.alertasContainer}>
            {alertas.vencidos.length > 0 && (
              <View style={[styles.alertaCard, { borderLeftColor: '#ef4444' }]}>
                <View style={styles.alertaHeader}>
                  <Text style={styles.alertaIcon}>🔴</Text>
                  <Text style={styles.alertaTitulo}>Vencidos</Text>
                  <Text style={[styles.alertaContagem, { color: '#ef4444' }]}>
                    {alertas.vencidos.length}
                  </Text>
                </View>
              </View>
            )}

            {alertas.vencendo.length > 0 && (
              <View style={[styles.alertaCard, { borderLeftColor: '#f97316' }]}>
                <View style={styles.alertaHeader}>
                  <Text style={styles.alertaIcon}>🟠</Text>
                  <Text style={styles.alertaTitulo}>Vencendo em 60 dias</Text>
                  <Text style={[styles.alertaContagem, { color: '#f97316' }]}>
                    {alertas.vencendo.length}
                  </Text>
                </View>
              </View>
            )}

            {alertas.estoqueBaixo.length > 0 && (
              <View style={[styles.alertaCard, { borderLeftColor: '#3b82f6' }]}>
                <View style={styles.alertaHeader}>
                  <Text style={styles.alertaIcon}>🔵</Text>
                  <Text style={styles.alertaTitulo}>Estoque baixo</Text>
                  <Text style={[styles.alertaContagem, { color: '#3b82f6' }]}>
                    {alertas.estoqueBaixo.length}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Lista de Categorias */}
        {produtosPorCategoria.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </Text>
          </View>
        ) : (
          produtosPorCategoria.map((categoria) => (
            <View key={categoria.nome} style={styles.categoriaContainer}>
              {/* Cabeçalho da Categoria */}
              <TouchableOpacity
                style={styles.categoriaHeader}
                onPress={() => {
                  toggleAnimation();
                  setCategoriaExpandida(
                    categoriaExpandida === categoria.nome ? null : categoria.nome
                  );
                  setProdutoExpandido(null); // Recolhe produtos ao trocar categoria
                }}
              >
                <Text style={styles.categoriaIcon}>📁</Text>
                <Text style={styles.categoriaNome}>{categoria.nome}</Text>
                <View style={styles.categoriaBadge}>
                  <Text style={styles.categoriaBadgeTexto}>
                    {categoria.quantidade} itens
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {categoriaExpandida === categoria.nome ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* Produtos da Categoria (expandido) */}
              {categoriaExpandida === categoria.nome && (
                <View>
                  {categoria.produtos.map((produto) => {
                    const diasParaVencer = getDiasParaVencer(produto.validade);
                    const validadeCor = getValidadeCor(produto.validade);
                    const isEstoqueBaixo = produto.minimo > 0 && produto.quantidade <= produto.minimo;

                    return (
                      <View key={produto.id} style={styles.produtoItem}>
                        {/* Cabeçalho do Produto */}
                        <TouchableOpacity
                          style={styles.produtoHeader}
                          onPress={() => {
                            toggleAnimation();
                            setProdutoExpandido(
                              produtoExpandido === produto.id ? null : produto.id
                            );
                          }}
                        >
                          <Text style={styles.produtoIcon}>📦</Text>
                          <Text style={styles.produtoNome}>{produto.nome}</Text>
                         <Text
  style={[
    styles.produtoEstoque,
    isEstoqueBaixo && { color: '#3b82f6' }
  ]}
>
                            {produto.pesoPorUnidade 
                              ? `${produto.quantidade} kg` 
                              : `${produto.quantidade} un`}
                          </Text>
                          
                          {/* Badge de alerta */}
                          {diasParaVencer !== null && diasParaVencer < 0 && (
                            <View style={[styles.produtoBadge, { backgroundColor: '#ef4444' }]}>
                              <Text style={styles.produtoBadgeTexto}>VENCIDO</Text>
                            </View>
                          )}
                          {diasParaVencer !== null && diasParaVencer >= 0 && diasParaVencer <= 60 && (
                            <View style={[styles.produtoBadge, { backgroundColor: '#f97316' }]}>
                              <Text style={styles.produtoBadgeTexto}>{diasParaVencer}d</Text>
                            </View>
                          )}
                          {isEstoqueBaixo && (
                            <View style={[styles.produtoBadge, { backgroundColor: '#3b82f6' }]}>
                              <Text style={styles.produtoBadgeTexto}>BAIXO</Text>
                            </View>
                          )}
                          
                          <Text style={styles.expandIcon}>
                            {produtoExpandido === produto.id ? '▼' : '▶'}
                          </Text>
                        </TouchableOpacity>

                        {/* Detalhes do Produto (expandido) */}
                        {produtoExpandido === produto.id && (
                          <View style={styles.produtoExpandido}>
                            <View style={styles.detalheRow}>
                              <Text style={styles.detalheLabel}>Quantidade:</Text>
                              <Text style={styles.detalheValor}>
                                {produto.pesoPorUnidade 
                                  ? `${produto.quantidade} kg` 
                                  : `${produto.quantidade} unidades`}
                              </Text>
                            </View>

                            <View style={styles.detalheRow}>
                              <Text style={styles.detalheLabel}>Estoque mínimo:</Text>
                              <Text style={styles.detalheValor}>
                                {produto.pesoPorUnidade 
                                  ? `${produto.minimo} kg` 
                                  : `${produto.minimo} unidades`}
                              </Text>
                            </View>

                            <View style={styles.detalheRow}>
                              <Text style={styles.detalheLabel}>Categoria:</Text>
                          <Text style={styles.detalheValor}>
  {produto.categoria || 'Sem categoria'}
</Text>
                            </View>

                            <View style={styles.detalheRow}>
                              <Text style={styles.detalheLabel}>Validade:</Text>
                              <View style={styles.validadeContainer}>
                                <View style={[styles.validadeIndicador, { backgroundColor: validadeCor }]} />
                                <Text style={[styles.detalheValor, { color: validadeCor }]}>
                                  {formatarData(produto.validade)}
                                  {diasParaVencer !== null && diasParaVencer > 0 && ` (${diasParaVencer} dias)`}
                                  {diasParaVencer !== null && diasParaVencer < 0 && ` (vencido há ${Math.abs(diasParaVencer)} dias)`}
                                </Text>
                              </View>
                            </View>

                            {produto.descricao && (
                              <View style={styles.detalheRow}>
                                <Text style={styles.detalheLabel}>Descrição:</Text>
                                <Text style={styles.detalheValor}>{produto.descricao}</Text>
                              </View>
                            )}

                            {/* Botões de ação */}
                            <View style={styles.botoesContainer}>
                              <TouchableOpacity 
                                style={styles.botaoAcao}
                                onPress={() => Alert.alert('Editar', `Editar ${produto.nome}`)}
                              >
                                <Text style={styles.botaoAcaoTexto}>✏️ Editar</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={styles.botaoAcao}
                                onPress={() => Alert.alert('Movimentar', `Movimentar ${produto.nome}`)}
                              >
                                <Text style={styles.botaoAcaoTexto}>📦 Movimentar</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={[styles.botaoAcao, styles.botaoPerigo]}
                                onPress={() => Alert.alert(
                                  'Confirmar exclusão',
                                  `Deseja excluir ${produto.nome}?`,
                                  [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { text: 'Excluir', style: 'destructive' }
                                  ]
                                )}
                              >
                                <Text style={[styles.botaoAcaoTexto, styles.botaoPerigoTexto]}>🗑️ Excluir</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        )}

        {/* Botão Adicionar Produto */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/cadastro')}
        >
          <Text style={styles.addButtonText}>➕ Adicionar Produto</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}