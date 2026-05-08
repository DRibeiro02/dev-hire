import { supabase } from '@/src/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export default function ChatScreen() {
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user || !id) return;

      setMyUserId(user.id);

      // Carrega histórico
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
      } else {
        setMessages((data as ChatMessage[]) ?? []);
      }

      // Realtime para novas mensagens deste match
      const channel = supabase
        .channel(`chat-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens',
            filter: `match_id=eq.${id}`,
          },
          (payload) => {
            const nova = payload.new as ChatMessage;
            setMessages((prev) => [...prev, nova]);
          }
        )
        .subscribe();

      return channel;
    };

    let channelRef: any;

    bootstrap().then((ch) => {
      channelRef = ch;
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [id]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !id || !myUserId) return;

    // Optimistic update opcional removido para evitar duplicata com realtime
    const { error } = await supabase.from('mensagens').insert({
      match_id: id,
      sender_id: myUserId,
      text,
    });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return;
    }

    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00D1FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nome || 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender_id === myUserId ? styles.myMessage : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#555"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#0A0E17" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  messageBubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#00D1FF' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#30363d' },
  messageText: { color: '#FFF', fontSize: 15 },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#161B22',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0A0E17',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFF',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#00D1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});