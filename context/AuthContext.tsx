// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../src/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  enviarRedefinicaoSenha: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("onAuthStateChanged:", user?.email, user?.uid);
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  // Login com Google via WebBrowser
  // Abre uma sessão de autenticação no browser do sistema
  const signInWithGoogle = async () => {
    // URL de autenticação do Firebase (configurada no Console Firebase)
    // Você precisa adicionar seu app às "Authorized domains" no Firebase Console
    const authUrl = 'https://appestoque-b0d21.firebaseapp.com/__/auth/handler';
    
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      'meuestoqueapp://'
    );

    if (result.type === 'success') {
      // O Firebase Auth vai detectar a sessão e atualizar o estado
      console.log("Google auth successful");
    } else if (result.type === 'cancel') {
      console.log("Usuário cancelou login Google");
    } else {
      throw new Error("Falha na autenticação Google");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const enviarRedefinicaoSenha = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      logout,
      enviarRedefinicaoSenha,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);