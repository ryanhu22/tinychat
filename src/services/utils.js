import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { auth, db } from "../config/firebase";

const getMyData = async () => {
  try {
    const jsonString = await AsyncStorage.getItem("userData");
    if (jsonString !== null) {
      // We have data!
      const myData = JSON.parse(jsonString);
      return myData;
    } else {
      console.log("No user data found");
      return null; // No user data stored
    }
  } catch (error) {
    console.error("AsyncStorage error: ", error.message);
    return null; // In case of error, return null or handle accordingly
  }
};

const fetchUserData = async (userEmail) => {
  // Reference to the "users" collection
  const usersRef = collection(db, "users");

  // Create a query against the collection for the receiver_username
  const q = query(usersRef, where("email", "==", userEmail));
  // Execute the query
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log("No user found.");
    return null; //
  } else {
    const userData = querySnapshot.docs[0].data();
    return userData;
  }
};

// params: first_name, last_name, email
const storeUserData = async (first_name, last_name, email, downloadURL) => {
  try {
    await AsyncStorage.setItem(
      "userData",
      JSON.stringify({ first_name, last_name, email, avatar: downloadURL })
    );
  } catch (error) {
    console.error("AsyncStorage error: ", error.message);
  }
};

const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log("AsyncStorage has been cleared!");
  } catch (error) {
    console.error("Error clearing AsyncStorage:", error.message);
  }
};

export { getMyData, fetchUserData, storeUserData, clearAsyncStorage };
