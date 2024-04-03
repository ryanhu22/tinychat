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
  const swiperRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(true);

  const navigateLogin = () => {
    navigation.navigate("Login");
  };

  const handleChoosePhoto = async () => {
    setIsSwiping(false); // Disable swiping when picking an image
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      setIsSwiping(true); // Re-enable swiping
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    setIsSwiping(true); // Re-enable swiping
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  // Added method to handle navigation logic
  const goToNextSlide = () => {
    if (currentSlide === 0 && (email === "" || password === "")) {
      alert("Please fill out all fields before continuing.");
      return;
    } else if (currentSlide === 1 && firstName === "") {
      alert("Please fill out all fields before continuing.");
      return;
    } else if (currentSlide === 2 && lastName === "") {
      alert("Please fill out all fields before continuing.");
      return;
    }

    if (swiperRef.current && currentSlide < 3) {
      swiperRef.current.scrollBy(1);
    }
  };

  // Function to validate inputs
  const isValidInput = (index) => {
    switch (index) {
      case 0:
        return email.trim().length > 0 && password.trim().length > 0;
      case 1:
        return firstName.trim().length > 0;
      case 2:
        return lastName.trim().length > 0;
      default:
        return false;
    }
  };

  // Swiper onIndexChanged handler
  const handleIndexChanged = (index) => {
    // Check if the input is valid when trying to leave the current slide
    if (!isValidInput(currentIndex) && index > currentIndex) {
      // Return to the previous slide
      swiperRef.current.scrollBy(currentIndex - index, true);
      Alert.alert(
        "Validation",
        "Please fill out all fields before continuing."
      );
    } else {
      setCurrentIndex(index); // Valid input or moving backwards, so update the index
    }
  };

  // TODO: Signup shouldn't include Profile Picture. That can be done in-app
  const onHandleSignup = async () => {
    try {
      // Ensure email and password are not empty
      if (email === "" || password === "") {
        throw new Error("Email and password must not be empty.");
      }

      // Attempt to create a user with email and password
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase signup success");

      try {
        // Check for profilePic existence and that it's not already a URL
        if (profilePic && !profilePic.startsWith("http")) {
          // Create a reference to the Firebase Storage
          console.log("1");
          const storage = getStorage();
          console.log("2");
          const profilePicRef = storageRef(
            storage,
            `profile_pictures/${new Date().getTime()}_${firstName}_${lastName}.jpg`
          );

          console.log("3");

          // Fetch the image from the local file system
          const response = await fetch(profilePic);
          console.log("4");
          const blob = await response.blob();
          console.log("5");

          // Upload the image to Firebase Storage
          const snapshot = await uploadBytes(profilePicRef, blob);
          console.log("6");

          // Get the download URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          console.log(downloadURL);

          // Save the new user in Firestore with the image download URL
          const usersRef = collection(db, "users");
          const newUserRef = await addDoc(usersRef, {
            first_name: firstName,
            last_name: lastName,
            email: email, // Ensure you have handled email privacy and consent properly
            avatar: downloadURL,
          });

          await storeUserData(firstName, lastName, email, downloadURL);
        } else {
          // Handle case where no profile picture is provided
          Alert.alert("Sign Up Error", "Please choose a profile picture.");
        }

        // // If the above succeeds, proceed to create a user document in Firestore
        // const usersRef = collection(db, "users");
        // const newUserRef = await addDoc(usersRef, {
        //   first_name: firstName,
        //   last_name: lastName,
        //   email: email, // Consider storing user's email only if necessary for your app's functionality
        //   avatar: profilePic,
        // });
        // console.log(`New user created with ID: ${newUserRef.id}`);

        // // Store user data in AsyncStorage
        // await storeUserData(firstName, lastName, email);
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
    <Swiper
      ref={swiperRef}
      showsButtons={true}
      loop={false}
      index={currentIndex}
      onIndexChanged={handleIndexChanged}
      scrollEnabled={isSwiping}
      nextButton={
        <TouchableOpacity onPress={goToNextSlide}>
          <MaterialIcons name="navigate-next" size={24} color="black" />
        </TouchableOpacity>
      }
      prevButton={
        <TouchableOpacity onPress={() => swiperRef.current.scrollBy(-1)}>
          <MaterialIcons name="navigate-before" size={24} color="black" />
        </TouchableOpacity>
      }
    >
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-bold">Enter your email</Text>
        <TextInput
          className="mt-5 mb-2 px-3 h-10 border-gray-400 border-2 w-4/5"
          autoCapitalize="none"
          onChangeText={setEmail}
          placeholder="email"
          keyboardType="email-address"
          value={email}
        />
        <TextInput
          className="mb-5 mt-2 px-3 h-10 border-gray-400 border-2 w-4/5"
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="password"
          value={password}
          secureTextEntry
        />
        <View className="flex-row justify-center">
          <Text>Have an account? </Text>
          <TouchableOpacity onPress={navigateLogin}>
            <Text className="text-blue-500">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-bold">Enter your first name</Text>
        <TextInput
          className="my-5 px-3 h-10 border-gray-400 border-2 w-4/5"
          onChangeText={setFirstName}
          placeholder="First Name"
          value={firstName}
        />
      </View>
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-bold">Enter your last name</Text>
        <TextInput
          className="my-5 px-3 h-10 border-gray-400 border-2 w-4/5"
          onChangeText={setLastName}
          placeholder="Last Name"
          value={lastName}
        />
      </View>
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-bold">Choose your profile picture</Text>
        <Text className="py-2">You can also do this later.</Text>
        <TouchableOpacity
          onPress={handleChoosePhoto}
          className="mt-5 p-2 bg-blue-500"
        >
          <Text className="text-white">Pick a photo</Text>
        </TouchableOpacity>
        {profilePic && (
          <Image
            source={{ uri: profilePic }}
            className="mt-5 w-24 h-24 rounded-full"
          />
        )}
        <TouchableOpacity
          className="absolute bg-blue-500 rounded p-3"
          style={{
            position: "absolute",
            bottom: wp(15),
            width: wp(50),
          }}
          onPress={onHandleSignup}
        >
          <Text className="text-center text-white">Sign up</Text>
        </TouchableOpacity>
      </View>
    </Swiper>
  );
};

export default SignupScreen;
