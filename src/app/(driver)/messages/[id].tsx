import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';

export default function DriverChatScreen() {
  const { id: receiverId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverName, setReceiverName] = useState('Manager');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user?.id && receiverId) {
      fetchReceiver();
      fetchMessages();

      const channel = supabase
        .channel(`chat_${user.id}_${receiverId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `sender_id=eq.${receiverId}` // Listen for messages from them to us
          }, (payload) => {
            if (payload.new.receiver_id === user.id) {
              setMessages(prev => [...prev, payload.new]);
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, receiverId]);

  const fetchReceiver = async () => {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', receiverId).single();
    if (data?.full_name) setReceiverName(data.full_name);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;
    
    const msgText = newMessage.trim();
    setNewMessage('');
    
    // Optimistic UI update
    const tempMsg = {
      id: Math.random().toString(),
      sender_id: user.id,
      receiver_id: receiverId,
      message: msgText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: receiverId,
      message: msgText
    }]);

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(driver)/messages')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receiverName}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !newMessage.trim() && { opacity: 0.5 }]} 
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'android' ? 40 : 16
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  messagesContainer: { padding: 16, paddingBottom: 20 },
  messageBubble: { 
    maxWidth: '80%', 
    padding: 12, 
    borderRadius: 16,
    marginBottom: 12 
  },
  myMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#043094',
    borderBottomRightRadius: 4
  },
  theirMessage: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#111827' },
  messageTime: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  myMessageTime: { color: '#E0E7FF' },
  theirMessageTime: { color: '#9CA3AF' },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 12, 
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    marginRight: 12,
    color: '#111827'
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#043094',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2
  }
});
