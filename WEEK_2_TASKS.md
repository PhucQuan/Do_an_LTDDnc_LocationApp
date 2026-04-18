# 🎯 MỤC TIÊU TUẦN 2: REAL-TIME & HỆ THỐNG NHÓM

**Mục tiêu chung:**
- Vị trí của các thành viên cập nhật liên tục (Real-time).
- Marker di chuyển mượt mà trên bản đồ (Animation).
- Có hệ thống tạo và quản lý nhóm cơ bản.

---

## 👥 HÙNG + QUÂN – Real-time Tracking & Marker Animation
**Nhiệm vụ:** Đảm bảo vị trí luôn mới nhất và hiển thị sinh động.

- [ ] **Location Heartbeat:** Nâng cấp `useLocation` sử dụng `watchPositionAsync` để theo dõi vị trí liên tục thay vì lấy một lần.
- [ ] **RTDB Optimization:** Chỉ đẩy dữ liệu lên Firebase RTDB nếu khoảng cách di chuyển > 5m hoặc sau mỗi 30 giây để tiết kiệm pin/data.
- [ ] **Smooth Movement:** Sử dụng `Animated` để marker không bị "giật" khi nhảy tọa độ (Interpolation di chuyển mượt giữa điểm cũ và điểm mới).
- [ ] **Status Mapping:** Bổ sung trường `speed` (tốc độ) và `status` (đang đi bộ, đang chạy, đứng yên) vào RTDB.
- [ ] **UI Info:** Hiển thị Tốc độ và Trạng thái ngay dưới tên hoặc khi click vào Marker.

👉 **Kết quả:** Thấy Marker của bạn bè chạy "vèo vèo" trên map cực mượt giống Zenly.

---

## 👤 TÚ – Group Systems (Quản lý nhóm)
**Nhiệm vụ:** Xây dựng khung xương cho tính năng kết nối nhiều người.

- [ ] **Database Design (Firestore):** Thiết kế bảng `Groups` (tên nhóm, mã nhóm, chủ nhóm, danh sách thành viên).
- [ ] **Feature - Create Group:** UI và Logic cho phép người dùng tạo nhóm mới và nhận một "Mã tham gia".
- [ ] **Feature - Join Group:** Nhập mã để vào nhóm của bạn bè.
- [ ] **Feature - List Group:** Màn hình danh sách các nhóm mà người dùng đã tham gia.
- [ ] **Navigation Integration:** Khi bấm vào 1 nhóm, bản đồ sẽ chỉ filter hiển thị các thành viên trong nhóm đó.

👉 **Kết quả:** Người dùng có thể tạo nhóm, thêm bạn và xem danh sách nhóm của mình.

---
*🔥 Ghi chú: Tuần 2 tập trung vào việc "Thấy được nhau". Đây là bước chuẩn bị quan trọng cho tính năng Chat và Footprint ở tuần 3.*
