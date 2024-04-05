import React, { useState } from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as Animatable from "react-native-animatable";
import { Audio } from "expo-av";

const Footer = ({ selected }) => {
  const [voiceOn, setVoiceOn] = useState(false);

  const toggleVoice = () => {
    if (!voiceOn) {
      startRecording();
    }
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

  async function startRecording() {
    try {
      // Request permission to access audio
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Prepare for recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      // Start recording
      await recording.startAsync();

      // Here, you can set a timer or a UI interaction to stop recording
      // For simplicity, let's stop after 5 seconds
      setTimeout(async () => {
        await recording.stopAndUnloadAsync();

        // Get the URI of the recorded file
        const uri = recording.getURI();

        // Here, send the URI or the file itself to your backend
        // For example, using fetch to POST the file to your backend
        const formData = new FormData();
        formData.append("voice", {
          uri,
          name: "voiceRecording.m4a",
          type: "audio/m4a",
        });

        console.log(uri);

        fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => console.log(data))
          .catch((error) => console.log(error));

        setVoiceOn(false);
      }, 5000);
    } catch (error) {
      console.log("Error during recording", error);
    }
  }

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
