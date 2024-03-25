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
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Entypo } from "@expo/vector-icons";

import ConversationPreview from "../components/ConversationPreview";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);

  useLayoutEffect(() => {
    const collectionRef = collection(db, "conversations");
    const q = query(collectionRef, orderBy("last_message_timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log("Snapshot");
      setConversations(
        querySnapshot.docs.map((doc) => ({
          conversation_id: doc.data().conversation_id,
          last_message: doc.data().last_message,
          last_message_timestamp: doc
            .data()
            .last_message_timestamp?.toDate()
            .toLocaleString(), // Corrected method name here
          receiver_name: doc.data().receiver_name,
          receiver_username: doc.data().receiver_username,
        }))
      );
    });
    return () => unsubscribe();
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
    console.log("HERE");
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
            navigateChat={() =>
              navigation.navigate("Chat", {
                conversationId: conversation.conversation_id,
              })
            }
            msgAvatar={"https://i.pravatar.cc/300"}
            msgName={conversation.receiver_name}
            msgLastMessage={conversation.last_message}
            msgLastMessageTimestamp={conversation.last_message_timestamp}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
