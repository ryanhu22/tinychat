import React, { useState } from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as Animatable from "react-native-animatable";

const Footer = ({ selected }) => {
  const [voiceOn, setVoiceOn] = useState(false);

  const toggleVoice = () => {
    setVoiceOn(!voiceOn);
  };

  const pulse = {
    0: {
      scale: 1,
    },
    0.5: {
      scale: 1.3,
    },
    1: {
      scale: 1,
    },
  };
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
      <TouchableOpacity onPress={toggleVoice}>
        <Animatable.Text
          animation={voiceOn ? pulse : null}
          easing="ease-out"
          iterationCount="infinite"
          style={{ textAlign: "center" }}
          duration={2500}
        >
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
        </Animatable.Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
