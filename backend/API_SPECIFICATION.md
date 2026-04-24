# 📡 GeoLink API Specification (Firebase SDK Layer)

Vì dự án sử dụng mô hình **Serverless (Firebase BaaS)**, các "API" được thực thi thông qua Firebase SDK thay vì các endpoint REST truyền thống. Tài liệu này đặc tả các hàm nghiệp vụ đóng vai trò là Interface giữa Frontend và Backend.

---

## 1. Authentication API
Quản lý định danh và quyền truy cập.

### `REGISTER_USER`
- **Mô tả:** Đăng ký tài khoản mới và khởi tạo profile.
- **Service:** `authService.js -> register()`
- **Payload:** `{ email, password, name }`
- **Logic:** Tạo User trong Firebase Auth -> Ghi Profile vào Firestore `users/`.

### `LOGIN_USER`
- **Mô tả:** Xác thực người dùng.
- **Service:** `authService.js -> login()`
- **Payload:** `{ email, password }`

---

## 2. Location & Tracking API (Real-time)
Cổng giao tiếp vị trí tốc độ cao qua Realtime Database.

### `PUSH_LOCATION`
- **Mô tả:** Cập nhật tọa độ GPS hiện tại.
- **Service:** `locationService.js -> pushLocation()`
- **Realtime Path:** `/locations/{uid}`
- **Payload:** `{ latitude, longitude, speed, batteryLevel, status, updatedAt }`

### `GET_FRIENDS_LOCATION`
- **Mô tả:** Lắng nghe vị trí của tất cả bạn bè đang online.
- **Service:** `locationService.js -> subscribeToAllLocations()`
- **Logic:** Lắng nghe thay đổi tại `/locations` và filter theo danh sách bạn bè.

---

## 3. Social & Friendship API
Quản lý các mối quan hệ xã hội.

### `SEND_FRIEND_REQUEST`
- **Mô tả:** Gửi lời mời kết bạn.
- **Service:** `friendService.js -> sendRequest()`
- **Firestore Path:** `friendships/{id}`
- **Payload:** `{ requesterId, receiverId, status: 'pending' }`

### `SET_GHOST_MODE`
- **Mô tả:** Bật/tắt chế độ tàng hình.
- **Service:** `locationService.js -> setGhostMode()`
- **Payload:** `{ isGhostMode: boolean }`

---

## 4. Messaging & Interaction API

### `SEND_MESSAGE`
- **Mô tả:** Gửi tin nhắn vào nhóm chat.
- **Service:** `chatService.js -> sendMessage()`
- **Firestore Path:** `groups/{groupId}/messages/`
- **Payload:** `{ senderId, text, timestamp }`

### `PUSH_INTERACTION` (Emoji/Buzz)
- **Mô tả:** Gửi cảm xúc hoặc tín hiệu Buzz tới bạn bè trên bản đồ.
- **Service:** `locationService.js -> pushInteraction()`
- **Realtime Path:** `/interactions/{targetUid}/`

---
**Ghi chú cho Giảng viên:** Toàn bộ logic Backend được bảo mật bằng **Firebase Security Rules** (Firestore & RTDB), ngăn chặn truy cập trái phép từ Client mà không qua xác thực.
