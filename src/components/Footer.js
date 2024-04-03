import React from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
const Footer = ({ selected }) => {
  return (
    <View
      style={{
        position: "absolute",
        left: wp(60),
        right: 0,
        bottom: wp(10),
        alignItems: "center",
      }}
    >
      <TouchableOpacity>
        <View
          style={{
            borderWidth: 1, // Adjust the border thickness
            borderColor: "black", // Set the border color
            borderRadius: 30, // Half of your width and height to make it circular
            width: wp(13), // Match the icon size or adjust as needed
            height: wp(13), // Match the icon size or adjust as needed
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialIcons
            name="keyboard-voice"
            size={wp(10)}
            color="black" // Use color prop for the icon color
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
