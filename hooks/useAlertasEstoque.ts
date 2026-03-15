// hooks/useAlertasEstoque.ts
import { useMemo } from 'react';
import { useEstoque } from '../context/estoqueStorage'; // ✅ IMPORT ADICIONADO
import { Produto } from '../types/produto'; // ✅ IMPORT ADICIONADO

interface AlertaEstoque {
  produto: Produto;
  tipo: 'estoqueMinimo' | 'validade';
  mensagem: string;
  gravidade: 'baixa' | 'media' | 'alta';
}

export function useAlertasEstoque() {
  const { produtos } = useEstoque(); // ✅ AGORA FUNCIONA
  
  // 🔥 FORÇAR o tipo manualmente (solução temporária)
  const produtosComCamposNovos = produtos as (Produto & {
    alertaAtivo: boolean;
    estoqueMinimoUnidades?: number;
    estoqueMinimoKg?: number;
  })[];

  // Função para calcular dias restantes até a validade
  const calcularDiasRestantes = (validade: string): number => {
    if (!validade) return 999; // Se não tem validade, ignora
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataValidade = new Date(validade);
    dataValidade.setHours(0, 0, 0, 0);
    
    const diffTime = dataValidade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Alertas de estoque mínimo
  const produtosAbaixoDoMinimo = useMemo(() => {
    return produtosComCamposNovos.filter(p => {
      if (!p.alertaAtivo) return false;
      
      // Verifica unidades
      const abaixoUnidades = p.estoqueMinimoUnidades && 
                            p.quantidade <= p.estoqueMinimoUnidades;
      
      // Verifica kg (se o produto tiver)
      const abaixoKg = p.estoqueMinimoKg && 
                      (p.quantidadeKg || 0) <= p.estoqueMinimoKg;
      
      return abaixoUnidades || abaixoKg;
    });
  }, [produtosComCamposNovos]);

  // Alertas de validade próxima
  const produtosVencendo = useMemo(() => {
    return produtosComCamposNovos.filter(p => {
      if (!p.validade) return false;
      const diasRestantes = calcularDiasRestantes(p.validade);
      return diasRestantes <= 7 && diasRestantes >= 0;
    }).map(p => ({
      ...p,
      diasRestantes: calcularDiasRestantes(p.validade!)
    }));
  }, [produtosComCamposNovos]);

  // Produtos VENCIDOS
  const produtosVencidos = useMemo(() => {
    return produtosComCamposNovos.filter(p => {
      if (!p.validade) return false;
      const diasRestantes = calcularDiasRestantes(p.validade);
      return diasRestantes < 0;
    }).map(p => ({
      ...p,
      diasAtraso: Math.abs(calcularDiasRestantes(p.validade!))
    }));
  }, [produtosComCamposNovos]);

  // Lista consolidada de todos os alertas
  const todosAlertas = useMemo((): AlertaEstoque[] => {
    const alertas: AlertaEstoque[] = [];

    // Alertas de estoque mínimo
    produtosAbaixoDoMinimo.forEach(p => {
      let mensagem = '';
      let gravidade: 'baixa' | 'media' | 'alta' = 'media';

      if (p.estoqueMinimoUnidades && p.quantidade <= p.estoqueMinimoUnidades) {
        const percentual = Math.round((p.quantidade / p.estoqueMinimoUnidades) * 100);
        mensagem = `${p.nome}: ${p.quantidade} unidades (${percentual}% do mínimo)`;
        
        if (percentual <= 25) gravidade = 'alta';
        else if (percentual <= 50) gravidade = 'media';
        else gravidade = 'baixa';
        
        alertas.push({ produto: p, tipo: 'estoqueMinimo', mensagem, gravidade });
      }

      if (p.estoqueMinimoKg && (p.quantidadeKg || 0) <= p.estoqueMinimoKg) {
        const percentual = Math.round(((p.quantidadeKg || 0) / p.estoqueMinimoKg) * 100);
        mensagem = `${p.nome}: ${p.quantidadeKg} kg (${percentual}% do mínimo)`;
        
        if (percentual <= 25) gravidade = 'alta';
        else if (percentual <= 50) gravidade = 'media';
        else gravidade = 'baixa';
        
        alertas.push({ produto: p, tipo: 'estoqueMinimo', mensagem, gravidade });
      }
    });

    // Alertas de validade
    produtosVencendo.forEach(p => {
      const dias = (p as any).diasRestantes;
      let gravidade: 'baixa' | 'media' | 'alta' = 'media';
      let mensagem = '';

      if (dias <= 2) {
        gravidade = 'alta';
        mensagem = `${p.nome} VENCE EM ${dias} DIAS!`;
      } else if (dias <= 5) {
        gravidade = 'media';
        mensagem = `${p.nome} vence em ${dias} dias`;
      } else {
        gravidade = 'baixa';
        mensagem = `${p.nome} vence em ${dias} dias`;
      }

      alertas.push({ produto: p, tipo: 'validade', mensagem, gravidade });
    });

    // Ordenar por gravidade (alta primeiro)
    return alertas.sort((a, b) => {
      const peso = { alta: 3, media: 2, baixa: 1 };
      return peso[b.gravidade] - peso[a.gravidade];
    });
  }, [produtosAbaixoDoMinimo, produtosVencendo]);

  return {
    produtosAbaixoDoMinimo,
    produtosVencendo,
    produtosVencidos,
    todosAlertas,
    totalAlertas: todosAlertas.length,
    totalEstoqueMinimo: produtosAbaixoDoMinimo.length,
    totalVencendo: produtosVencendo.length,
    totalVencidos: produtosVencidos.length,
    calcularDiasRestantes
  };
}