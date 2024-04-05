import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  orderBy,
  query,
  onSnapshot,
  toDate,
  where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Entypo } from "@expo/vector-icons";

import ConversationPreview from "../components/ConversationPreview";
import Footer from "../components/Footer";
import { getMyData, fetchUserData, clearAsyncStorage } from "../services/utils";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [avatar, setAvatar] = useState(
    "https://firebasestorage.googleapis.com/v0/b/tinychat-0613.appspot.com/o/default_profile_picture.jpeg?alt=media&token=aabbaef0-3ec5-448d-919a-dc8fe20b0605"
  );
  const defaultAvatar =
    "https://firebasestorage.googleapis.com/v0/b/tinychat-0613.appspot.com/o/default_profile_picture.jpeg?alt=media&token=aabbaef0-3ec5-448d-919a-dc8fe20b0605";
  const [conversations, setConversations] = useState([]);

  useLayoutEffect(() => {
    const fetchData = async () => {
      const myData = await getMyData();
      if (!myData) {
        return;
      }
      const myDBData = await fetchUserData(myData.email);
      if (myDBData && myDBData.avatar) {
        setAvatar(myDBData.avatar);
      }
      const conversationsRef = collection(db, "conversations");

      // Query MY conversations
      const q = query(
        conversationsRef,
        where("sender_email", "==", myData.email),
        where("last_message", "!=", ""),
        orderBy("last_message_timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const conversationsPromises = querySnapshot.docs.map(async (doc) => {
          const receiverData = await fetchUserData(doc.data().receiver_email);
          return {
            conversation_id: doc.id,
            last_message: doc.data().last_message,
            last_message_timestamp: doc.data().last_message_timestamp?.toDate(),
            receiver_name: `${receiverData.first_name} ${receiverData.last_name}`,
            receiver_email: doc.data().receiver_email,
            is_unread: doc.data().is_unread,
            avatar: receiverData.avatar ? receiverData.avatar : "",
          };
        });

        // Wait for all the fetchUserData promises to resolve
        const conversations = await Promise.all(conversationsPromises);
        setConversations(conversations);
      });

      return unsubscribe;
    };

    fetchData().catch(console.error);

    // Cleanup function
    return () => {
      // If fetchData is fast, unsubscribe might not be set immediately.
      // Consider managing unsubscribe state or ensuring fetchData resolves before cleanup.
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Image
            source={{ uri: avatar }}
            style={{ width: 32, height: 32, borderRadius: 16 }} // Use inline styles or a StyleSheet object
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("NewMessage")}>
          <Entypo name="new-message" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, avatar]);

  const deleteConversation = async (conversationId) => {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await deleteDoc(conversationRef);
      console.log(`Conversation with ID ${conversationId} has been deleted.`);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const alertDelete = (conversationId) => {
    Alert.alert(
      "Delete Conversation", // Alert Title
      "Are you sure you want to delete this conversation?", // Alert Message
      [
        { text: "Cancel", style: "cancel" }, // Cancel button
        {
          // Confirm button
          text: "Delete",
          style: "destructive",
          onPress: () => deleteConversation(conversationId), // Call deleteConversation if confirmed
        },
      ],
      { cancelable: true } // Make it so tapping outside dismisses the alert
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-white h-full">
        {conversations.length > 0
          ? conversations.map((conversation) => (
              <ConversationPreview
                key={conversation.conversation_id}
                navigateChat={() => {
                  navigation.navigate("Chat", {
                    conversationId: conversation.conversation_id,
                    receiverName: conversation.receiver_name,
                    receiverEmail: conversation.receiver_email,
                    receiverAvatar: conversation.avatar
                      ? conversation.avatar
                      : defaultAvatar,
                    myAvatar: avatar,
                  });
                }}
                msgAvatar={
                  conversation.avatar ? conversation.avatar : defaultAvatar
                }
                msgName={conversation.receiver_name}
                msgEmail={conversation.receiver_email}
                msgLastMessage={conversation.last_message}
                msgLastMessageTimestamp={conversation.last_message_timestamp}
                msgIsUnread={conversation.is_unread}
                onDelete={() => alertDelete(conversation.conversation_id)} // Pass a function that calls deleteConversation
              />
            ))
          : null}
      </ScrollView>
      <Footer selected="Chats" />
    </View>
  );
};

export default HomeScreen;
