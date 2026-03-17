import { auth, db } from '../firebase/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { User } from "../../domain/entities/User";

class AuthService {
  /**
   * Register a new user and create their profile in Firestore
   */
  async register(email, password, fullName, phoneNumber) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create internal User entity
      const newUser = new User({
        id: firebaseUser.uid,
        name: fullName,
        email: firebaseUser.email,
        phone: phoneNumber,
        createdAt: new Date().toISOString()
      });

      // Save to Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...newUser.toFirestore(),
        updatedAt: serverTimestamp()
      });

      return newUser;
    } catch (error) {
      console.error("AuthService Register Error:", error);
      throw error;
    }
  }

  /**
   * Login existing user
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch profile from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        return User.fromFirestore(userDoc);
      }
      return null;
    } catch (error) {
      console.error("AuthService Login Error:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    return await signOut(auth);
  }

  /**
   * Listen to auth state changes
   */
  subscribe(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          callback(User.fromFirestore(userDoc));
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
