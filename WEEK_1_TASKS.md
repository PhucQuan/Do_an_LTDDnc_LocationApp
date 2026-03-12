# 🎯 MỤC TIÊU TUẦN 1: KHỞI TẠO NỀN TẢNG (CORE FOUNDATION)

**Mục tiêu chung:**
- App chạy được trên điện thoại/máy ảo.
- Có hệ thống Login/Register hoạt động trơn tru.
- Sau khi Login thành công, vào được màn hình Map.
- Map hiển thị được vị trí hiện tại của thiết bị (Location Tracking).

---

## 👤 QUÂN – Xử lý vị trí (Logic & Architecture)
**Vai trò:** Viết các logic xử lý nghiệp vụ, xử lý quyền (Permissions) và phân phối dữ liệu vị trí.

**Nhiệm vụ trong Tuần 1:**
- [ ] Cấu hình xin quyền truy cập vị trí (Foreground Location Permission).
- [ ] Dùng thư viện `expo-location` để lấy được tọa độ hiện tại (Latitude, Longitude).
- [ ] Xử lý luồng lỗi: Bắt lỗi khi người dùng từ chối cấp quyền cấp quyền hoặc cố tình tắt nền GPS (Ví dụ: Alert yêu cầu bật GPS).
- [ ] Phân mục logic đàng hoàng: Tạo file/hook riêng (`src/core/hooks/useLocation.js` hoặc file service) để quản lý tập trung việc lấy vị trí.
- [ ] Trả dữ liệu state vị trí về cho màn hình MapScreen một cách dễ lấy nhất.

👉 **Kết quả nghiệm thu cuối tuần:**
- Nhìn vào Terminal/Console phải `log` ra được tọa độ liên tục.
- Gọi hàm được nhiều lần lấy vị trí mới.
- Tuyệt đối **KHÔNG BỊ CRASH** văng app khi máy đt đang chưa cấp quyền.

---

## 👤 HÙNG – Hiển thị bản đồ (UI Map)
**Vai trò:** Đưa bản đồ lên giao diện và thao tác sự kiện trải nghiệm mượt mà với Map.

**Nhiệm vụ trong Tuần 1:**
- [ ] Tự setup môi trường máy cá nhân: Chạy được project Expo qua lệnh `npx expo start` (không dùng Android Studio rác lỗi).
- [ ] Tạo giao diện màn hình `MapScreen`.
- [ ] Nhúng thư viện `react-native-maps` để render cái khung bản đồ ra màn hình.
- [ ] Nhận dữ liệu state tọa độ (từ file Logic của Quân) -> Gắn một cái `Marker` (Điểm đánh dấu) lên đúng vị trí đó trên Map.
- [ ] Test các thao tác bản đồ: Zoom in, zoom out, cầm kéo bản đồ thao tác mượt.

👉 **Kết quả nghiệm thu cuối tuần:**
- Mở máy kéo app lên là **THẤY CÁI BẢN ĐỒ** hiện tải được tiles ảnh.
- Có `Marker` ghim đúng cái vị trí xe/nhà mình đang đứng hiện tại.

---

## 👤 TÚ – Hệ thống luồng Navigation & Auth (Social)
**Vai trò:** Xây dựng cửa ngõ vào app (Đăng nhập, Đăng ký), kết nối Database và điều hướng.

**Nhiệm vụ trong Tuần 1:**
- [ ] Setup dự án Firebase Backend (Tạo Firebase, bật Authentication, copy Config bỏ vào code máy).
- [ ] Code UI và Logic cho màn hình `RegisterScreen` (Đăng ký tài khoản).
- [ ] Code UI và Logic cho màn hình `LoginScreen` (Đăng nhập email/pass).
- [ ] Code Service lưu thông tin user (Tên, UID, Email) vào cục Database Firestore mỗi khi user đăng ký vừa xong.
- [ ] Cài đặt cầu nối `React Navigation`. Chặn luồng: User nào chưa Login -> cho ở lại màn Auth. User nào Login rồi -> Đẩy thẳng vào màn hình Map chính.

👉 **Kết quả nghiệm thu cuối tuần:**
- Bấm tạo tài khoản thì báo thành công, mở Firebase Console lên thấy user mới xuất hiện.
- Đăng nhập thành công thì nhảy vèo vô được màn hình Map. (Auth Flow).
- Có thông tin lưu trữ user vào Database chuẩn bị cho lúc làm chat.

---
*🔥 Ghi chú cho Team: Tuần 1 là Tuần Cốt Lõi (Nặng setup môi trường). Nếu không setup xong Tuần 1 thì Tuần 2 coi như gãy. Các thành viên bám sát tiến độ nhé!*
