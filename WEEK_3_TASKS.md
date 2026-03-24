# 🎯 MỤC TIÊU TUẦN 3: FOOTPRINT & GROUP CHAT

**Mục tiêu chung:**
- Hiển thị lịch sử di chuyển (Footprint) của các thành viên.
- Hệ thống Chat Real-time trong nhóm hoạt động ổn định.
- Hoàn thiện UI/UX toàn ứng dụng.

---

## 👥 HÙNG + QUÂN – Footprint & Path Rendering
**Nhiệm vụ:** Lưu lại quá trình di chuyển và vẽ lên bản đồ.

- [ ] **History Logger:** Thiết lập cơ chế lưu trữ tọa độ vào `Firestore` (`locations_history`). Lưu ý: Tối ưu số lượng ghi bằng cách chỉ lưu khi thay đổi vị trí đáng kể.
- [ ] **Path Rendering (Polylines):** Sử dụng component `Polyline` từ `react-native-maps` để vẽ đường nối các điểm tọa độ lịch sử.
- [ ] **Time Filtering:** Cho phép xem lại lịch sử di chuyển theo mốc thời gian (vd: hôm nay, hôm qua).
- [ ] **Footprint Toggle:** Thêm nút bật/tắt hiển thị đường đi trên bản đồ để tránh bị rối mắt.
- [ ] **Database TTL:** Cấu hình tự động xóa dữ liệu lịch sử sau 3 tuần (đã lên kế hoạch ở Tuần 1).

👉 **Kết quả:** Thấy được đường kẻ màu xanh/hồng đánh dấu những nơi bạn bè đã đi qua.

---

## 👤 TÚ – Group Chat (Trò chuyện nhóm)
**Nhiệm vụ:** Kết nối các thành viên qua tin nhắn.

- [ ] **Chat Database (Firestore):** Tạo collection `messages` nằm trong mỗi tài liệu `Group`.
- [ ] **Chat UI:** Thiết kế màn hình Chat với Bubble tin nhắn, ô nhập văn bản và nút gửi.
- [ ] **Real-time Listener (`onSnapshot`):** Khi có tin nhắn mới, màn hình Chat của tất cả thành viên trong nhóm phải tự động cập nhật ngay lập tức.
- [ ] **Message Metadata:** Hiển thị tên người gửi, thời gian gửi và avatar mini.
- [ ] **Polishing UI:** Trau chuốt lại toàn bộ giao diện app: màu sắc, hiệu ứng chuyển cảnh, logo.

👉 **Kết quả:** Các thành viên trong nhóm có thể nhắn tin hỏi thăm nhau ngay trên ứng dụng.

---
*⚡️ KẾT THÚC TUẦN 3: Tiến hành đóng gói ứng dụng, quay video Demo và chuẩn bị báo cáo!*
