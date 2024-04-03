import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
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
  where,
  query,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { GiftedChat, InputToolbar, Send } from "react-native-gifted-chat";
import { getMyData, fetchUserData } from "../services/utils";
import DefaultProfilePicture from "../assets/images/default_profile_picture.jpeg";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const {
    conversationId,
    receiverName,
    receiverEmail,
    receiverAvatar,
    myAvatar,
  } = route.params;

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
      const messages = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt ? data.createdAt.toDate() : new Date(); // Fallback to current date if null
        return {
          _id: doc.id,
          createdAt,
          text: data.text,
          user: data.user,
          read_checkpoint: data.read_checkpoint || false, // Assuming you have a field like this
        };
      });

      // Set the messages state with the new messages
      setMessages(messages);

      // If there are messages and the first one is the most recent
      if (messages.length > 0 && !messages[0].read_checkpoint) {
        const mostRecentMessage = messages[0];
        const messageRef = doc(db, "messages", mostRecentMessage._id);

        // Mark the most recent message as read
        updateDoc(messageRef, {
          read_checkpoint: true,
        }).catch((error) =>
          console.error("Error updating message read checkpoint:", error)
        );
      }

      readConversation(conversationId);
    });

    // Cleanup function to unsubscribe from the listener
    return () => unsubscribe();
  }, [conversationId, db]);

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

  const addMessageToFirestore = async (
    conversationId,
    _id,
    text,
    user,
    read_checkpoint
  ) => {
    await addDoc(collection(db, "messages"), {
      conversation_id: conversationId,
      createdAt: serverTimestamp(),
      message_id: _id,
      read_checkpoint,
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

        // Add message to my own Firestore DB
        await addMessageToFirestore(conversationId, _id, text, user, true);

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
              user,
              false
            );
            // Update receiver's conversations DB
            await updateConversationLastMessage(
              receiverConversationId,
              text,
              true
            );
          } else {
            // Receiver likely deleted the conversation, so create a new one
            // Needed: Create a new conversation (inverse) for receiver
            const receiverConversationRef = await addDoc(
              collection(db, "conversations"),
              {
                last_message: "",
                last_message_timestamp: serverTimestamp(),
                receiver_email: myData.email,
                sender_email: receiverEmail,
                is_unread: false,
              }
            );
            // Send message
            await addMessageToFirestore(
              receiverConversationRef.id,
              _id,
              text,
              user,
              false
            );
            // Update receiver's conversations DB
            await updateConversationLastMessage(
              receiverConversationRef.id,
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

  // Custom Components
  const customInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: "white",
          borderColor: "#E8E8E8",
          borderWidth: 1, // Width of the border
          borderRadius: 20, // Adjust this value as needed for desired roundness
          paddingVertical: 0, // Optional: Adjusts the height slightly if needed
          marginLeft: wp(5),
          marginRight: wp(15),
        }}
        textInputStyle={{
          textAlignVertical: "center", // Center the text vertically
          marginTop: 0, // Adjust top margin if necessary
          marginBottom: 0, // Adjust bottom margin if necessary
          height: "auto", // Adjust height to auto for flexible sizing
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send
        {...props}
        containerStyle={{
          borderWidth: 0, // Width of the border
          left: wp(10),
          justifyContent: "center",
        }}
      >
        <View className="">
          <FontAwesome name="send" size={24} color="black" />
        </View>
      </Send>
    );
  };

  const scrollToBottomComponent = () => {
    return <FontAwesome name="angle-double-down" size={22} color="#333" />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: auth?.currentUser?.email,
          avatar: myAvatar,
        }}
        messagesContainerStyle={{
          backgroundColor: "#fff",
        }}
        alwaysShowSend
        renderInputToolbar={(props) => customInputToolbar(props)}
        renderSend={renderSend}
        scrollToBottom
        scrollToBottomComponent={scrollToBottomComponent}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
