// app/(tabs)/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart } from "react-native-chart-kit";
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { GraficoCategorias } from '../../components/GraficoCategorias';
import { useAlertasEstoque } from '../../hooks/useAlertasEstoque';

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const { colors } = useTheme();
  const {
    produtos,
    movimentacoes,
    produtosLoading,
    carregarProdutos,
    carregarMovimentacoes,
  } = useEstoque();
  const { totalAlertas, totalVencidos } = useAlertasEstoque();
  const [refreshing, setRefreshing] = useState(false);

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

  const dados = useMemo(() => {
    const hoje = new Date();

    const dataAtual = format(
      hoje,
      "EEEE, d 'de' MMMM 'de' yyyy",
      { locale: ptBR }
    );

    const dataFormatada =
      dataAtual.charAt(0).toUpperCase() +
      dataAtual.slice(1);

    const totalProdutos = produtos.length;

    const ultimaMov =
      movimentacoes.length > 0
        ? movimentacoes.sort(
            (a, b) =>
              new Date(b.data).getTime() -
              new Date(a.data).getTime()
          )[0]
        : null;

    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() - 30);

    const movimentacoesMes = movimentacoes.filter(
      m =>
        new Date(m.data) >= trintaDias &&
        m.tipo === 'retirada'
    );

    const consumoPorProduto: Record<string, number> = {};

    movimentacoesMes.forEach(mov => {
      const produto = produtos.find(
        p => p.id === mov.produtoId
      );

      if (!produto) return;

      if (!consumoPorProduto[produto.nome]) {
        consumoPorProduto[produto.nome] = 0;
      }

      consumoPorProduto[produto.nome] += mov.quantidadeUnidades || 0;
    });

    const totalConsumo = Object.values(
      consumoPorProduto
    ).reduce((a, b) => a + b, 0);

    const topProdutos = Object.entries(
      consumoPorProduto
    )
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
        percentual:
          totalConsumo > 0
            ? Math.round(
                (quantidade / totalConsumo) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 4);

    const hojeStr = format(hoje, 'yyyy-MM-dd');

    const movHoje = movimentacoes.filter(m =>
      m.data.startsWith(hojeStr)
    );

    const entradasHoje = movHoje
      .filter(m => m.tipo === 'retorno')
      .reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);

    const saidasHoje = movHoje
      .filter(m => m.tipo === 'retirada')
      .reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);

    return {
      saudacao: `Olá, Gabriel!`,
      data: dataFormatada,
      totalProdutos,
      ultimaMovimentacao: ultimaMov
        ? {
            hora: format(
              new Date(ultimaMov.data),
              'HH:mm'
            ),
            produto:
              produtos.find(
                p => p.id === ultimaMov.produtoId
              )?.nome || '',
            quantidade: ultimaMov.quantidadeUnidades || 0,
          }
        : null,
      topProdutos,
      atividadeHoje: {
        entradas: entradasHoje,
        saidas: saidasHoje,
      },
    };
  }, [produtos, movimentacoes]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      marginBottom: 25,
    },
    saudacao: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.title,
    },
    data: {
      fontSize: 15,
      color: colors.subtitle,
      marginTop: 4,
    },
    cardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 25,
    },
    card: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardIcon: {
      fontSize: 22,
      marginBottom: 8,
    },
    cardValor: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.title,
    },
    cardLabel: {
      fontSize: 14,
      color: colors.subtitle,
    },
    secaoTitulo: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.title,
      marginBottom: 12,
    },
    grafico: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 25,
      borderWidth: 1,
      borderColor: colors.border,
    },
    alertaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
    },
    alertaIcon: {
      fontSize: 24,
      marginRight: 12,
      color: '#fff',
    },
    alertaText: {
      flex: 1,
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
    },
    atividade: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    atividadeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    atividadeLabel: {
      color: colors.subtitle,
    },
    entrada: {
      color: '#22c55e',
      fontWeight: 'bold',
    },
    saida: {
      color: '#ef4444',
      fontWeight: 'bold',
    },
    loadingBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: colors.subtitle,
    },
  });

  if (produtosLoading && produtos.length === 0) {
    return (
      <View style={[styles.container, styles.loadingBox]}>
        <ActivityIndicator size="large" color={colors.icon} />
        <Text style={styles.loadingText}>Carregando painel…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.icon]}
            tintColor={colors.icon}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.saudacao}>
            {dados.saudacao}
          </Text>
          <Text style={styles.data}>
            {dados.data}
          </Text>
        </View>

        {/* Cards de resumo */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>📦</Text>
            <Text style={styles.cardValor}>
              {dados.totalProdutos}
            </Text>
            <Text style={styles.cardLabel}>
              Total de Produtos
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>⚠️</Text>
            <Text style={[styles.cardValor, { color: '#ef4444' }]}>
              {totalAlertas}
            </Text>
            <Text style={styles.cardLabel}>
              Alertas Ativos
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>⏱</Text>
            <Text style={styles.cardValor}>
              {dados.ultimaMovimentacao?.hora || '--:--'}
            </Text>
            <Text style={styles.cardLabel}>
              Última Movimentação
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardValor}>
              {dados.topProdutos.length > 0
                ? dados.topProdutos[0].percentual
                : 0}%
            </Text>
            <Text style={styles.cardLabel}>
              Consumo do Mês
            </Text>
          </View>
        </View>

        {/* Gráfico de Categorias */}
        <GraficoCategorias />

        {/* Alerta de produtos vencidos */}
        {totalVencidos > 0 && (
          <View style={styles.alertaCard}>
            <Text style={styles.alertaIcon}>⚠️</Text>
            <Text style={styles.alertaText}>
              {totalVencidos} produto(s) vencido(s)! 
              Acesse o estoque para verificar.
            </Text>
          </View>
        )}

        {/* Produtos mais utilizados */}
        {dados.topProdutos.length > 0 && (
          <View style={styles.grafico}>
            <Text style={styles.secaoTitulo}>
              PRODUTOS MAIS UTILIZADOS (MÊS)
            </Text>
            <BarChart
              data={{
                labels: dados.topProdutos.map(p => p.nome.substring(0, 8) + (p.nome.length > 8 ? '...' : '')),
                datasets: [
                  {
                    data: dados.topProdutos.map(p => p.quantidade)
                  }
                ]
              }}
              width={screenWidth - 72}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: () => colors.icon,
                labelColor: () => colors.text,
                style: {
                  borderRadius: 16
                }
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
        )}

        {/* Atividade Diária */}
        <View style={styles.atividade}>
          <Text style={styles.secaoTitulo}>
            ATIVIDADE DIÁRIA
          </Text>
          <View style={styles.atividadeRow}>
            <Text style={styles.atividadeLabel}>
              Total entradas
            </Text>
            <Text style={styles.entrada}>
              ↑ {dados.atividadeHoje.entradas}
            </Text>
          </View>
          <View style={styles.atividadeRow}>
            <Text style={styles.atividadeLabel}>
              Total saídas
            </Text>
            <Text style={styles.saida}>
              ↓ {dados.atividadeHoje.saidas}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}