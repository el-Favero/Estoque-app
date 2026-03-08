// app/(tabs)/index.tsx

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useEstoque } from '../context/estoqueStorage';
import { useTheme } from '../context/ThemeContext';
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {

  const { colors } = useTheme();
  const { produtos, movimentacoes } = useEstoque();

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

    const itensBaixos = produtos.filter(
      p => p.quantidade <= p.minimo
    ).length;

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

      consumoPorProduto[produto.nome] += mov.quantidade;
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

    const estoqueBaixo = produtos
      .filter(p => p.quantidade <= p.minimo)
      .slice(0, 3);

    const hojeStr = format(hoje, 'yyyy-MM-dd');

    const movHoje = movimentacoes.filter(m =>
      m.data.startsWith(hojeStr)
    );

    const entradasHoje = movHoje
      .filter(m => m.tipo === 'retorno')
      .reduce((acc, m) => acc + m.quantidade, 0);

    const saidasHoje = movHoje
      .filter(m => m.tipo === 'retirada')
      .reduce((acc, m) => acc + m.quantidade, 0);

    return {
      saudacao: `Olá, Gabriel!`,
      data: dataFormatada,
      totalProdutos,
      itensBaixos,

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
            quantidade: ultimaMov.quantidade,
          }
        : null,

      topProdutos,

      estoqueBaixo,

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

    barraItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },

    barraLabel: {
      width: 70,
      fontSize: 14,
      color: colors.text,
    },

    barraFundo: {
      flex: 1,
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      marginHorizontal: 8,
      overflow: 'hidden',
    },

    barra: {
      height: '100%',
      backgroundColor: '#d4a373',
    },

    barraPercentual: {
      width: 40,
      fontWeight: '600',
      color: colors.title,
      textAlign: 'right',
    },

    alertaCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },

    alertaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },

    alertaNome: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },

    alertaSaldo: {
      fontWeight: '700',
      color: '#ef4444',
    },

    alertaBarraFundo: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },

    alertaBarra: {
      height: '100%',
      backgroundColor: '#ef4444',
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

  });

  return (

    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <Text style={styles.saudacao}>
            {dados.saudacao}
          </Text>

          <Text style={styles.data}>
            {dados.data}
          </Text>
        </View>


        {/* RESUMO */}

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
            <Text
              style={[
                styles.cardValor,
                { color: '#ef4444' },
              ]}
            >
              {dados.itensBaixos}
            </Text>

            <Text style={styles.cardLabel}>
              Produtos Baixos
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>⏱</Text>

            <Text style={styles.cardValor}>
              {dados.ultimaMovimentacao?.hora ||
                '--:--'}
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
                : 0}
              %
            </Text>

            <Text style={styles.cardLabel}>
              Consumo do Mês
            </Text>
          </View>

        </View>


        {/* PRODUTOS MAIS UTILIZADOS */}

        {dados.topProdutos.length > 0 && (
          <View style={styles.grafico}>

            <Text style={styles.secaoTitulo}>
              PRODUTOS MAIS UTILIZADOS (MÊS)
            </Text>

          return (
  <View style={styles.container}>

    <ScrollView>

      {/* outras seções */}

      {/* PRODUTOS MAIS UTILIZADOS */}
      {dados.topProdutos.length > 0 && (
        <View style={styles.grafico}>

          <Text style={styles.secaoTitulo}>
            PRODUTOS MAIS UTILIZADOS (MÊS)
          </Text>

          <BarChart
            data={{
              labels: dados.topProdutos.map(p => p.nome),
              datasets: [
                {
                  data: dados.topProdutos.map(p => p.quantidade)
                }
              ]
            }}
            width={screenWidth - 40}
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
            }}
          />

        </View>
      )}

    </ScrollView>

  </View>
);

          </View>
        )}


        {/* ALERTAS */}

        {dados.estoqueBaixo.length > 0 && (
          <View>

            <Text style={styles.secaoTitulo}>
              ALERTAS DE ESTOQUE BAIXO
            </Text>

            {dados.estoqueBaixo.map((item, i) => (

              <View key={i} style={styles.alertaCard}>

                <View style={styles.alertaHeader}>

                  <Text style={styles.alertaNome}>
                    {item.nome}
                  </Text>

                  <Text style={styles.alertaSaldo}>
                    SALDO: {item.quantidade}
                  </Text>

                </View>

                <View style={styles.alertaBarraFundo}>

                  <View
                    style={[
                      styles.alertaBarra,
                      {
                        width: `${Math.min(
                          100,
                          (item.quantidade /
                            item.minimo) *
                            100
                        )}%`,
                      },
                    ]}
                  />

                </View>

              </View>

            ))}

          </View>
        )}


        {/* ATIVIDADE DIÁRIA */}

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