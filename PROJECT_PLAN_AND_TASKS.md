# TÀI LIỆU HƯỚNG DẪN & PHÂN CÔNG ĐỒ ÁN CUỐI KỲ: GEOLINK (BẢN REACT NATIVE EXPO)

**Mục tiêu:** Ứng dụng bản đồ mạng xã hội Real-time (Mức độ Demo Đồ án cuối kỳ).
**Công nghệ:** React Native (Expo) + Firebase (RTDB & Firestore).
**Lưu ý:** Giữ mọi thứ đơn giản, tập trung vào Core Feature (Map Tracking) để đảm bảo không lỗi khi báo cáo, không dùng VPS ngoài, tối ưu chi phí Firebase.

---

## 🏗 1. CẤU TRÚC THƯ MỤC (CLEAN ARCHITECTURE LITE)
Kiến trúc này giúp 3 bạn code không bị conflict (đụng code) nhau.

```text
src/
├── core/                 # Cấu hình chung, hằng số, helper functions
│   ├── config/           # Các biến môi trường, config app
│   ├── constants/        # Hằng số (Colors, Layout, Strings)
│   ├── hooks/            # Các custom hooks dùng chung
│   └── utils/            # Hàm format thời gian, tính toán khoảng cách...
│
├── domain/               # Chứa các model dữ liệu định nghĩa chung
│   ├── entities/         # Type / Interface (vd: kiểu dữ liệu User, Location)
│   └── usecases/         # Các logic nghiệp vụ chính (nếu cần tách)
│
├── infrastructure/       # Giao tiếp với bên ngoài (với Firebase)
│   └── firebase/         # Code xử lý thao tác với Firebase
│       ├── authService.js    # Đăng nhập, đăng ký
│       ├── locationService.js# Cập nhật vị trí realtime
│       ├── chatService.js    # Gửi/nhận tin nhắn
│       └── firebaseConfig.js # File khởi tạo Firebase
│
└── presentation/         # Tầng giao diện UI
    ├── components/       # Component dùng chung (Button, Input, MapMarker)
    ├── navigation/       # Chuyển trang (React Navigation)
    └── screens/          # Component màn hình
        ├── Auth/         # (Tú code)
        ├── Map/          # (Hùng + Quân code)
        ├── Chat/         # (Tú code)
        └── Profile/      # (Tú code)
```

---

## 👨‍💻 2. PHÂN CÔNG CHI TIẾT (DỰA TRÊN THẾ MẠNH)

### 👤 Thành viên 1: HÙNG (Map & Location Lead)
**Nhiệm vụ:** Lo toàn bộ màn hình Bản đồ và lấy tọa độ.
* **Component chịu trách nhiệm:** `src/presentation/screens/Map` + `src/infrastructure/firebase/locationService.js`
* **Task chi tiết:**
  - [ ] Hiển thị bản đồ lên màn hình bằng `react-native-maps`.
  - [ ] Lấy vị trí hiện tại bằng `expo-location` và vẽ lên Map (1 marker của mình).
  - [ ] Cập nhật tọa độ của bản thân lên Firebase Realtime Database (RTDB) khi di chuyển. *Lưu ý: Chỉ bắn dữ liệu khi tọa độ thay đổi trên 10 mét để tiết kiệm.*
  - [ ] Lắng nghe (`onValue`) vị trí người khác từ RTDB để vẽ nhiều marker lên Map.
  - [ ] Xử lý thuật toán "Polyline" để vẽ đường vẽ chân (Footprint) từ dách sách tọa độ.

### 👤 Thành viên 2: TÚ (UI, Social & Auth Lead)
**Nhiệm vụ:** Làm các màn hình không có bản đồ, hệ thống luồng ứng dụng và Chat.
* **Component chịu trách nhiệm:** `Auth Screen`, `Chat Screen`, `Navigation`, `authService.js`, `chatService.js`
* **Task chi tiết:**
  - [ ] Setup `React Navigation` (luồng Auth Stack và Main Tab).
  - [ ] Dựng UI màn hình Login, Register.
  - [ ] Viết hàm gọi Firebase Auth (Đăng nhập Email/Pass). Lưu thông tin user (Tên, Avatar) lên Firestore.
  - [ ] Dựng UI màn hình Chat, danh sách Nhóm.
  - [ ] Viết hàm gửi tin nhắn / đọc tin nhắn realtime vào Firestore (`onSnapshot`).
  - [ ] Ghép nối UI toàn app cho đồng nhất màu sắc, layout.

### 👤 Thành viên 3: QUÂN (System Architecture & Tester)
**Nhiệm vụ:** Thiết lập Database, phân quyền bảo mật, tối ưu code và hỗ trợ Map.
* **Component chịu trách nhiệm:** `firebaseConfig.js`, Database Rules trên Console, Test Data.
* **Task chi tiết:**
  - [ ] Setup Project trên Firebase Console (Tạo App, bật Auth, tạo Firestore, tạo RTDB).
  - [ ] Thiết kế các field chuẩn cho Database để Hùng và Tú chỉ việc gọi.
    * *Ví dụ: Bảng Location (trên RTDB) có field gì? Bảng Users (Firestore) có field gì?*
  - [ ] Bật Rule bảo mật (Security Rules) cơ bản để không bị khóa Database do public mode.
  - [ ] **Tương tác với Hùng:** Hỗ trợ xử lý bài toán gom Tọa độ (Footprints): Không push tạo document từng phút, mà gom local rồi 30 phút push 1 mảng tọa độ lên Firestore.
  - [ ] Configure tính năng tự xóa dữ liệu (TTL - Time to live) trên Firestore (Tự động xóa footprint sau 3 tuần). Không viết Cloud Function tốn tiền.

---

## 🗓 3. ĐIỀU CHỈNH TIẾN ĐỘ THỰC TẾ HƠN (3 TUẦN DEMO)

*Đồ án cuối kỳ không cần quá hoàn hảo, nhưng đã demo là phải CHẠY ĐƯỢC không lỗi vặt.*

### 🟢 Tuần 1: Khung xương & Vẽ Map (Rất Quan Trọng)
* Mọi người đều setup máy chạy được React Native Expo (không lỗi thư viện).
* Tú: Làm xong Register/Login lưu vào Firebase Auth. Chuyển vào màn hình trang chủ.
* Hùng & Quân: Dựng lên được cái Map. Máy điện thoại Hùng đọc được GPS và bắn lên Firebase RTDB thành công. Máy Quân mở Firebase RTDB thấy tọa độ Hùng nhảy số là THÀNH CÔNG.

### 🟢 Tuần 2: Thấy nhau & Trò chuyện
* Hùng & Quân: Kéo chùm tọa độ từ RTDB về, biến thành 2-3 Marker trên `MapScreen`. Xử lý cập nhật location liên tục khi đổi vị trí.
* Tú: Dựng xong màn hình Chat. Gõ tin nhắn từ máy này qua máy kia thấy báo tin (Firestore realtime).

### 🟢 Tuần 3: Ghép nối & Điểm nhấn (Footprint)
* Hùng & Quân: Lưu thêm tọa độ history lên Firestore, Load lại vẽ thành "Đường đi màu xanh" trên map (Polylines).
* Tú: Trau chuốt UI (thêm các Icon, chỉnh Padding/Margin).
* Cả team: Chạy test trên 3 điện thoại liền một lúc, quay video demo backup đề phòng hôm báo cáo rớt mạng.

---

## 🔑 4. QUY TẮC TEAMWORK CỐT LÕI (BẮT BUỘC ĐỌC)
1. **APP NÀY CHẠY BẰNG LỆNH `npx expo start`**. KHÔNG BAO GIỜ MỞ THƯ MỤC NÀY BẰNG TÍNH NĂNG "OPEN ANDROID PROJECT" CỦA ANDROID STUDIO NỮA (Nó sẽ sinh ra mớ rác Gradle/App gây lỗi). CHỈ CODE BẰNG VS CODE.
2. Không đụng file của nhau: Tú code giao diện, Hùng code Map, Quân cấu hình logic.
3. Lúc merge code (gộp code): Cả group Discord báo nhau. Push lên Github nhớ kéo branch rõ ràng.
4. Không Push Firebase API Key lên Public Repo (Github) kẻo bị bot quét trừ tiền.
5. Quên Cloud Functions đi, xài `onSnapshot`, `onValue` và `TTL` của Firebase là đủ làm Realtime xịn + Free rồi.
