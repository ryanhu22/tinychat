import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import React from "react";

const ConversationPreview = ({
  navigateChat,
  msgAvatar,
  msgName,
  msgLastMessage,
  msgLastMessageTimestamp,
}) => {
  return (
    <TouchableOpacity
      className="flex flex-row items-center p-4"
      onPress={navigateChat}
    >
      <Image source={{ uri: msgAvatar }} className="rounded-full h-12 w-12" />
      <View className="flex-1 ml-4">
        <Text className="font-bold">{msgName}</Text>
        <Text className="text-gray-500">{msgLastMessage}</Text>
      </View>
      <Text className="text-gray-500">{msgLastMessageTimestamp}</Text>
    </TouchableOpacity>
  );
};

export default ConversationPreview;
