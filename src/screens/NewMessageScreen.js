import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Ionicons,
  FontAwesome,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import {
  collection,
  addDoc,
  orderBy,
  where,
  query,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import uuid from "react-native-uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyData, fetchUserData } from "../services/utils";

const NewMessageScreen = ({ navigation }) => {
  const messageInputRef = useRef(null);
  const [receiverUsername, setReceiverUsername] = useState("");
  const [addReceiverAvailable, setAddReceiverAvailable] = useState(true);

  async function findOrCreateConversation(receiverUsername) {
    const myData = await getMyData();
    console.log(myData);
    const receiverData = await fetchUserData(receiverUsername);
    if (!receiverData) {
      console.error("User not found");
      return null;
    }
    const conversationsRef = collection(db, "conversations");

    // Query if conversation already exists
    const q = query(
      conversationsRef,
      where("sender_email", "==", myData.email),
      where("receiver_email", "==", receiverData.email)
    );

    try {
      // Execute query
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const conversationId = querySnapshot.docs[0].id;
        // If there are common conversations, proceed with the first one found
        console.log(`Common conversation found with ID: ${conversationId}`);
        await navigation.goBack();
        await navigation.navigate("Chat", {
          conversationId: conversationId,
          receiverName: `${receiverData.first_name} ${receiverData.last_name}`,
          receiverEmail: receiverData.email,
          myAvatar: myData.avatar,
        });
      } else {
        // Create a new conversation
        const primaryConversationRef = await addDoc(conversationsRef, {
          last_message: "",
          last_message_timestamp: serverTimestamp(),
          receiver_email: receiverData.email,
          sender_email: myData.email,
          is_unread: false,
        });

        await navigation.goBack();
        await navigation.navigate("Chat", {
          conversationId: primaryConversationRef.id,
          receiverName: `${receiverData.first_name} ${receiverData.last_name}`,
          receiverEmail: receiverData.email,
          myAvatar: myData.avatar,
        });

        // If you create a conversation with yourself, you should only create one conversation
        if (receiverData.email === myData.email) {
          console.log("Creating a conversation with myself");
          return null;
        }

        // Needed: Create a new conversation (inverse) for receiver
        const secondaryConversationRef = await addDoc(conversationsRef, {
          last_message: "",
          last_message_timestamp: serverTimestamp(),
          receiver_email: myData.email,
          sender_email: receiverData.email,
          is_unread: false,
        });

        console.log(
          `New conversations created with IDs: [${primaryConversationRef.id}, ${secondaryConversationRef.id}]`
        );
        return null;
      }
    } catch (error) {
      console.error("Error finding conversation:", error);
      throw error;
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="px-4 py-4 flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center my-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-12"
          >
            <Text className="text-blue-500 underline">Cancel</Text>
          </TouchableOpacity>
          <Text className="font-bold text-lg">New Message</Text>
          <View className="w-12"></View>
        </View>
        {/* To Address */}
        <View className="my-4 flex-row space-x-2">
          <Text className="text-gray-500">To:</Text>
          <TextInput
            autoFocus={true}
            autoCapitalize="none"
            className="flex-1"
            enablesReturnKeyAutomatically={true}
            onChangeText={setReceiverUsername}
            onSubmitEditing={() => {
              messageInputRef.current && messageInputRef.current.focus();
            }}
          />
          <TouchableOpacity
            onPress={() => findOrCreateConversation(receiverUsername)}
            disabled={!addReceiverAvailable} // The button is disabled if `setAddReceiverAvailable` is false
          >
            <FontAwesome5 name="plus-square" size={24} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default NewMessageScreen;
