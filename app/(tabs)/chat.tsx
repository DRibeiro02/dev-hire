import { supabase } from '@/src/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ChatListScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadChats = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('curtidas')
        .select('*')
        .eq('status', 'matched')
        .or(`de.eq.${user.id},para.eq.${user.id}`);

      if (error) {
        console.error(error);
        return;
      }

      const list = (data ?? []).map((item: any) => {
        const isOwner = item.de === user.id;
        return {
          id: item.id,
          nome: isOwner ? item.nomePara : item.nomeDe,
          foto: isOwner ? item.fotoPara : item.fotoDe,
        };
      });

      setChats(list);
    };

    loadChats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mensagens</Text>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatCard}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, nome: item.nome } })}
          >
            <Image
              source={item.foto ? { uri: item.foto } : { uri: `https://ui-avatars.com/api/?name=${item.nome}` }}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.nome}</Text>
              <Text style={styles.lastMsg}>Clique para abrir a conversa...</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum chat ativo ainda.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17', padding: 25, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  chatCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#161B22', padding: 15, borderRadius: 15 },
  avatar: { width: 55, height: 55, borderRadius: 27.5 },
  info: { marginLeft: 15 },
  name: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  lastMsg: { color: '#888', fontSize: 13, marginTop: 4 },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 50 },
});