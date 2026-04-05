// app/(tabs)/configuracao.tsx
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { HELP_URL, TERMS_URL } from '../../constants/appLinks';

export default function Configuracoes() {
  const { logout, user, enviarRedefinicaoSenha } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const styles = createStyles(colors);
  const [notificacoes, setNotificacoes] = useState(true);
  const [som, setSom] = useState(true);
  const [vibracao, setVibracao] = useState(false);
  const [backupAutomatico, setBackupAutomatico] = useState(false);

  const versaoApp = '1.0.0';

  const handleSair = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            toast.success('Você saiu da conta');
          } catch {
            toast.error('Não foi possível sair');
          }
        },
      },
    ]);
  };

  const abrirUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        toast.error('Não foi possível abrir o link.');
      }
    } catch {
      toast.error('Não foi possível abrir o link.');
    }
  };

  const handlePerfil = () => {
    const nome = user?.displayName?.trim() || 'Não informado';
    const email = user?.email || '—';
    const provedores =
      user?.providerData
        ?.map((p) =>
          p.providerId === 'password'
            ? 'E-mail e senha'
            : p.providerId === 'google.com'
              ? 'Google'
              : p.providerId
        )
        .filter(Boolean)
        .join(', ') || '—';

    Alert.alert('Sua conta', `Nome: ${nome}\nE-mail: ${email}\n\nLogin: ${provedores}`);
  };

  const handleAlterarSenha = () => {
    const email = user?.email?.trim();
    if (!email) {
      toast.error('Não foi possível identificar seu e-mail.');
      return;
    }

    Alert.alert(
      'Redefinir senha',
      `Enviaremos um link de redefinição para:\n${email}\n\n(Se você usa só o Google, o link pode servir para criar uma senha no app.)`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar e-mail',
          onPress: async () => {
            try {
              await enviarRedefinicaoSenha(email);
              toast.success('Verifique sua caixa de entrada.');
            } catch {
              toast.error('Não foi possível enviar o e-mail.');
            }
          },
        },
      ]
    );
  };

  const handleExportarDados = () => {
    Alert.alert(
      'Exportar dados',
      'Seus dados ficam salvos na nuvem (Firebase).\n\n📤 Para exportar:\n• Vá na aba Relatórios\n• Gere o PDF ou compartilhe os dados\n\n⚠️ Exportação completa (JSON/CSV) em desenvolvimento.'
    );
  };

  const handleImportarDados = () => {
    Alert.alert(
      'Importar dados',
      '📥 Esta funcionalidade está em desenvolvimento.\n\nPlanejado para futuras versões:\n• Importar planilha (Excel/CSV)\n• Restaurar backup\n\nPor agora, cadastre os produtos manualmente.'
    );
  };

  const handleAjuda = () => {
    void abrirUrl(HELP_URL);
  };

  const handleTermos = () => {
    void abrirUrl(TERMS_URL);
  };

  const handleVersao = () => {
    Alert.alert('MeuEstoque', `Versão ${versaoApp}\n\nApp de controle de estoque.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Configurações</Text>
          <Text style={styles.subtitle}>Personalize sua experiência</Text>
        </View>

        {/* Conta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Conta</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={handlePerfil}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>👤</Text>
              <Text style={styles.itemText}>Perfil</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleAlterarSenha}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🔒</Text>
              <Text style={styles.itemText}>Alterar senha</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, styles.logoutItem]} onPress={handleSair}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🚪</Text>
              <Text style={[styles.itemText, styles.logoutText]}>Sair da conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎨</Text>
            <Text style={styles.sectionTitle}>Aparência</Text>
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🌓</Text>
              <Text style={styles.itemText}>Tema escuro</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notificações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={styles.sectionTitle}>Notificações</Text>
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🔔</Text>
              <Text style={styles.itemText}>Alertas de estoque</Text>
            </View>
            <Switch
              value={notificacoes}
              onValueChange={setNotificacoes}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🔊</Text>
              <Text style={styles.itemText}>Som</Text>
            </View>
            <Switch
              value={som}
              onValueChange={setSom}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.item, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📳</Text>
              <Text style={styles.itemText}>Vibração</Text>
            </View>
            <Switch
              value={vibracao}
              onValueChange={setVibracao}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Dados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💾</Text>
            <Text style={styles.sectionTitle}>Dados</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={handleExportarDados}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📤</Text>
              <Text style={styles.itemText}>Exportar dados</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleImportarDados}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📥</Text>
              <Text style={styles.itemText}>Importar dados</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <View style={[styles.item, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>☁️</Text>
              <Text style={styles.itemText}>Backup automático</Text>
            </View>
            <Switch
              value={backupAutomatico}
              onValueChange={setBackupAutomatico}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>ℹ️</Text>
            <Text style={styles.sectionTitle}>Sobre</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={handleVersao}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📱</Text>
              <Text style={styles.itemText}>Versão</Text>
            </View>
            <Text style={styles.itemValue}>{versaoApp}</Text>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleAjuda}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>❓</Text>
              <Text style={styles.itemText}>Ajuda</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} onPress={handleTermos}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📜</Text>
              <Text style={styles.itemText}>Termos de uso</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versaoText}>Versão {versaoApp}</Text>
        </View>
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
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: 'center',
      marginTop: 4,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    itemIcon: {
      fontSize: 18,
      width: 28,
      textAlign: 'center',
    },
    itemText: {
      fontSize: 15,
      color: colors.text,
      marginLeft: 8,
    },
    itemValue: {
      fontSize: 14,
      color: colors.subtitle,
      marginRight: 8,
    },
    itemArrow: {
      fontSize: 16,
      color: colors.subtitle,
    },
    logoutItem: {
      borderBottomWidth: 0,
    },
    logoutText: {
      color: '#ef4444',
    },
    footer: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 20,
    },
    versaoText: {
      fontSize: 13,
      color: colors.subtitle,
    },
  });
}