import { View, Text, TouchableOpacity, Image } from "react-native";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  collection,
  addDoc,
  orderBy,
  where,
  query,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { GiftedChat } from "react-native-gifted-chat";

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const { conversationId } = route.params;

  useLayoutEffect(() => {
    // Reference to the "messages" collection
    const collectionRef = collection(db, "messages");
    // Modify the query to filter by `conversationId` and order by `createdAt`
    const q = query(
      collectionRef,
      where("conversation_id", "==", conversationId),
      orderBy("createdAt", "desc")
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("Snapshot");
      setMessages(
        querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt
            ? data.createdAt.toDate()
            : new Date(); // Fallback to current date if null
          return {
            _id: doc.id,
            createdAt,
            text: data.text,
            user: data.user,
          };
        })
      );
    });
    // Cleanup function to unsubscribe from the listener
    return () => unsubscribe();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Inbox")}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => {}, // Keeps an empty header right to maintain balance if needed
      headerTitle: () => (
        <View className="flex-row items-center space-x-2">
          <Image
            source={{ uri: "https://i.pravatar.cc/300" }} // Replace with your avatar image URI
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <Text className="text-black font-bold">User Name</Text>
        </View>
      ),
    });
  }, [navigation]);

  const onSend = useCallback((messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );

    const { _id, text, user } = messages[0];
    addDoc(collection(db, "messages"), {
      conversation_id: conversationId,
      createdAt: serverTimestamp(),
      message_id: _id,
      text,
      user,
    });
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: auth?.currentUser?.email,
        avatar: "https://i.pravatar.cc/300",
      }}
      messagesContainerStyle={{
        backgroundColor: "#fff",
      }}
    />
  );
};

export default ChatScreen;
