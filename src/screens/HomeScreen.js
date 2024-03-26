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
  addDoc,
  orderBy,
  query,
  onSnapshot,
  toDate,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Entypo } from "@expo/vector-icons";

import ConversationPreview from "../components/ConversationPreview";
import { getMyData, fetchUserData, clearAsyncStorage } from "../services/utils";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);

  useLayoutEffect(() => {
    const fetchData = async () => {
      const myData = await getMyData();
      const conversationsRef = collection(db, "conversations");

      // Query MY conversations
      const q = query(
        conversationsRef,
        where("sender_email", "==", myData.email),
        orderBy("last_message_timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        console.log("Snapshot");
        const conversationsPromises = querySnapshot.docs.map(async (doc) => {
          const receiverData = await fetchUserData(doc.data().receiver_email);
          return {
            conversation_id: doc.id,
            last_message: doc.data().last_message,
            last_message_timestamp: doc
              .data()
              .last_message_timestamp?.toDate()
              .toLocaleString(),
            receiver_name: `${receiverData.first_name} ${receiverData.last_name}`,
            receiver_email: doc.data().receiver_email,
            is_unread: doc.data().is_unread,
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
        <TouchableOpacity onPress={handleSignOut}>
          <Entypo name="menu" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("NewMessage")}>
          <Entypo name="new-message" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSignOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            clearAsyncStorage();
            signOut(auth)
              .then(() => {
                // Sign-out successful.
                console.log("Logged out successfully");
              })
              .catch((error) => {
                // An error happened.
                console.error("Error logging out", error);
              });
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View className="bg-white">
      <ScrollView className="bg-white h-full">
        {conversations.map((conversation) => (
          <ConversationPreview
            key={conversation.conversation_id}
            navigateChat={() => {
              navigation.navigate("Chat", {
                conversationId: conversation.conversation_id,
                receiverName: conversation.receiver_name,
                receiverEmail: conversation.receiver_email,
              });
            }}
            msgAvatar={"https://i.pravatar.cc/300"}
            msgName={conversation.receiver_name}
            msgLastMessage={conversation.last_message}
            msgLastMessageTimestamp={conversation.last_message_timestamp}
            msgIsUnread={conversation.is_unread}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
