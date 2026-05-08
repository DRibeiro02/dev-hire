import { supabase } from '@/src/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] = useState<'dev' | 'cliente'>('dev');
  const [prioridades, setPrioridades] = useState<string[]>([]);
  const [pagamento, setPagamento] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');

  const [idiomas, setIdiomas] = useState('');
  const [habilidades, setHabilidades] = useState('');
  const [github, setGithub] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [valor, setValor] = useState('');
  const [urgencia, setUrgencia] = useState('');

  const togglePrioridade = (opt: string) => {
    if (prioridades.includes(opt)) {
      setPrioridades(prioridades.filter((item) => item !== opt));
    } else {
      setPrioridades([...prioridades, opt]);
    }
  };

  const handleFinalizar = async () => {
    if (!email || !senha || !nome || !cep) {
      Alert.alert('Campos Vazios', 'Preencha todos os campos!');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            tipo: tipoUsuario,
            nomeCompleto: nome,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Usuário não encontrado');

      const dadosParaSalvar = {
        id: data.user.id,
        nome_completo: nome,
        email,
        cep,
        data_nascimento: dataNasc,
        cpf,
        telefone,
        tipo: tipoUsuario,
        prioridades,
        criado_em: new Date().toISOString(),
        ...(tipoUsuario === 'dev'
          ? { idiomas, habilidades, github }
          : { empresa, objetivo, valor, pagamento, urgencia }),
      };

      const { error: insertError } = await supabase
        .from('usuarios')
        .insert(dadosParaSalvar as any);

      if (insertError) throw insertError;

      Alert.alert('Sucesso!', 'Sua conta foi criada!');
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      console.log('ERRO CADASTRO COMPLETO:', error);
      Alert.alert('Erro detalhado', JSON.stringify(error, null, 2));    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>UNISUAM</Text>
            <Text style={styles.idText}>Cadastro DevHire 🦉</Text>
          </View>
          <View style={styles.logoCircle}>
            <Text style={{ fontSize: 35 }}>🦉</Text>
          </View>
        </View>

        <View style={styles.radioContainer}>
          <TouchableOpacity style={styles.radioButton} onPress={() => setTipoUsuario('dev')}>
            <Ionicons
              name={tipoUsuario === 'dev' ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={tipoUsuario === 'dev' ? '#00D1FF' : '#555'}
            />
            <Text style={[styles.radioLabel, tipoUsuario === 'dev' && { color: '#FFF' }]}>
              Sou Desenvolvedor(a)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.radioButton} onPress={() => setTipoUsuario('cliente')}>
            <Ionicons
              name={tipoUsuario === 'cliente' ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={tipoUsuario === 'cliente' ? '#00D1FF' : '#555'}
            />
            <Text style={[styles.radioLabel, tipoUsuario === 'cliente' && { color: '#FFF' }]}>
              Sou Cliente
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <CustomInput label="Nome Completo" placeholder="Seu nome" value={nome} onChangeText={setNome} />
        <CustomInput label="Email" placeholder="ex@email.com" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <CustomInput label="Senha" placeholder="Mínimo 6 caracteres" secureTextEntry value={senha} onChangeText={setSenha} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '48%' }}>
            <CustomInput label="Data Nasc." placeholder="DD/MM/AAAA" value={dataNasc} onChangeText={setDataNasc} />
          </View>
          <View style={{ width: '48%' }}>
            <CustomInput label="CPF" placeholder="000.000.000-00" value={cpf} onChangeText={setCpf} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '48%' }}>
            <CustomInput label="CEP" placeholder="00000-000" value={cep} onChangeText={setCep} keyboardType="numeric" />
          </View>
          <View style={{ width: '48%' }}>
            <CustomInput label="Telefone" placeholder="(XX) 9XXXX-XXXX" value={telefone} onChangeText={setTelefone} />
          </View>
        </View>

        {tipoUsuario === 'dev' ? (
          <View>
            <CustomInput label="Idiomas Falados" value={idiomas} onChangeText={setIdiomas} />
            <CustomInput label="Habilidades" multiline value={habilidades} onChangeText={setHabilidades} />
            <CustomInput label="GitHub" value={github} onChangeText={setGithub} />
          </View>
        ) : (
          <View>
            <CustomInput label="Empresa" value={empresa} onChangeText={setEmpresa} />
            <CustomInput label="Objetivo / O que deseja contratar?" multiline value={objetivo} onChangeText={setObjetivo} />

            <View style={styles.rowAlign}>
              <View style={{ flex: 1 }}>
                <CustomInput label="Valor" placeholder="R$ 0,00" value={valor} onChangeText={setValor} />
              </View>
              <View style={styles.miniRadioGroup}>
                <TouchableOpacity onPress={() => setPagamento('mensal')} style={styles.miniRadio}>
                  <Ionicons name={pagamento === 'mensal' ? 'checkmark-circle' : 'ellipse-outline'} size={18} color="#00D1FF" />
                  <Text style={styles.miniRadioText}>Mensal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPagamento('projeto')} style={styles.miniRadio}>
                  <Ionicons name={pagamento === 'projeto' ? 'checkmark-circle' : 'ellipse-outline'} size={18} color="#00D1FF" />
                  <Text style={styles.miniRadioText}>Projeto</Text>
                </TouchableOpacity>
              </View>
            </View>
            <CustomInput label="Urgência" placeholder="Ex: Imediata, 1 mês..." value={urgencia} onChangeText={setUrgencia} />
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>
            {tipoUsuario === 'dev' ? 'Interesse de Atuação' : 'Tipo de Contratação'}
          </Text>
          <View style={styles.optionsRow}>
            {['Freelancer', 'Emprego Fixo', 'Estágio'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, prioridades.includes(opt) && styles.chipActive]}
                onPress={() => togglePrioridade(opt)}
              >
                <Text style={[styles.chipText, prioridades.includes(opt) && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={handleFinalizar}>
          <Text style={styles.mainButtonText}>Confirmar e Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CustomInput = ({ label, ...props }: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, props.multiline && { height: 100, textAlignVertical: 'top' }]}
      placeholderTextColor="#444"
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17', padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  companyName: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  idText: { fontSize: 14, color: '#E67E22', marginTop: 2 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E67E22',
  },
  radioContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  radioButton: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { color: '#555', marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#1C2431', marginVertical: 20 },
  inputWrapper: { marginBottom: 20 },
  label: { color: '#888', fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 15,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#30363d',
    fontSize: 16,
  },
  sectionTitle: { color: '#00D1FF', fontWeight: 'bold', fontSize: 16, marginTop: 10, marginBottom: 15 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#161B22',
  },
  chipActive: { borderColor: '#00D1FF', backgroundColor: '#00D1FF22' },
  chipText: { color: '#555', fontSize: 13, fontWeight: 'bold' },
  chipTextActive: { color: '#00D1FF' },
  rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  miniRadioGroup: { marginBottom: 20 },
  miniRadio: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  miniRadioText: { color: '#FFF', fontSize: 12, marginLeft: 5 },
  mainButton: {
    backgroundColor: '#00D1FF',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  mainButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center', paddingBottom: 20 },
  backButtonText: { color: '#555', fontWeight: 'bold' },
});