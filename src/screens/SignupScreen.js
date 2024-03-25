import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
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

const SignupScreen = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateLogin = () => {
    navigation.navigate("Login");
  };

  const storeUserData = async (data) => {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(data));
    } catch (error) {
      console.error("AsyncStorage error: ", error.message);
    }
  };

  const onHandleSignup = async () => {
    try {
      // Ensure email and password are not empty
      if (email === "" || password === "") {
        throw new Error("Email and password must not be empty.");
      }

      // Attempt to create a user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Signup success");

      try {
        // If the above succeeds, proceed to create a user document in Firestore
        const usersRef = collection(db, "users");
        const newUserRef = await addDoc(usersRef, {
          user_uuid: uuid.v1(),
          first_name: firstName,
          last_name: lastName,
          email: email, // Consider storing user's email only if necessary for your app's functionality
        });
        console.log(`New user created with ID: ${newUserRef.id}`);

        // Store user data in AsyncStorage
        await storeUserData({
          first_name: firstName,
          last_name: lastName,
          email: email,
        });
      } catch (err) {
        // If creating the Firestore document fails, sign out the user and potentially handle user deletion
        console.error("Failed to create user document:", err.message);
        await signOut(auth);
        // Optional: Consider deleting the user if document creation fails
        // TODO: Do this
        // However, this requires administrative privileges and should be handled server-side
        throw err; // Re-throw the error to be caught by the outer catch
      }
    } catch (err) {
      // Handle any errors that occur during the signup process
      console.error("Signup error:", err.message);
      Alert.alert("Signup error:", err.message);
    }
  };

  return (
    <View className="flex-1 justify-center px-4">
      <Text className="text-center text-3xl mb-8">TinyChat SignupScreen</Text>
      <View className="flex-row justify-between">
        <TextInput
          className="flex-1 border border-gray-300 p-3 rounded mb-4 mr-2"
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
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        className="border border-gray-300 p-3 rounded mb-4"
        placeholder="Password"
        autoCapitalize="none"
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />

      <View>
        <TouchableOpacity
          className="bg-blue-500 rounded p-3 mb-2"
          onPress={onHandleSignup}
        >
          <Text className="text-center text-white">Sign up</Text>
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
          <Text className="text-blue-500">Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignupScreen;
