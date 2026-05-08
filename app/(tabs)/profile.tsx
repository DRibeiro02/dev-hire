import { supabase } from '@/src/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
  
    if (authError || !user) {
      setIsLoading(false);
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
  
      if (error) throw error;
  
      if (!data) {
        const tipoDoUsuario = (user.user_metadata?.tipo as 'dev' | 'cliente') ?? 'cliente';
        const nomeDoUsuario = user.user_metadata?.nome_completo ?? user.email?.split('@')[0] ?? 'Usuário';
        const novoPerfil = {
          id: user.id,
          nome_completo: user.user_metadata?.nomeCompleto ?? user.email?.split('@')[0] ?? 'Usuário',
          email: user.email,
          tipo: (user.user_metadata?.tipo as 'dev' | 'cliente') ?? 'cliente',
        };
  
        const { error: createError } = await supabase.from('usuarios').insert(novoPerfil as any);
        if (createError) throw createError;
  
        setUserData(novoPerfil);
        setBioText('');
        return;
      }
  
      setUserData(data);
      setBioText((data as any)?.bio || '');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos de permissão para acessar sua galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const filePath = `${user.id}/avatar.jpg`;

const { error: uploadError } = await supabase.storage
  .from('fotos-perfis')
  .upload(filePath, blob, {
    upsert: true,
    contentType: 'image/jpeg',
  });

if (uploadError) throw uploadError;

const { data: publicData } = supabase.storage
  .from('fotos-perfis')
  .getPublicUrl(filePath);

const photoUrl = publicData.publicUrl;

const { error: updateError } = await supabase
  .from('usuarios')
  .update({ foto_perfil: photoUrl })
  .eq('id', user.id);

if (updateError) throw updateError;

setUserData((prev: any) => ({ ...prev, foto_perfil: photoUrl }));
      Alert.alert('Sucesso!', 'Foto de perfil atualizada.');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível enviar sua foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleEditBio = () => {
    setBioText(userData?.bio || '');
    setIsEditingBio(true);
  };

  const handleCancelBio = () => {
    setBioText(userData?.bio || '');
    setIsEditingBio(false);
  };

  const handleSaveBio = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) return;

    if (bioText.length > 300) {
      Alert.alert('Ops!', 'A bio deve ter no máximo 300 caracteres.');
      return;
    }

    setIsSavingBio(true);

    try {
      const { error } = await supabase.from('usuarios').update({ bio: bioText }).eq('id', user.id);

      if (error) throw error;

      setUserData((prev: any) => ({ ...prev, bio: bioText }));
      setIsEditingBio(false);
      Alert.alert('Sucesso!', 'Biografia atualizada.');
    } catch (error) {
      console.error('Erro ao salvar bio:', error);
      Alert.alert('Erro', 'Não foi possível salvar sua biografia.');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erro', 'Não foi possível sair.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.photoContainer}>
            {userData?.foto_perfil ? (
              <Image source={{ uri: userData.foto_perfil }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{userData?.nome_completo?.[0] || 'D'}</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="camera" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.insertPhotoText}>{uploading ? 'Enviando foto...' : 'Alterar Foto de Perfil'}</Text>
          </TouchableOpacity>

          <Text style={styles.name}>{userData?.nome_completo}</Text>
          <Text style={styles.email}>{userData?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{userData?.tipo === 'dev' ? 'Desenvolvedor' : 'Cliente'}</Text>
          </View>
        </View>

        <View style={styles.sectionBio}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Sobre Mim</Text>
            {!isEditingBio && (
              <TouchableOpacity onPress={handleEditBio} style={styles.editBioButton}>
                <Ionicons name="pencil-outline" size={16} color="#00D1FF" />
                <Text style={styles.editBioText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingBio ? (
            <View style={styles.editBioContainer}>
              <TextInput
                style={styles.bioInput}
                multiline
                numberOfLines={4}
                maxLength={300}
                value={bioText}
                onChangeText={setBioText}
                placeholder="Escreva um breve resumo..."
                placeholderTextColor="#555"
              />
              <Text style={styles.charCount}>{bioText.length}/300</Text>
              <View style={styles.bioActionRow}>
                <TouchableOpacity onPress={handleCancelBio} style={styles.btnBioCancel}>
                  <Text style={styles.btnBioCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveBio} style={styles.btnBioSave} disabled={isSavingBio}>
                  {isSavingBio ? <ActivityIndicator size="small" color="#0A0E17" /> : <Text style={styles.btnBioSaveText}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.textBio}>{userData?.bio || "Toque em 'Editar' para adicionar uma biografia..."}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <InfoItem icon="card-outline" label="CPF" value={userData?.cpf} />
          <InfoItem icon="location-outline" label="CEP" value={userData?.cep} />
          <InfoItem icon="call-outline" label="Telefone" value={userData?.telefone} />
          <InfoItem icon="calendar-outline" label="Data Nasc." value={userData?.data_nascimento} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habilidades e Stacks</Text>
          <Text style={styles.textValue}>{userData?.habilidades || 'Não informado'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GitHub/Portfólio</Text>
          <TouchableOpacity onPress={() => userData?.github && Linking.openURL(userData.github || 'https://github.com')}>
            <Text style={styles.linkValue}>{userData?.github || userData?.github || 'https://github.com'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          <Text style={styles.btnLogoutText}>Sair</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoItem = ({ icon, label, value }: any) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={22} color="#00D1FF" />
    <View style={{ marginLeft: 15 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '---'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
  loading: { flex: 1, backgroundColor: '#0A0E17', justifyContent: 'center' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#161B22', borderBottomWidth: 1, borderBottomColor: '#1C2431' },
  photoContainer: { width: 110, height: 110, borderRadius: 55, position: 'relative', marginBottom: 10 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#00D1FF' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#30363d', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00D1FF' },
  avatarInitial: { fontSize: 45, fontWeight: 'bold', color: '#00D1FF' },
  cameraIconBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#555', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#161B22' },
  insertPhotoText: { color: '#00D1FF', fontSize: 13, marginBottom: 15, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  email: { fontSize: 14, color: '#888', marginTop: 4 },
  badge: { backgroundColor: '#E67E22', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 12, marginTop: 12 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  sectionBio: { paddingHorizontal: 25, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#1C2431', backgroundColor: '#0A0E17' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editBioButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1C2431' },
  editBioText: { color: '#00D1FF', fontSize: 12, marginLeft: 5, fontWeight: '600' },
  textBio: { color: '#AAA', fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  editBioContainer: { width: '100%' },
  bioInput: { backgroundColor: '#161B22', color: '#FFF', fontSize: 14, lineHeight: 20, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1C2431', textAlignVertical: 'top', minHeight: 100 },
  charCount: { color: '#555', fontSize: 11, textAlign: 'right', marginTop: 5 },
  bioActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, gap: 10 },
  btnBioCancel: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  btnBioCancelText: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  btnBioSave: { backgroundColor: '#00D1FF', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  btnBioSaveText: { color: '#0A0E17', fontSize: 14, fontWeight: 'bold' },
  section: { paddingHorizontal: 25, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#1C2431' },
  sectionTitle: { color: '#E67E22', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  infoLabel: { color: '#555', fontSize: 11 },
  infoValue: { color: '#FFF', fontSize: 16, marginTop: 2 },
  textValue: { color: '#DDD', fontSize: 15, lineHeight: 22 },
  linkValue: { color: '#00D1FF', fontSize: 15, textDecorationLine: 'underline' },
  btnLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 25, padding: 18, borderRadius: 15, backgroundColor: '#FF444411', borderWidth: 1, borderColor: '#FF444433' },
  btnLogoutText: { color: '#FF4444', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});