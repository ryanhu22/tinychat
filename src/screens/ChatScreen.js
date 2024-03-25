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

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const { conversationId, receiverName, receiverEmail } = route.params;

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
          <Text className="text-black font-bold">{receiverName}</Text>
        </View>
      ),
    });
  }, [navigation]);

  const onSend = useCallback((messages = []) => {
    if (messages.length === 0) return;

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );

    // Immediately handle the first message
    const { _id, text, user } = messages[0];

    // Define an async function to handle Firestore operations
    const sendMessage = async () => {
      // Add message to "messages" collection for the current conversation
      await addDoc(collection(db, "messages"), {
        conversation_id: conversationId,
        createdAt: serverTimestamp(),
        message_id: _id,
        text,
        user,
      });

      // Update receiver's DB
      try {
        const myData = await getMyData();

        // If you send a message to yourself, you should only see one message
        if (receiverEmail === myData.email) {
          console.log("Sending a message to myself");
          return null;
        }

        // Query to find the receiver's conversation based on sender and receiver emails
        const conversationsRef = collection(db, "conversations");
        const q = query(
          conversationsRef,
          where("sender_email", "==", receiverEmail), // Assuming `user.email` is sender's email
          where("receiver_email", "==", myData.email) // Assuming `myData.email` is receiver's email
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const snapshotConversationId = querySnapshot.docs[0].id;

          // If a conversation is found, add the message to "messages" collection for the receiver
          await addDoc(collection(db, "messages"), {
            conversation_id: snapshotConversationId,
            createdAt: serverTimestamp(),
            message_id: _id,
            text,
            user,
          });
        }
      } catch (error) {
        console.error("Error sending message: ", error);
      }

      // Update Conversations DB
      try {
        const conversationsRef = collection(db, "conversations");
        const docRef = doc(conversationsRef, conversationId);

        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          console.log(docSnapshot.data());

          // Update the last message and timestamp of the conversation
          await setDoc(
            docRef,
            {
              last_message: text,
              last_message_timestamp: serverTimestamp(),
            },
            { merge: true }
          ); // Use merge: true to only update provided fields
        } else {
          console.log("No such conversation exists!");
        }
      } catch (error) {
        console.error("Error updating conversations db: ", error);
      }
    };

    // Execute the async operation
    sendMessage().catch(console.error);
  }, []); // Add necessary dependencies

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
