import { auth, db } from '../firebase/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { User } from "../../domain/entities/User";
import emailjs from 'emailjs-com';

class AuthService {
  /**
   * Sinh mã OTP 6 số
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Gửi OTP qua Email dùng EmailJS
   */
  async sendEmailOTP(email, otp) {
    try {
      const SERVICE_ID = 'service_rm77xgc';
      const TEMPLATE_ID = 'template_zbm0ww7';
      const USER_ID = 'GGbuSJyPL_MHehFH9';

      const templateParams = {
        to_email: email,
        otp_code: otp,
      };

      console.log(`[OTP DEBUG] Đang gửi mã ${otp} tới ${email}...`);

      // KÍCH HOẠT GỬI EMAIL THẬT
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);

      if (response.status !== 200) {
        throw new Error("Dịch vụ email gặp sự cố.");
      }

      return true;
    } catch (error) {
      console.error("Gửi email lỗi:", error);
      throw new Error("Không thể gửi mã OTP. Vui lòng kiểm tra lại cấu hình EmailJS hoặc kết nối mạng.");
    }
  }

  /**
   * ĐĂNG KÝ: Bước 1 - Gửi OTP
   */
  async requestRegisterOTP(email) {
    try {
      const otp = this.generateOTP();
      // Lưu OTP vào Firestore với thời gian tạo để đối soát
      await setDoc(doc(db, "register_otps", email), {
        otp,
        createdAt: serverTimestamp()
      });
      return await this.sendEmailOTP(email, otp);
    } catch (error) {
      throw error;
    }
  }

  /**
   * ĐĂNG KÝ: Bước 2 - Xác nhận OTP và CHỈ tạo tài khoản khi OTP đúng
   */
  async verifyAndRegister(email, password, fullName, phoneNumber, otp) {
    try {
      const otpDocRef = doc(db, "register_otps", email);
      const otpDoc = await getDoc(otpDocRef);

      // KIỂM TRA OTP BẮT BUỘC
      if (!otpDoc.exists()) {
        throw new Error("Yêu cầu mã OTP mới.");
      }

      if (otpDoc.data().otp !== otp) {
        throw new Error("Mã OTP không chính xác. Vui lòng kiểm tra lại email.");
      }

      // CHỈ KHI ĐÚNG OTP MỚI GỌI HÀM TẠO USER
      const user = await this.register(email, password, fullName, phoneNumber);

      // Xóa mã OTP sau khi sử dụng thành công
      await deleteDoc(otpDocRef);

      return user;
    } catch (error) {
      console.error("Lỗi xác thực OTP đăng ký:", error.message);
      throw error;
    }
  }

  /**
   * Logic tạo User trên Firebase Auth & Firestore (Hàm nội bộ)
   */
  async register(email, password, fullName, phoneNumber) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const newUser = new User({
        id: firebaseUser.uid,
        name: fullName,
        email: firebaseUser.email,
        phone: phoneNumber,
      });

      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...newUser.toFirestore(),
        updatedAt: serverTimestamp()
      });

      return newUser;
    } catch (error) {
      let friendlyMessage = "Đã có lỗi xảy ra khi đăng ký.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          friendlyMessage = "Email này đã được sử dụng bởi một tài khoản khác.";
          break;
        case 'auth/invalid-email':
          friendlyMessage = "Địa chỉ email không hợp lệ.";
          break;
        case 'auth/weak-password':
          friendlyMessage = "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
          break;
        default:
          friendlyMessage = error.message;
      }
      throw new Error(friendlyMessage);
    }
  }

  /**
   * ĐĂNG NHẬP: Trả về User + JWT Token
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const jwtToken = await userCredential.user.getIdToken();

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      return {
        user: userDoc.exists() ? User.fromFirestore(userDoc) : null,
        jwt: jwtToken
      };
    } catch (error) {
      throw new Error("Email hoặc mật khẩu không chính xác.");
    }
  }

  /**
   * QUÊN MẬT KHẨU: Bước 1 - Gửi OTP
   */
  async requestPasswordResetOTP(email) {
    try {
      const otp = this.generateOTP();
      await setDoc(doc(db, "password_resets", email), {
        otp,
        createdAt: serverTimestamp()
      });
      return await this.sendEmailOTP(email, otp);
    } catch (error) {
      throw error;
    }
  }

  /**
   * QUÊN MẬT KHẨU: Bước 2 - Xác nhận OTP
   */
  async verifyOTPAndReset(email, otp) {
    try {
      const resetDocRef = doc(db, "password_resets", email);
      const resetDoc = await getDoc(resetDocRef);

      if (!resetDoc.exists() || resetDoc.data().otp !== otp) {
        throw new Error("Mã OTP không chính xác.");
      }

      await sendPasswordResetEmail(auth, email);
      await deleteDoc(resetDocRef);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    return await signOut(auth);
  }

  subscribe(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        callback(userDoc.exists() ? User.fromFirestore(userDoc) : null);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
