import { supabase } from '@/src/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MatchesScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'matches' | 'requests'>('matches');
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [dataList, setDataList] = useState<any[]>([]);

  const [matchCount, setMatchCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('curtidas-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'curtidas' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const loadData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    try {
      setLoading(true);

      const { data: myData } = await supabase.from('usuarios').select('tipo').eq('id', user.id).single();
      setMyRole(myData?.tipo || '');

      const { data: requestsData, error: reqErr } = await supabase
        .from('curtidas')
        .select('*')
        .eq('para', user.id)
        .eq('status', 'pending');

      if (reqErr) throw reqErr;

      const { data: matchesRaw, error: matchErr } = await supabase
        .from('curtidas')
        .select('*')
        .eq('status', 'matched')
        .or(`de.eq.${user.id},para.eq.${user.id}`);

      if (matchErr) throw matchErr;

      setRequestCount((requestsData ?? []).length);
      setMatchCount((matchesRaw ?? []).length);

      const listBase = activeTab === 'matches' ? matchesRaw ?? [] : requestsData ?? [];

      const list = listBase.map((data: any) => {
        const isOwner = data.de === user.id;
        return {
          matchId: data.id,
          id: isOwner ? data.para : data.de,
          nome: isOwner ? data.nomePara : data.nomeDe,
          foto: isOwner ? data.fotoPara : data.fotoDe,
          bio: isOwner ? data.bioPara : data.bioDe,
          habilidades: isOwner ? data.habilidadesPara : data.habilidadesDe,
          objetivo: isOwner ? data.objetivoPara : data.objetivoDe,
          valor: isOwner ? data.valorPara : data.valorDe,
          pagamento: isOwner ? data.pagamentoPara : data.pagamentoDe,
        };
      });

      setDataList(list);
    } catch (error) {
      console.error('Erro ao carregar matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const { error } = await supabase
        .from('curtidas')
        .update({ status: 'matched', match_date: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      Alert.alert('Sucesso!', 'Match realizado!');
    } catch {
      Alert.alert('Erro', 'Não foi possível aceitar o match.');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase.from('curtidas').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={item.foto ? { uri: item.foto } : { uri: `https://ui-avatars.com/api/?name=${item.nome}&background=00D1FF&color=fff` }}
          style={styles.avatar}
        />
        <View style={styles.mainInfo}>
          <Text style={styles.name}>{item.nome}</Text>
          <Text style={styles.bioText} numberOfLines={2}>
            {item.bio || 'Sem bio disponível'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsBox}>
        {myRole === 'cliente' ? (
          <View>
            <Text style={styles.detailLabel}>HABILIDADES:</Text>
            <Text style={styles.detailValue}>{item.habilidades || 'Não informado'}</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.detailLabel}>
              PROJETO: <Text style={styles.detailValue}>{item.objetivo || 'Não informado'}</Text>
            </Text>
            <View style={styles.row}>
              <Text style={styles.detailLabel}>
                VALOR: <Text style={styles.detailValue}>R$ {item.valor || '---'}</Text>
              </Text>
              <Text style={[styles.detailLabel, { marginLeft: 15 }]}>
                MODO: <Text style={styles.detailValue}>{item.pagamento || '---'}</Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {activeTab === 'matches' ? (
          <>
            <TouchableOpacity
              style={styles.btnChat}
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: item.matchId, nome: item.nome },
                })
              }
            >
              <Ionicons name="chatbubbles" size={18} color="#0A0E17" />
              <Text style={styles.btnChatText}>Conversar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDecline(item.matchId)} style={styles.btnTrash}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => handleAccept(item.matchId)} style={styles.btnAccept}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.btnAcceptText}>Aceitar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDecline(item.matchId)} style={styles.btnDecline}>
              <Text style={styles.btnDeclineText}>Recusar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('matches')} style={[styles.tab, activeTab === 'matches' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>Meus Matchs ({matchCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('requests')} style={[styles.tab, activeTab === 'requests' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Solicitações ({requestCount})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00D1FF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={(item) => item.matchId}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>Ninguém por aqui... 🦉</Text>}
          contentContainerStyle={{ padding: 15 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  tabBar: { flexDirection: 'row', paddingTop: 60, backgroundColor: '#161B22' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#00D1FF' },
  tabText: { color: '#555', fontWeight: 'bold', fontSize: 13 },
  activeTabText: { color: '#00D1FF' },
  card: { backgroundColor: '#161B22', borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#30363d' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 55, height: 55, borderRadius: 28, borderWidth: 2, borderColor: '#00D1FF' },
  mainInfo: { flex: 1, marginLeft: 15 },
  name: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  bioText: { color: '#888', fontSize: 12, marginTop: 2 },
  detailsBox: { backgroundColor: '#0A0E17', borderRadius: 12, padding: 12, marginBottom: 15 },
  detailLabel: { color: '#E67E22', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  detailValue: { color: '#DDD', fontSize: 13, fontWeight: 'normal' },
  row: { flexDirection: 'row', marginTop: 5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnChat: { flex: 1, backgroundColor: '#00D1FF', flexDirection: 'row', height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnChatText: { color: '#0A0E17', fontWeight: 'bold', marginLeft: 8 },
  btnTrash: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF444415' },
  btnAccept: { flex: 1, backgroundColor: '#00FF7F', flexDirection: 'row', height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnAcceptText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  btnDecline: { flex: 1, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF4444' },
  btnDeclineText: { color: '#FF4444', fontWeight: 'bold' },
  empty: { color: '#555', textAlign: 'center', marginTop: 100 },
});