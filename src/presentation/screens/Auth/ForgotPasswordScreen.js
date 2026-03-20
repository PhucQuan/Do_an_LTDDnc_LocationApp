import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email của bạn");
      return;
    }
    setLoading(true);
    try {
      // Gọi service gửi OTP qua email (Cần cấu hình emailjs như đã thảo luận)
      await authService.requestPasswordResetOTP(email);
      Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn.");
      setStep(2);
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã OTP và mật khẩu mới");
      return;
    }
    setLoading(true);
    try {
      // Logic: 1. Kiểm tra OTP từ Firestore, 2. Cập nhật mật khẩu mới
      // Giả sử verifyOTPAndReset đã được định nghĩa trong authService
      await authService.verifyOTPAndReset(email, otp, newPassword);
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi!", [
        { text: "Đăng nhập ngay", onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>

        <TouchableOpacity style={styles.backButton} onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
            <ArrowLeft color="#F8FAFC" size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
            <View style={styles.logoContainer}>
                <KeyRound color="#38BDF8" size={40} />
            </View>
            <Text style={styles.title}>{step === 1 ? 'Forgot Password' : 'Reset Password'}</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Enter your email to receive a 6-digit verification code'
                : `Enter the code sent to ${email}`}
            </Text>
        </View>

        <View style={styles.form}>
            {step === 1 ? (
              <>
                <View style={styles.inputContainer}>
                    <Mail color="#64748B" size={20} style={styles.inputIcon} />
                    <TextInput
                        placeholder="Email Address"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && { opacity: 0.7 }]}
                  onPress={handleRequestOTP}
                  disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.buttonText}>Send Code</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                    <KeyRound color="#64748B" size={20} style={styles.inputIcon} />
                    <TextInput
                        placeholder="6-Digit OTP"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Lock color="#64748B" size={20} style={styles.inputIcon} />
                    <TextInput
                        placeholder="New Password"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                </TouchableOpacity>
              </>
            )}
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 20, padding: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#334155',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#334155',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#F8FAFC', fontSize: 16 },
  actionButton: {
    backgroundColor: '#38BDF8', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  buttonText: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
});

export default ForgotPasswordScreen;
