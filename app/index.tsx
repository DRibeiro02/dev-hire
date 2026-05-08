import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Wrapper para manter a proporção de celular no navegador */}
      <View style={styles.mobileWrapper}>
        
        <View style={styles.content}>
          {/* LOGO DEVHIRE */}
          <Text style={styles.logoText}>
            <Text style={styles.blueText}>DEV</Text>HIRE
          </Text>
          <Text style={styles.subtitle}>Meet Local Devs. Build Teams.</Text>
          
          {/* ÁREA DA ILUSTRAÇÃO (Sua Logo Oficial) */}
          <View style={styles.logoContainer}>
            <Image 
              // ATENÇÃO: Ajuste a quantidade de '../' dependendo de onde o arquivo assets está em relação a esta tela.
              // Geralmente, se a tela está dentro de 'app/', usa-se '../assets/images/...'
              source={require('../assets/images/logo-devhire.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* BOTÃO GET STARTED -> "Loga" o usuário e vai para o Feed */}
          <TouchableOpacity 
            style={styles.btnGetStarted} 
            onPress={() => router.push('/login')} 
            activeOpacity={0.8}
          >
            <Text style={styles.btnTextBlack}>Get Started</Text>
          </TouchableOpacity>

          {/* BOTÃO SIGN IN -> Leva para a tela de Registro */}
          <TouchableOpacity 
            style={styles.btnSecondary}
            onPress={() => router.push('/register')}
            activeOpacity={0.6}
          >
            <Text style={styles.btnSignIn}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé sutil */}
        <Text style={styles.footerNote}>By DevHire Team</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0E17', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mobileWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 500, // Mantém o visual de celular no PC
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: { 
    width: '100%', 
    alignItems: 'center' 
  },
  logoText: { 
    fontSize: 48, 
    fontWeight: 'bold', 
    color: '#FFF',
    letterSpacing: -1
  },
  blueText: { 
    color: '#00D1FF' 
  },
  subtitle: { 
    color: '#888', 
    marginTop: 5, 
    fontSize: 16,
    fontWeight: '500' 
  },
  // NOVOS ESTILOS DA LOGO (Sem fundo cinza)
  logoContainer: { 
    width: '100%', 
    height: 380, // Mantive a mesma altura do card anterior para não quebrar o layout
    marginVertical: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  logoImage: {
    width: 250, // Ajuste este valor para deixar a logo maior ou menor
    height: 250,
  },
  // ESTILOS DOS BOTÕES (Mantidos intactos)
  btnGetStarted: { 
    backgroundColor: '#FFF', 
    width: '100%', 
    padding: 20, 
    borderRadius: 35, 
    alignItems: 'center',
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  btnTextBlack: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  btnSecondary: {
    marginTop: 25,
    padding: 10
  },
  btnSignIn: { 
    color: '#FFF', 
    fontSize: 16, 
    textDecorationLine: 'underline',
    opacity: 0.8
  },
  footerNote: {
    position: 'absolute',
    bottom: 30,
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold'
  }
});