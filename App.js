import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { db, collection, addDoc } from './src/firebaseConfig'; // Import cấu hình Firebase

export default function App() {

  const createTestData = async () => {
    try {
      // 1. Tạo User (ID Collection là "users")
      const userRef = await addDoc(collection(db, "users"), {
        username: "harry_tester",
        email: "harry@test.com",
        avatarUrl: "https://i.pravatar.cc/150",
        createdAt: new Date()
      });

      // 2. Tạo Post (ID Collection là "posts")
      const postRef = await addDoc(collection(db, "posts"), {
        userId: userRef.id,
        imageUrl: "https://picsum.photos/200",
        caption: "Bumping from App.js!",
        location: {
          latitude: 10.762622,
          longitude: 106.660172,
          addressName: "TP. Hồ Chí Minh"
        },
        timestamp: new Date()
      });

      Alert.alert("Thành công!", `Đã tạo User: ${userRef.id}\nĐã tạo Post: ${postRef.id}`);
      console.log("Data seeded successfully");
    } catch (error) {
      console.error("Lỗi khi tạo data: ", error);
      Alert.alert("Lỗi", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bump Location App</Text>
      <Text style={styles.subtitle}>Kiểm tra kết nối Firebase</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Bấm để tạo dữ liệu mẫu"
          onPress={createTestData}
          color="#007AFF"
        />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  }
});
