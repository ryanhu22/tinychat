import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import Swiper from "react-native-swiper";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import {
  collection,
  addDoc,
  orderBy,
  where,
  query,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import uuid from "react-native-uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storeUserData } from "../services/utils";
const SignupScreen = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const defaultAvatar =
    "https://firebasestorage.googleapis.com/v0/b/tinychat-0613.appspot.com/o/default_profile_picture.jpeg?alt=media&token=aabbaef0-3ec5-448d-919a-dc8fe20b0605";

  const navigateLogin = () => {
    navigation.navigate("Login");
  };

  const onHandleSignup = async () => {
    try {
      // Ensure email and password are not empty
      if (email === "" || password === "") {
        throw new Error("Email and password must not be empty.");
      }

      // Attempt to create a user with email and password
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase signup success");

      // If the above succeeds, proceed to create a user document in Firestore
      const usersRef = collection(db, "users");
      const newUserRef = await addDoc(usersRef, {
        first_name: firstName,
        last_name: lastName,
        email: email, // Consider storing user's email only if necessary for your app's functionality
      });
      console.log(`New user created with ID: ${newUserRef.id}`);

      // Store user data in AsyncStorage
      await storeUserData(firstName, lastName, email, defaultAvatar);
    } catch (err) {
      // Handle any errors that occur during the signup process
      console.error("Signup error:", err.message);
      Alert.alert("Signup error:", err.message);
    }
  };

  return (
    <View className="flex-1 justify-center px-4">
      <Text className="text-center text-3xl mb-8">Sign Up for TinyChat</Text>
      <View className="flex-row justify-between">
        <TextInput
          className="flex-1 border border-gray-300 p-3 rounded mb-4"
          placeholder="First Name"
          onChangeText={(text) => setFirstName(text)}
        />
        <TextInput
          className="flex-1 border border-gray-300 p-3 rounded mb-4 ml-2"
          placeholder="Last Name"
          onChangeText={(text) => setLastName(text)}
        />
      </View>
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
          onPress={onHandleSignup}
        >
          <Text className="text-center text-white">Sign Up</Text>
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
        <Text>Have an account? </Text>
        <TouchableOpacity onPress={navigateLogin}>
          <Text className="text-blue-500">Login In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignupScreen;
