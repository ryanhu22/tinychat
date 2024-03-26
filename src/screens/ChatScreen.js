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
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { GiftedChat } from "react-native-gifted-chat";
import { getMyData, fetchUserData } from "../services/utils";
import DefaultProfilePicture from "../assets/images/default_profile_picture.jpeg";

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const { conversationId, receiverName, receiverEmail, receiverAvatar } =
    route.params;

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
      // Mark conversation as read
      readConversation(conversationId);
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
            source={
              receiverAvatar ? { uri: receiverAvatar } : DefaultProfilePicture
            }
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <Text className="text-black font-bold">{receiverName}</Text>
        </View>
      ),
    });
  }, [navigation]);

  const addMessageToFirestore = async (conversationId, _id, text, user) => {
    await addDoc(collection(db, "messages"), {
      conversation_id: conversationId,
      createdAt: serverTimestamp(),
      message_id: _id,
      text,
      user,
    });
  };

  const readConversation = async (conversationId) => {
    const docRef = doc(db, "conversations", conversationId);
    await setDoc(
      docRef,
      {
        is_unread: false,
      },
      { merge: true }
    );
  };

  const updateConversationLastMessage = async (
    conversationId,
    text,
    is_unread
  ) => {
    const docRef = doc(db, "conversations", conversationId);
    await setDoc(
      docRef,
      {
        last_message: text,
        last_message_timestamp: serverTimestamp(),
        is_unread: is_unread,
      },
      { merge: true }
    );
  };

  const findReceiverConversationId = async (receiverEmail, myEmail) => {
    const q = query(
      collection(db, "conversations"),
      where("sender_email", "==", receiverEmail),
      where("receiver_email", "==", myEmail)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? "" : querySnapshot.docs[0].id;
  };

  const onSend = useCallback(
    (messages = []) => {
      if (messages.length === 0) return;

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages)
      );

      const handleSendMessage = async () => {
        const { _id, text, user } = messages[0];
        const myData = await getMyData();

        await addMessageToFirestore(conversationId, _id, text, user);

        if (receiverEmail !== myData.email) {
          const receiverConversationId = await findReceiverConversationId(
            receiverEmail,
            myData.email
          );
          if (receiverConversationId) {
            await addMessageToFirestore(
              receiverConversationId,
              _id,
              text,
              user
            );
            // Update receiver's conversations DB
            await updateConversationLastMessage(
              receiverConversationId,
              text,
              true
            );
          }
        } else {
          console.log("Sending a message to myself");
        }

        await updateConversationLastMessage(conversationId, text, false);
      };

      handleSendMessage().catch(console.error);
    },
    [setMessages, conversationId]
  ); // Ensure to include all dependencies used within the callback

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: auth?.currentUser?.email,
        // avatar: { receiverAvatar },
      }}
      messagesContainerStyle={{
        backgroundColor: "#fff",
      }}
    />
  );
};

export default ChatScreen;
