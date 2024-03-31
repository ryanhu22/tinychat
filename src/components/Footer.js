import React from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // Make sure to install react-native-vector-icons

const Footer = ({ selected }) => {
  return (
    <View className="flex-row justify-around items-center bg-white py-5 px-2 border-t border-gray-200">
      {selected === "Chats" ? (
        <TouchableOpacity className="items-center">
          <Icon name="chatbubble-sharp" size={24} className="text-gray-800" />
          <Text className="text-xs text-gray-800">Chats</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity className="items-center">
          <Icon name="chatbubble-outline" size={24} className="text-gray-800" />
          <Text className="text-xs text-gray-800">Chats</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity className="items-center">
        <Icon name="search-outline" size={24} className="text-gray-800" />
        <Text className="text-xs text-gray-800">Search</Text>
      </TouchableOpacity>
      <TouchableOpacity className="items-center">
        <Icon name="add-circle-outline" size={24} className="text-gray-800" />
        <Text className="text-xs text-gray-800">Add</Text>
      </TouchableOpacity>
      <TouchableOpacity className="items-center">
        <Icon name="heart-outline" size={24} className="text-gray-800" />
        <Text className="text-xs text-gray-800">Likes</Text>
      </TouchableOpacity>
      <TouchableOpacity className="items-center">
        <Icon name="person-outline" size={24} className="text-gray-800" />
        <Text className="text-xs text-gray-800">Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
