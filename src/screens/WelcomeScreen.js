import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";
import Onboarding from "react-native-onboarding-swiper";
import LottieView from "lottie-react-native";

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const handleDone = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Onboarding
        onDone={handleDone}
        containerStyles={{ paddingHorizontal: 15 }}
        bottomBarHighlight={false}
        skipLabel=""
        titleStyles={{ fontSize: wp(8), fontWeight: "bold" }}
        pages={[
          {
            backgroundColor: "white",
            image: (
              <View>
                <LottieView
                  style={{ width: wp(75), height: wp(75) }}
                  source={require("../assets/animations/mail.json")}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: "Engineered for productivity",
            subtitle: "Managing your inbox has never been so easy.",
          },
          {
            backgroundColor: "white",
            image: (
              <View>
                <LottieView
                  style={{ width: wp(75), height: wp(75) }}
                  source={require("../assets/animations/audio.json")}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: "Keep doing what you love",
            subtitle:
              "Read and respond to messages seamlessly, using voice commands",
          },
        ]}
      />
    </View>
  );
}
