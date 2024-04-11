import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from "react-native";
import React from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Swipeable } from "react-native-gesture-handler";
import moment from "moment";
import { MaterialIcons, EvilIcons } from "@expo/vector-icons"; // Assuming you're using Expo

const ConversationPreview = ({
  navigateChat,
  msgAvatar,
  msgName,
  msgEmail,
  msgLastMessage,
  msgLastMessageTimestamp,
  msgIsUnread,
  onDelete,
}) => {
  // Function to format the timestamp
  const formatTimestamp = (timestamp) => {
    // Convert Firestore timestamp to JavaScript Date object
    const date = moment(new Date(timestamp));
    const today = moment();
    const currentYear = today.year();

    if (date.isSame(today, "day")) {
      // Message is from today
      return date.format("h:mm a");
    } else if (date.year() === currentYear) {
      // Message is from this year
      return date.format("MMM DD");
    } else {
      // Message is from a previous year
      return date.format("MM/DD/YYYY");
    }
  };

  const renderRightActions = (progress, dragX) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0], // Start the translateX from 100 (fully hidden) to 0 (fully shown)
    });

    return (
      <Animated.View
        style={{
          width: 90, // Define the full width of the container
          flexDirection: "row",
          transform: [{ translateX: trans }], // bind translateX to animated value
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "red",
          }}
          onPress={onDelete}
        >
          <EvilIcons name="trash" size={45} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        className="p-4 flex flex-row items-center border-b border-gray-200"
        onPress={navigateChat}
      >
        {msgIsUnread ? (
          <View
            style={{
              width: wp(2),
              height: wp(2),
              position: "absolute",
              left: wp(1.4),
            }}
            className="bg-blue-500 rounded-full"
          />
        ) : null}
        <View className="flex flex-row items-center ml-2">
          <Image
            source={{ uri: msgAvatar }}
            className="rounded-full h-12 w-12"
          />
          <View className="flex-1 ml-4 space-y-1">
            <View className="flex-row space-x-1 items-center">
              <Text className="font-bold">{msgName}</Text>
              <Text className="text-gray-500 text-xs">+{msgEmail}</Text>
            </View>
            <Text className="text-gray-600">
              {msgLastMessage.length > 20
                ? `${msgLastMessage.substring(0, 20)}...`
                : msgLastMessage}
            </Text>
          </View>
          <Text style={{ color: "#6b7280" }}>
            {formatTimestamp(msgLastMessageTimestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default ConversationPreview;
