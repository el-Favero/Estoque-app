// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  // Redirect when user logs in (simplificado)
  useEffect(() => {
    console.log("user mudou:", user?.email);
    if (user?.email) {
      try {
        router.replace('/(tabs)');
      } catch (e) {
        console.log("Erro router:", e);
      }
    }
  }, [user?.email]);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      console.log("Tentando:", isLogin ? "signIn" : "signUp", email);
      if (isLogin) {
        await signIn(email, password);
        console.log("Login OK!");
      } else {
        await signUp(email, password);
        console.log("Cadastro OK!");
        toast.success('Conta criada! Faça login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      // Não mostrar erro no console para evitar confusão
      let mensagem = 'Erro ao autenticar';
      
      // Verificar códigos de erro do Firebase Auth
      const code = error.code || error?.message || '';
      if (code.includes('user-not-found') || code.includes('auth/user-not-found')) {
        mensagem = 'Usuário não encontrado';
      } else if (code.includes('wrong-password') || code.includes('auth/wrong-password')) {
        mensagem = 'Senha incorreta';
      } else if (code.includes('email-already-in-use') || code.includes('auth/email-already-in-use')) {
        mensagem = 'Email já cadastrado';
      } else if (code.includes('invalid-email') || code.includes('auth/invalid-email')) {
        mensagem = 'Email inválido';
      } else if (code.includes('invalid-credential') || code.includes('auth/invalid-credential')) {
        mensagem = 'Email ou senha incorretos';
      } else if (code.includes('weak-password') || code.includes('auth/weak-password')) {
        mensagem = 'Senha muito fraca (mínimo 6 caracteres)';
      } else if (code.includes('too-many-requests')) {
        mensagem = 'Muitas tentativas. Aguarde alguns minutos';
      } else if (code) {
        mensagem = code;
      }
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      console.log("Iniciando login Google...");
      await signInWithGoogle();
      console.log("Login Google OK");
    } catch (error: any) {
      toast.error('Não foi possível entrar com Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>MeuEstoque</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Faça login para continuar' : 'Crie sua conta'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 12, top: 14 }}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Entrar' : 'Cadastrar'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>
              Entrar com Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin 
                ? 'Não tem uma conta? Cadastre-se' 
                : 'Já tem uma conta? Faça login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
  },
  switchText: {
    color: '#3b82f6',
    textAlign: 'center',
    fontSize: 14,
  },
});