import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import React from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import moment from "moment";

const ConversationPreview = ({
  navigateChat,
  msgAvatar,
  msgName,
  msgLastMessage,
  msgLastMessageTimestamp,
  msgIsUnread,
}) => {
  // Function to format the timestamp
  const formatTimestamp = (timestamp) => {
    // Convert Firestore timestamp to JavaScript Date object
    const date = moment(new Date(timestamp));
    const today = moment();
    const currentYear = today.year();

    if (date.isSame(today, "day")) {
      // Message is from today
      return date.format("h:mm A");
    } else if (date.year() === currentYear) {
      // Message is from this year
      return date.format("MM/DD");
    } else {
      // Message is from a previous year
      return date.format("MM/DD/YYYY");
    }
  };

  return (
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
        <Image source={{ uri: msgAvatar }} className="rounded-full h-12 w-12" />
        <View className="flex-1 ml-4">
          <Text className="font-bold">{msgName}</Text>
          <Text className="text-gray-500">
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
  );
};

export default ConversationPreview;
