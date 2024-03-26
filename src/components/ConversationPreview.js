import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import React from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const ConversationPreview = ({
  navigateChat,
  msgAvatar,
  msgName,
  msgLastMessage,
  msgLastMessageTimestamp,
  msgIsUnread,
}) => {
  return (
    <TouchableOpacity
      className="p-4 flex flex-row items-center"
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
          <Text className="text-gray-500">{msgLastMessage}</Text>
        </View>
        <Text className="text-gray-500">{msgLastMessageTimestamp}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationPreview;
