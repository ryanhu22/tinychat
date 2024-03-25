import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { fetchUserData, storeUserData } from "../services/utils";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateSignUp = () => {
    navigation.navigate("Signup");
  };

  const onHandleLogin = async () => {
    if (email !== "" && password !== "") {
      const myData = await fetchUserData(email);
      storeUserData(myData.first_name, myData.last_name, myData.email);

      signInWithEmailAndPassword(auth, email, password)
        .then(() => console.log("Login success"))
        .catch((err) => Alert.alert("Login error:", err.message));
    }
  };

  return (
    <View className="flex-1 justify-center px-4">
      <Text className="text-center text-3xl mb-8">TinyChat LoginScreen</Text>
      <TextInput
        className="border border-gray-300 p-3 rounded mb-4"
        placeholder="email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        className="border border-gray-300 p-3 rounded mb-4"
        placeholder="password"
        autoCapitalize="none"
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />

      <View>
        <TouchableOpacity
          className="bg-blue-500 rounded p-3 mb-2"
          onPress={onHandleLogin}
        >
          <Text className="text-center text-white">Log In</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-center my-4">
          <View className="flex-grow h-0.5 bg-gray-300" />
          <Text className="px-4 text-gray-600">OR</Text>
          <View className="flex-grow h-0.5 bg-gray-300" />
        </View>
      </View>

      <TouchableOpacity className="mb-4">
        <Text className="text-center text-blue-500">
          Continue as Dave Johnson
        </Text>
      </TouchableOpacity>
      <View className="flex-row justify-center">
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={navigateSignUp}>
          <Text className="text-blue-500">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
