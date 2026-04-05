// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../src/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  /** Envia e-mail do Firebase para redefinir senha (conta e-mail/senha). */
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
    console.log("AuthContext signIn...", email);
    await signInWithEmailAndPassword(auth, email, password);
    console.log("AuthContext signIn OK");
  };

  const signUp = async (email: string, password: string) => {
    console.log("AuthContext signUp...", email);
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("AuthContext signUp OK");
  };

  const signInWithGoogle = async () => {
    console.log("AuthContext signInWithGoogle...");
    await signInWithPopup(auth, googleProvider);
    console.log("AuthContext signInWithGoogle OK");
  };

  const logout = async () => {
    console.log("Fazendo logout...");
    try {
      await signOut(auth);
      setUser(null);
      console.log("Logout feito!");
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