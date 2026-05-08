import { supabase } from '@/src/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Usuário não encontrado.');

      router.replace('/(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Ops!', error?.message ?? 'Erro ao entrar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Bem-vindo de volta!</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#555"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btnLogin, carregando && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnLoginText}>Entrar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 10 },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  btnLogin: {
    backgroundColor: '#00D1FF',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLoginText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});