# 🔍 Hướng dẫn sử dụng chức năng Tìm kiếm người dùng

## Tính năng đã được thêm

### ✅ **API Endpoints mới**
1. **`searchUsers(query, page, limit)`** - Tìm kiếm người dùng theo từ khóa
2. **`getSuggestedUsers(limit)`** - Lấy danh sách người dùng gợi ý
3. **`followUser(followerId, followingId)`** - Theo dõi người dùng
4. **`unfollowUser(followerId, followingId)`** - Hủy theo dõi người dùng

### ✅ **Components mới**
1. **`UserSearchCard`** - Hiển thị thông tin người dùng với nút follow/unfollow
2. **`UserSearchResults`** - Hiển thị kết quả tìm kiếm với phân trang
3. **`SuggestedUsers`** - Hiển thị danh sách người dùng gợi ý
4. **`SearchDebugComponent`** - Component debug để test API

### ✅ **Cập nhật SearchScreen**
- Tích hợp tìm kiếm real-time với debounce
- Hiển thị gợi ý khi chưa nhập từ khóa
- Hiển thị kết quả tìm kiếm khi có từ khóa
- Hỗ trợ pull-to-refresh và load more

## Cách sử dụng

### 🚀 **Bước 1: Mở chức năng tìm kiếm**
1. Mở app và đăng nhập
2. Vào tab "Tìm kiếm" (Search)
3. Chọn tab "Người dùng"

### 🔍 **Bước 2: Tìm kiếm người dùng**
1. **Nhập từ khóa** vào ô tìm kiếm:
   - Tên người dùng
   - Email
   - Từ khóa khác
2. **Kết quả sẽ hiển thị** sau 500ms (debounce)
3. **Kéo xuống để refresh** hoặc load thêm kết quả

### 👥 **Bước 3: Theo dõi người dùng**
1. **Xem thông tin** người dùng trong kết quả tìm kiếm:
   - Avatar và tên
   - Email và bio
   - Số người theo dõi/đang theo dõi
   - Số bạn chung (nếu có)
2. **Nhấn nút "Theo dõi"** để follow
3. **Nhấn nút "Đã theo dõi"** để unfollow

### 🎯 **Bước 4: Xem gợi ý**
- Khi **chưa nhập từ khóa**, sẽ hiển thị danh sách gợi ý
- Danh sách gợi ý được lấy từ API `/User/suggested`
- Có thể refresh để lấy gợi ý mới

## Debug và Test

### 🛠️ **Sử dụng SearchDebugComponent**
1. **Mở tab "Người dùng"** trong SearchScreen
2. **Sử dụng SearchDebugComponent** ở đầu trang:
   - **Test Search Users**: Test API tìm kiếm
   - **Test Suggested Users**: Test API gợi ý
   - **Test Follow User**: Test API follow
3. **Xem console logs** để debug chi tiết

### 📊 **Console Logs để theo dõi**
```
[API] Searching users with query: "test", page: 1, limit: 20
[API] Search users response: {...}
[UserSearchResults] Search result: {...}
[UserSearchCard] Following user 123 by user 456
[API] Follow response: {...}
```

## Các tính năng nâng cao

### 🔄 **Pull-to-refresh**
- Kéo xuống để refresh kết quả tìm kiếm
- Refresh danh sách gợi ý

### 📄 **Phân trang**
- Tự động load thêm khi scroll xuống cuối
- Hiển thị loading indicator

### ⚡ **Debounce tìm kiếm**
- Tìm kiếm sau 500ms khi người dùng ngừng gõ
- Tránh gọi API quá nhiều lần

### 🎨 **UI/UX**
- Loading states cho tất cả actions
- Error handling với thông báo rõ ràng
- Empty states khi không có kết quả

## Xử lý lỗi

### 🔴 **Lỗi thường gặp**
1. **401 Unauthorized**: Token hết hạn → Đăng nhập lại
2. **404 Not Found**: API endpoint không tồn tại → Kiểm tra backend
3. **Network Error**: Mất kết nối → Kiểm tra internet
4. **500 Server Error**: Lỗi server → Thử lại sau

### 🛠️ **Debug steps**
1. **Kiểm tra console logs** để xem chi tiết lỗi
2. **Sử dụng SearchDebugComponent** để test API
3. **Kiểm tra network tab** trong DevTools
4. **Kiểm tra backend server** có chạy không

## Backend Requirements

### 📋 **API Endpoints cần có**
```
GET /User/search?q={query}&page={page}&limit={limit}
GET /User/suggested?limit={limit}
POST /User/{followerId}/follow/{followingId}
DELETE /User/{followerId}/follow/{followingId}
```

### 🗄️ **Database cần có**
- Bảng `users` với các trường: id, fullName, email, bio, avatarUrl, etc.
- Bảng `follows` với các trường: followerId, followingId, createdAt
- Index trên các trường tìm kiếm (fullName, email)

## Liên hệ
Nếu gặp vấn đề, hãy chia sẻ:
- Console logs từ SearchDebugComponent
- Screenshot của error messages
- Thông tin về backend API status
