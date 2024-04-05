import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Button, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as Animatable from "react-native-animatable";
import { Audio } from "expo-av";
import Voice from "@react-native-voice/voice";

const Footer = ({ selected }) => {
  const [voiceOn, setVoiceOn] = useState(false);
  const [results, setResults] = useState([]);
  console.log(results);

  useEffect(() => {
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Effect for handling results update timeout
  useEffect(() => {
    // After 3 seconds of timeout, do something
    const timer = setTimeout(doSomething, 3000);

    return () => clearTimeout(timer); // Clear timeout if results update or component unmounts
  }, [results[0]]);

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

  const onSpeechResults = (result) => {
    setResults(result.value);
  };

  const onSpeechError = (err) => {
    console.log(err);
  };

  async function startRecording() {
    try {
      await Voice.start("en-US");
    } catch (e) {
      console.error(e);
    }
  }

  async function stopRecording() {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  }

  const toggleVoice = async () => {
    if (!voiceOn) {
      await startRecording();
    } else {
      await stopRecording();
    }
    setVoiceOn(!voiceOn);
  };

  const doSomething = () => {
    console.log("doSomething was called due to inactivity");
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
