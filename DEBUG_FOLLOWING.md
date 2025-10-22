# 🔍 Hướng dẫn Debug Following/Followers

## Vấn đề hiện tại
App chạy được nhưng không hiển thị dữ liệu người theo dõi và đang theo dõi ai.

## Các bước debug đã thực hiện

### 1. ✅ Thêm logging chi tiết
- Thêm console.log vào tất cả API calls
- Logging error details với status code và response data
- Logging token authentication

### 2. ✅ Cải thiện error handling
- Xử lý các lỗi cụ thể (401, 404, 500, Network Error)
- Hiển thị thông báo lỗi rõ ràng cho người dùng
- Validation user ID trước khi gọi API

### 3. ✅ Tạo debug components
- `APIConfigDisplay`: Hiển thị cấu hình API hiện tại
- `APIConnectionTest`: Test kết nối API server
- `FollowingDebugComponent`: Test API following/followers

### 4. ✅ Cải thiện API configuration
- Tách riêng config API vào file riêng
- Dễ dàng thay đổi URL khi cần
- Thêm logging cho tất cả API calls

## Cách sử dụng debug tools

### Bước 1: Kiểm tra API Configuration
1. Mở app và đăng nhập
2. Vào Profile tab
3. Chuyển sang tab "Friends" 
4. Xem `APIConfigDisplay` component để kiểm tra URL hiện tại

### Bước 2: Test API Connection
1. Nhấn "Test API Connection" trong `APIConnectionTest`
2. Xem console logs để kiểm tra:
   - Server có phản hồi không
   - Token có được gửi đúng không
   - Endpoint có tồn tại không

### Bước 3: Test Following API
1. Nhấn "Test Following API" trong `FollowingDebugComponent`
2. Xem console logs để kiểm tra:
   - User info có được lấy đúng không
   - Following list có trả về data không
   - Token có hợp lệ không

## Các nguyên nhân có thể

### 1. 🔴 API Server không chạy
- Ngrok URL có thể đã thay đổi
- Backend server không chạy
- **Giải pháp**: Kiểm tra và restart backend server

### 2. 🔴 API Endpoints không tồn tại
- Endpoint `/User/{id}/following` có thể không được implement
- **Giải pháp**: Kiểm tra backend có endpoint này không

### 3. 🔴 Authentication token không hợp lệ
- Token đã hết hạn
- Token không được gửi đúng format
- **Giải pháp**: Đăng nhập lại để lấy token mới

### 4. 🔴 Database không có dữ liệu
- User chưa follow ai
- Database chưa có dữ liệu test
- **Giải pháp**: Tạo dữ liệu test trong database

## Console Logs để theo dõi

Khi chạy app, hãy mở Developer Console và tìm các logs sau:

```
[API] GET /User/1/following
[API] Token added to request
[FollowingList] Fetching following list for user 1
[FollowingList] Received data: [...]
```

Nếu thấy lỗi:
```
[API] Error getting following list for user 1: Network Error
[FollowingList] Error details: { status: 404, data: {...} }
```

## Các bước tiếp theo

1. **Chạy app và kiểm tra console logs**
2. **Sử dụng debug components để test API**
3. **Kiểm tra backend server có chạy không**
4. **Kiểm tra ngrok URL có đúng không**
5. **Kiểm tra database có dữ liệu không**

## Liên hệ
Nếu vẫn gặp vấn đề, hãy chia sẻ:
- Console logs từ debug components
- Screenshot của error messages
- Thông tin về backend server status
