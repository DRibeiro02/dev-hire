import { supabase } from '@/src/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'dev' | 'cliente' | null>(null);
  const [myUserData, setMyUserData] = useState<any>(null);
  const [quemMeCurtiu, setQuemMeCurtiu] = useState<Set<string>>(new Set());
  const swiperRef = React.useRef<any>(null);

  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUserInfo, setMatchedUserInfo] = useState<any>(null);

  useEffect(() => {
    loadUserAndCards();
  }, []);

  const loadUserAndCards = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    try {
      setLoading(true);

      // 1) Meu perfil
      const { data: myData, error: myError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (myError) throw myError;

      setMyUserData(myData);
      const myRole = myData?.tipo as 'dev' | 'cliente' | null;
      setUserRole(myRole);

      // 2) Quem já me curtiu (pending)
      const { data: recebidas, error: recebidasError } = await supabase
        .from('curtidas')
        .select('de')
        .eq('para', user.id)
        .eq('status', 'pending');

      if (recebidasError) throw recebidasError;

      const idsRecebidos = new Set<string>((recebidas ?? []).map((r: any) => r.de));
      setQuemMeCurtiu(idsRecebidos);

      // 3) Interações para ignorar
      const [{ data: minhasInteracoes, error: minhasError }, { data: matchesRecebidos, error: matchesError }] =
        await Promise.all([
          supabase.from('curtidas').select('para').eq('de', user.id),
          supabase.from('curtidas').select('de').eq('para', user.id).eq('status', 'matched'),
        ]);

      if (minhasError) throw minhasError;
      if (matchesError) throw matchesError;

      const idsParaIgnorar = new Set<string>();
      idsParaIgnorar.add(user.id);
      (minhasInteracoes ?? []).forEach((d: any) => idsParaIgnorar.add(d.para));
      (matchesRecebidos ?? []).forEach((d: any) => idsParaIgnorar.add(d.de));

      // 4) Busca usuários do tipo oposto
      const targetRole = myRole === 'dev' ? 'cliente' : 'dev';
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tipo', targetRole);

      if (usuariosError) throw usuariosError;

      const list = (usuarios ?? []).filter((u: any) => !idsParaIgnorar.has(u.id));
      setCards(list);
    } catch (error) {
      console.error('Erro ao carregar feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSwipedLeft = async (index: number) => {
    const { data: authData } = await supabase.auth.getUser();
    const userLogado = authData.user;
    const p = cards[index];
    if (!userLogado || !p) return;

    try {
      const { error } = await supabase.from('curtidas').upsert(
        {
          de: userLogado.id,
          para: p.id,
          status: 'rejected',
        },
        { onConflict: 'de,para' }
      );
      if (error) throw error;
    } catch (e) {
      console.error('Erro ao rejeitar:', e);
    }
  };

  const onSwipedRight = async (index: number) => {
    const { data: authData } = await supabase.auth.getUser();
    const userLogado = authData.user;
    const p = cards[index];
    if (!userLogado || !p || !myUserData) return;

    const jaMeCurtiu = quemMeCurtiu.has(p.id);

    try {
      if (jaMeCurtiu) {
        // Atualiza a curtida inversa para matched
        const { data: reverseLike, error: findReverseError } = await supabase
          .from('curtidas')
          .select('id')
          .eq('de', p.id)
          .eq('para', userLogado.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (findReverseError) throw findReverseError;

        if (reverseLike?.id) {
          const { error: updateError } = await supabase
            .from('curtidas')
            .update({
              status: 'matched',
              match_date: new Date().toISOString(),
            })
            .eq('id', reverseLike.id);

          if (updateError) throw updateError;
        }

        // Também marca minha curtida como matched (se já existir)
        await supabase
          .from('curtidas')
          .update({
            status: 'matched',
            match_date: new Date().toISOString(),
          })
          .eq('de', userLogado.id)
          .eq('para', p.id);

        setMatchedUserInfo(p);
        setMatchModalVisible(true);
      } else {
        const payload = {
          de: userLogado.id,
          para: p.id,
          status: 'pending',
          nomePara: p.nomeCompleto || p.nome_completo || 'Sem Nome',
          fotoPara: p.fotoPerfil || p.foto_perfil || '',
          bioPara: p.bio || '',
          habilidadesPara: p.habilidades || '',
          objetivoPara: p.objetivo || '',
          valorPara: p.valor || '',
          pagamentoPara: p.pagamento || '',
          nomeDe: myUserData.nomeCompleto || myUserData.nome_completo || 'Sem Nome',
          fotoDe: myUserData.fotoPerfil || myUserData.foto_perfil || '',
          bioDe: myUserData.bio || '',
          habilidadesDe: myUserData.habilidades || '',
          objetivoDe: myUserData.objetivo || '',
          valorDe: myUserData.valor || '',
          pagamentoDe: myUserData.pagamento || '',
        };

        const { error } = await supabase.from('curtidas').upsert(payload, { onConflict: 'de,para' });
        if (error) throw error;
      }
    } catch (e) {
      console.error('Erro no swipe right:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ DevHire</Text>
      </View>

      <View style={styles.swiperContainer}>
        {cards.length > 0 ? (
          <Swiper
            ref={swiperRef}
            cards={cards}
            renderCard={(card) => (
              <View style={styles.card}>
                <View style={styles.imageContainer}>
                  {card.fotoPerfil || card.foto_perfil ? (
                    <Image source={{ uri: card.fotoPerfil || card.foto_perfil }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Image
                        source={{
                          uri: `https://ui-avatars.com/api/?name=${card.nomeCompleto || card.nome_completo || 'User'}&background=161B22&color=00D1FF&size=128`,
                        }}
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.cardName}>
                    {(card.nomeCompleto || card.nome_completo || 'SEM NOME').toUpperCase()}
                  </Text>

                  <Text style={styles.cardBio} numberOfLines={3}>
                    {card.bio || 'Sem biografia disponível.'}
                  </Text>

                  {userRole === 'cliente' ? (
                    <Text style={styles.skillsTitle}>
                      HABILIDADES:
                      <Text style={styles.skillsText}> {card.habilidades || 'Não informado'}</Text>
                    </Text>
                  ) : (
                    <View>
                      <Text style={styles.skillsTitle}>
                        VALOR:
                        <Text style={styles.skillsText}> R$ {card.valor || 'A combinar'}</Text>
                      </Text>
                      <Text style={styles.skillsTitle}>
                        OBJETIVO:
                        <Text style={styles.skillsText}> {card.objetivo || 'Não informado'}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            onSwipedLeft={onSwipedLeft}
            onSwipedRight={onSwipedRight}
            backgroundColor="transparent"
            stackSize={3}
            disableBottomSwipe
            disableTopSwipe
            overlayLabels={{
              left: {
                title: 'REJEITAR',
                style: {
                  label: {
                    backgroundColor: 'rgba(255, 68, 68, 0.2)',
                    borderColor: '#FF4444',
                    color: '#FF4444',
                    borderWidth: 4,
                    fontSize: 32,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    padding: 10,
                    textAlign: 'center',
                    overflow: 'hidden',
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: -30,
                  },
                },
              },
              right: {
                title: 'APROVAR',
                style: {
                  label: {
                    backgroundColor: 'rgba(0, 255, 127, 0.2)',
                    borderColor: '#00FF7F',
                    color: '#00FF7F',
                    borderWidth: 4,
                    fontSize: 32,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    padding: 10,
                    textAlign: 'center',
                    overflow: 'hidden',
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: 30,
                  },
                },
              },
            }}
            cardVerticalMargin={0}
            animateCardOpacity
            animateOverlayLabelsOpacity
          />
        ) : (
          <View style={styles.center}>
            <Text style={{ color: '#FFF' }}>Ninguém novo por aqui... 🦉</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, styles.btnX]} onPress={() => swiperRef.current?.swipeLeft()}>
          <Ionicons name="close" size={35} color="#FF4444" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.btnStar]} onPress={() => console.log('Super Like!')}>
          <Ionicons name="star" size={28} color="#FFD700" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.btnHeart]} onPress={() => swiperRef.current?.swipeRight()}>
          <Ionicons name="heart" size={35} color="#00FF7F" />
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={matchModalVisible} onRequestClose={() => setMatchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.matchTitle}>IT'S A MATCH!</Text>
            <Text style={styles.matchSubtitle}>Você e {matchedUserInfo?.nomeCompleto || matchedUserInfo?.nome_completo} se curtiram.</Text>

            <View style={styles.avatarRow}>
              <Image
                source={{
                  uri:
                    myUserData?.fotoPerfil ||
                    myUserData?.foto_perfil ||
                    `https://ui-avatars.com/api/?name=${myUserData?.nomeCompleto || myUserData?.nome_completo}&background=00D1FF&color=fff`,
                }}
                style={[styles.matchAvatar, { borderColor: '#00D1FF', marginRight: -20 }]}
              />
              <Image
                source={{
                  uri:
                    matchedUserInfo?.fotoPerfil ||
                    matchedUserInfo?.foto_perfil ||
                    `https://ui-avatars.com/api/?name=${matchedUserInfo?.nomeCompleto || matchedUserInfo?.nome_completo}&background=E67E22&color=fff`,
                }}
                style={[styles.matchAvatar, { borderColor: '#E67E22' }]}
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setMatchModalVisible(false);
                router.push('/(tabs)/matches');
              }}
            >
              <Text style={styles.modalButtonText}>Ver Matchs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setMatchModalVisible(false)}>
              <Text style={styles.closeModalText}>Continuar explorando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingVertical: 40, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  swiperContainer: { flex: 1, marginTop: -40 },
  card: { height: height * 0.55, borderRadius: 30, backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363d', overflow: 'hidden', elevation: 5 },
  imageContainer: { flex: 1, backgroundColor: '#21262d' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardDetails: { padding: 20 },
  cardName: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  cardBio: { color: '#888', fontSize: 14, marginVertical: 10 },
  skillsTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginTop: 5 },
  skillsText: { color: '#00D1FF', fontWeight: 'normal' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: 40 },
  button: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#161B22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#30363d' },
  btnX: { borderColor: '#FF4444' },
  btnStar: { borderColor: '#FFD700' },
  btnHeart: { borderColor: '#00FF7F' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 14, 23, 0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', alignItems: 'center', padding: 30, borderRadius: 30, backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363d' },
  matchTitle: {
    fontSize: 35,
    fontWeight: '900',
    color: '#00D1FF',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 209, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  matchSubtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  avatarRow: { flexDirection: 'row', marginBottom: 40, alignItems: 'center' },
  matchAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, backgroundColor: '#30363d' },
  modalButton: { backgroundColor: '#00D1FF', width: '100%', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalButtonText: { color: '#0A0E17', fontSize: 18, fontWeight: 'bold' },
  closeModalButton: { padding: 10 },
  closeModalText: { color: '#555', fontSize: 14, fontWeight: '600' },
});