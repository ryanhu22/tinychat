import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Button, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as Animatable from "react-native-animatable";
import * as Speech from "expo-speech";
import Voice from "@react-native-voice/voice";
import { getMyData, fetchUserData, clearAsyncStorage } from "../services/utils";

const Footer = ({ selected }) => {
  const [myData, setMyData] = useState({});

  const [voiceOn, setVoiceOn] = useState(false);
  const [results, setResults] = useState([]);
  console.log(results);

  const handleRef = useRef(false);
  // Create WebSocket connection
  const socket = useRef(null);
  const [serverMessage, setServerMessage] = useState("");

  const [pauseUpdates, setPauseUpdates] = useState(false);
  const pauseUpdatesRef = useRef(false);

  useEffect(() => {
    const loadMyData = async () => {
      const data = await getMyData();
      setMyData(data);
    };
    loadMyData();
  }, []);

  useEffect(() => {
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (serverMessage) {
      (async () => {
        // Attempt to stop recording before starting speech
        // await stopRecording();
        pauseUpdatesRef.current = true;
        Speech.speak(serverMessage);

        // Check periodically if Speech is still speaking
        const checkSpeaking = async () => {
          const isSpeaking = await Speech.isSpeakingAsync();
          if (isSpeaking) {
            // If still speaking, check again after a delay
            setTimeout(checkSpeaking, 500);
          } else {
            await sleep(500);
            await stopRecording();
            await sleep(500);
            await startRecording();
            pauseUpdatesRef.current = false;
          }
        };

        // Initial check
        setTimeout(checkSpeaking, 500);
      })();
    }
  }, [serverMessage]);

  // Used for WebSockets
  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:8000");

    socket.current.addEventListener("open", function (event) {
      console.log("Connected to WS Server");
      let jsonData = {
        sender_email: myData.email,
      };
      socket.current.send(JSON.stringify(jsonData));
    });

    socket.current.addEventListener("message", function (event) {
      console.log("Message from server:", event.data);
      // Speech.speak(event.data);
      setServerMessage(event.data); // Update state with received message
    });

    socket.current.addEventListener("error", function (event) {
      console.error("WebSocket error:", event);
    });

    socket.current.addEventListener("close", function (event) {
      console.log("WebSocket connection closed:", event);
    });

    // Cleanup on component unmount
    return () => {
      socket.current.close();
    };
  }, []); // Ensure the 'socket' variable doesn't change or re-instantiate every render

  // Effect for handling results update timeout
  useEffect(() => {
    // After 3 seconds of timeout, do something
    const timer = setTimeout(processMessage, 3000);

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
    if (!pauseUpdatesRef.current) {
      console.log("Speech Results: " + result.value);
      setResults(result.value);
    } else {
      console.log("Paused updates: " + result.value);
    }
  };

  const onSpeechError = (err) => {
    console.log(err);
  };

  async function startRecording() {
    try {
      setVoiceOn(true);
      await Voice.start("en-US");
      console.log("Start Recording");
    } catch (e) {
      console.error(e);
    }
  }

  async function stopRecording() {
    try {
      setVoiceOn(false);
      await Voice.stop();
      console.log("Stop Recording");
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const sendMessageToWS = async (message) => {
    let jsonData = {
      sender_email: myData.email,
      message: message,
    };

    if (socket.current) {
      socket.current.send(JSON.stringify(jsonData));
    }
  };

  const processMessage = async () => {
    // console.log("processMessage was called due to inactivity");
    // console.log("results: " + results[0]);
    // console.log("handleRef: " + handleRef.current);

    if (!handleRef.current && results[0]) {
      // Handle Multiple Calls
      handleRef.current = true;
      await stopRecording();
      await sleep(500);
      // Core logic
      console.log("=== Sending call to WS: " + results[0] + " ===");
      sendMessageToWS(results[0]);
      // Cleanup
      await sleep(500);
      await startRecording();
      handleRef.current = false;
      setResults([]);
    } else {
      return;
    }
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
              width: hp(6), // Match the icon size or adjust as needed
              height: hp(6), // Match the icon size or adjust as needed
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
