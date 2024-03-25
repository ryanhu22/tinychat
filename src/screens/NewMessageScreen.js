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

const NewMessageScreen = ({ navigation }) => {
  const messageInputRef = useRef(null);
  const [receiverUsername, setReceiverUsername] = useState("");

  const [addReceiverAvailable, setAddReceiverAvailable] = useState(true);

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log("AsyncStorage has been cleared!");
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error.message);
    }
  };

  const getUserData = async () => {
    try {
      const jsonString = await AsyncStorage.getItem("userData");
      if (jsonString !== null) {
        // We have data!!
        const userData = JSON.parse(jsonString);
        return userData;
      } else {
        console.log("No user data found");
        return null; // No user data stored
      }
    } catch (error) {
      console.error("AsyncStorage error: ", error.message);
      return null; // In case of error, return null or handle accordingly
    }
  };

  const fetchUserData = async (userEmail) => {
    // Reference to the "users" collection
    const usersRef = collection(db, "users");

    // Create a query against the collection for the receiver_username
    const q = query(usersRef, where("email", "==", userEmail));
    // Execute the query
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("No user found.");
      return null; //
    } else {
      const userData = querySnapshot.docs[0].data();
      return userData;
    }
  };

  async function findOrCreateConversation(receiverUsername) {
    const userData = await getUserData();
    const receiverData = await fetchUserData(receiverUsername);
    // Reference to the "conversations" collection
    const conversationsRef = collection(db, "conversations");

    // First query: find conversations that include the current user
    const queryUser = query(
      conversationsRef,
      where("userEmails", "array-contains", userData.email)
    );

    // Second query: find conversations that include the receiver
    const queryReceiver = query(
      conversationsRef,
      where("userEmails", "array-contains", receiverData.email)
    );

    try {
      // Execute both queries
      const [userSnap, receiverSnap] = await Promise.all([
        getDocs(queryUser),
        getDocs(queryReceiver),
      ]);

      // Extract conversation IDs from both query results
      const userConversations = new Set(userSnap.docs.map((doc) => doc.id));
      const receiverConversations = new Set(
        receiverSnap.docs.map((doc) => doc.id)
      );
      console.log("User Conversations IDs:", [...userConversations]);
      console.log("Receiver Conversations IDs:", [...receiverConversations]);

      // Find the intersection of both sets (conversation IDs present in both)
      const commonConversations = [...userConversations].filter((id) =>
        receiverConversations.has(id)
      );

      if (commonConversations.length > 0) {
        // If there are common conversations, proceed with the first one found
        console.log(
          `Common conversation found with ID: ${commonConversations[0]}`
        );
        return commonConversations[0]; // or handle multiple common conversations as needed
      } else {
        // Create a new conversation
        const newConversationRef = await addDoc(conversationsRef, {
          conversation_id: uuid.v1(), // Consider using Firestore's automatic document IDs instead
          last_message: "Test message",
          last_message_timestamp: serverTimestamp(),
          userEmails: [userData.email, receiverData.email], // Example: using email to identify users
        });
        console.log(
          `New conversation created with ID: ${newConversationRef.id}`
        );
        return newConversationRef.id;
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
