import { View, Text, Image, TouchableOpacity } from "react-native";
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
import { getMyData, fetchUserData, storeUserData } from "../services/utils";
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
import { auth, db } from "../config/firebase";

const ProfileScreen = () => {
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

  return (
    <View className="flex-1 justify-center px-4">
      <TouchableOpacity onPress={handleChoosePhoto}>
        <Image
          source={{ uri: avatar }}
          style={{ width: wp(20), height: wp(20), borderRadius: wp(10) }} // Use inline styles or a StyleSheet object
        />
      </TouchableOpacity>
      <Text>
        {user.first_name} {user.last_name}
      </Text>
      <Text>{user.email}</Text>
      <TouchableOpacity onPress={updateUser}>
        <Text>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
