# 🔧 Hướng dẫn sửa lỗi Backend API

## ❌ **Vấn đề gặp phải**

### Lỗi 400 Bad Request
```
GET /api/User/search           400 Bad Request
GET /api/User/suggested        400 Bad Request
```

### Chi tiết lỗi
```json
{
  "errors": {
    "id": ["The value 'search' is not valid."]
  },
  "status": 400,
  "title": "One or more validation errors occurred."
}
```

## 🔍 **Nguyên nhân**

Backend không có các API endpoints:
- `/api/User/search` - Tìm kiếm người dùng
- `/api/User/suggested` - Lấy danh sách gợi ý

Khi frontend gọi các endpoints này, backend coi "search" và "suggested" như là ID không hợp lệ và trả về lỗi 400.

## ✅ **Giải pháp đã thực hiện**

### 1. **Thêm endpoints vào UserController**
```csharp
[HttpGet("search")]
[Authorize]
public async Task<ActionResult<object>> SearchUsers([FromQuery] string q, [FromQuery] int page = 1, [FromQuery] int limit = 20)

[HttpGet("suggested")]
[Authorize]
public async Task<ActionResult<List<UserResponse>>> GetSuggestedUsers([FromQuery] int limit = 10)
```

### 2. **Thêm methods vào IUserService interface**
```csharp
Task<object> SearchUsersAsync(string query, int page, int limit);
Task<List<UserResponse>> GetSuggestedUsersAsync(int limit);
```

### 3. **Implement methods trong UserService**
```csharp
public async Task<object> SearchUsersAsync(string query, int page, int limit)
{
    // Search by full name or email
    // Return paginated results with counts
}

public async Task<List<UserResponse>> GetSuggestedUsersAsync(int limit)
{
    // Return random users as suggestions
    // Add follower/following counts
}
```

## 🚀 **Cách test**

### 1. **Restart Backend Server**
```bash
cd Back-end
dotnet run
```

### 2. **Sử dụng BackendAPITestComponent**
- Mở app → Tab "Tìm kiếm"
- Sử dụng **BackendAPITestComponent** ở đầu trang
- Test các API endpoints:
  - **Test Search**: Test API tìm kiếm
  - **Test Suggested**: Test API gợi ý
  - **Test Follow**: Test API follow

### 3. **Kiểm tra Console Logs**
```
[BackendAPITest] Testing search API...
[BackendAPITest] Search result: {...}
```

## 📋 **API Endpoints mới**

### 🔍 **Search Users**
```
GET /api/User/search?q={query}&page={page}&limit={limit}
```
**Response:**
```json
{
  "users": [...],
  "totalCount": 10,
  "currentPage": 1,
  "totalPages": 1
}
```

### 👥 **Suggested Users**
```
GET /api/User/suggested?limit={limit}
```
**Response:**
```json
[
  {
    "id": 1,
    "fullName": "User Name",
    "email": "user@example.com",
    "followersCount": 5,
    "followingCount": 3,
    ...
  }
]
```

## 🛠️ **Debug Components**

### 🔧 **BackendAPITestComponent**
- Test trực tiếp các API endpoints mới
- Hiển thị kết quả chi tiết
- Test với các parameters khác nhau

### 🔍 **SearchDebugComponent**
- Test API calls từ frontend
- Kiểm tra error handling
- Debug authentication

### 🎯 **NavigationTestComponent**
- Test navigation functionality
- Kiểm tra integration với bottom navigation

## 📁 **Files đã thay đổi**

### Backend
```
Back-end/SocialNetworkMobile/Controllers/UserController.cs
Back-end/SocialNetworkMobile.Services/Interfaces/IUserService.cs
Back-end/SocialNetworkMobile.Services/Services/UserService.cs
```

### Frontend
```
Front-end/components/BackendAPITestComponent.tsx
Front-end/screens/SearchScreen.tsx
```

## 🧪 **Testing Steps**

### 1. **Backend Testing**
1. **Build backend**: `dotnet build`
2. **Run backend**: `dotnet run`
3. **Check Swagger**: `https://localhost:5000/swagger`
4. **Test endpoints** trong Swagger UI

### 2. **Frontend Testing**
1. **Mở app** và đăng nhập
2. **Vào tab "Tìm kiếm"**
3. **Sử dụng BackendAPITestComponent**:
   - Test Search API
   - Test Suggested API
   - Test Follow API
4. **Kiểm tra console logs**

### 3. **Integration Testing**
1. **Nhập từ khóa** vào ô tìm kiếm
2. **Kiểm tra kết quả** hiển thị
3. **Test follow/unfollow** functionality
4. **Test navigation** đến profile

## 🚨 **Troubleshooting**

### ❌ **Nếu vẫn gặp lỗi 400**
1. **Kiểm tra backend có chạy không**
2. **Kiểm tra ngrok URL có đúng không**
3. **Kiểm tra authentication token**
4. **Kiểm tra console logs**

### ❌ **Nếu không có kết quả tìm kiếm**
1. **Kiểm tra database có dữ liệu không**
2. **Kiểm tra search query có hợp lệ không**
3. **Kiểm tra pagination parameters**

### ❌ **Nếu suggested users không hiển thị**
1. **Kiểm tra database có users không**
2. **Kiểm tra limit parameter**
3. **Kiểm tra random logic**

## 🎉 **Kết quả mong đợi**

Sau khi sửa lỗi:
- ✅ API `/api/User/search` hoạt động
- ✅ API `/api/User/suggested` hoạt động
- ✅ Frontend có thể tìm kiếm người dùng
- ✅ Frontend hiển thị danh sách gợi ý
- ✅ Follow/unfollow hoạt động
- ✅ Navigation đến profile hoạt động

## 📞 **Liên hệ**

Nếu vẫn gặp vấn đề:
1. **Chia sẻ console logs** từ BackendAPITestComponent
2. **Chia sẻ backend logs**
3. **Kiểm tra database có dữ liệu không**
4. **Kiểm tra authentication token**
