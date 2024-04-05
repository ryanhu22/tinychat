import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import React, { useRef, useState, useEffect } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  getMyData,
  fetchUserData,
  storeUserData,
  clearAsyncStorage,
} from "../services/utils";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  where,
  query,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { Feather } from "@expo/vector-icons";

const ProfileScreen = ({ navigation }) => {
  const [avatar, setAvatar] = useState(
    "https://firebasestorage.googleapis.com/v0/b/tinychat-0613.appspot.com/o/default_profile_picture.jpeg?alt=media&token=aabbaef0-3ec5-448d-919a-dc8fe20b0605"
  );
  const [user, setUser] = useState({});
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch user data
      const myData = await getMyData();
      setUser(myData);
      if (myData.avatar) {
        setAvatar(myData.avatar);
      }
    };
    fetchData();
  }, []);

  const closeModal = () => {
    navigation.goBack();
  };

  const handleChoosePhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
      setAvatar(result.assets[0].uri);
    }
  };

  const updateUser = async () => {
    if (profilePic && !profilePic.startsWith("http")) {
      // Create a reference to the Firebase Storage
      const storage = getStorage();
      const profilePicRef = storageRef(
        storage,
        `profile_pictures/${new Date().getTime()}_${user.first_name}_${
          user.last_name
        }.jpg`
      );

      // Fetch the image from the local file system
      const response = await fetch(profilePic);
      const blob = await response.blob();
      console.log(blob);

      // 'file' comes from the Blob or File API

      // Upload the image to Firebase Storage (WAS uploadBytes)
      const snapshot = await uploadBytesResumable(profilePicRef, blob);
      console.log("2");
      console.log(snapshot.ref);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(downloadURL);

      // Save the new user in Firestore with the image download URL
      const q = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );

      const querySnapshot = await getDocs(q);

      try {
        const userId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "users", userId), {
          avatar: downloadURL,
        });
      } catch (e) {
        console.error(e);
        return;
      }

      await storeUserData(
        user.first_name,
        user.last_name,
        user.email,
        downloadURL
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            clearAsyncStorage();
            signOut(auth)
              .then(() => {
                // Sign-out successful.
                console.log("Logged out successfully");
              })
              .catch((error) => {
                // An error happened.
                console.error("Error logging out", error);
              });
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="absolute top-5 left-5">
        <TouchableOpacity onPress={() => closeModal()}>
          <Feather name="x" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View className="absolute top-5 right-5">
        <TouchableOpacity onPress={handleSignOut}>
          <Text className="color-red-500">Log out</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleChoosePhoto}>
        <Image
          source={{ uri: avatar }}
          style={{
            width: wp("25%"),
            height: wp("25%"),
            borderRadius: wp("15%"),
            marginBottom: 10,
          }}
        />
      </TouchableOpacity>
      <Text className="text-xl font-bold mt-2 mb-1">
        {user.first_name} {user.last_name}
      </Text>
      <Text className="text-base text-gray-500 mb-6">{user.email}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="bg-black py-2.5 px-4 rounded-full"
          onPress={updateUser}
        >
          <Text className="text-white text-base font-semibold">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;
