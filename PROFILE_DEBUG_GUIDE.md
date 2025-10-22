# 🔧 Hướng dẫn Debug Profile Navigation

## Vấn đề
Sau khi tìm kiếm và follow người dùng, không thể xem được profile của họ.

## Các bước Debug

### 1. Sử dụng ProfileNavigationTestComponent
Trong tab "Tìm kiếm", bạn sẽ thấy component "🧪 Profile Navigation Test":

1. **Nhập User ID**: Nhấn vào ô input để nhập ID của user muốn test
2. **Test GetUserById API**: Kiểm tra xem API có hoạt động không
3. **Test Navigation**: Kiểm tra xem navigation có hoạt động không

### 2. Kiểm tra Console Logs
Mở Developer Tools và kiểm tra console logs:

```
[ProfileTest] Testing getUserById with userId: 1
[ProfileTest] User data received: {...}
[UserSearchCard] User pressed: John Doe (ID: 1)
[UserProfile] Fetching profile for userId: 1
[UserProfile] User data received: {...}
```

### 3. Các lỗi có thể gặp

#### Lỗi 404 - User not found
```
[API] Error response: {"message": "User not found"}
```
**Giải pháp**: Kiểm tra xem user ID có tồn tại trong database không

#### Lỗi 401 - Unauthorized
```
[API] Error response: {"message": "Unauthorized"}
```
**Giải pháp**: Kiểm tra token authentication

#### Lỗi 500 - Server Error
```
[API] Error response: {"message": "Internal server error"}
```
**Giải pháp**: Kiểm tra backend server

### 4. Kiểm tra Backend API

#### Endpoint: GET /api/User/{id}
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-ngrok-url.ngrok-free.app/api/User/1
```

#### Response mong đợi:
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "avatarUrl": "https://...",
  "followersCount": 10,
  "followingCount": 5,
  ...
}
```

### 5. Kiểm tra Navigation

#### Route: /profile?userId={id}
- Đảm bảo route được định nghĩa trong `app/profile.tsx`
- Kiểm tra `useLocalSearchParams` có lấy được `userId` không
- Kiểm tra `router.push()` có hoạt động không

### 6. Các bước Test

1. **Test API trước**:
   - Sử dụng ProfileNavigationTestComponent
   - Nhập user ID và test API
   - Kiểm tra response

2. **Test Navigation**:
   - Nếu API hoạt động, test navigation
   - Kiểm tra console logs
   - Kiểm tra xem profile screen có load không

3. **Test từ Search**:
   - Tìm kiếm user
   - Nhấn vào user card
   - Kiểm tra navigation và profile loading

### 7. Debug Commands

#### Kiểm tra API connection:
```javascript
// Trong console
fetch('https://your-ngrok-url.ngrok-free.app/api/User/1', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'ngrok-skip-browser-warning': 'true'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));
```

#### Kiểm tra navigation:
```javascript
// Trong console
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/profile?userId=1');
```

### 8. Troubleshooting

#### Nếu không thể xem profile:
1. Kiểm tra user ID có đúng không
2. Kiểm tra API có hoạt động không
3. Kiểm tra token có hợp lệ không
4. Kiểm tra console logs để tìm lỗi

#### Nếu API trả về lỗi:
1. Kiểm tra backend server có chạy không
2. Kiểm tra database có user với ID đó không
3. Kiểm tra authentication token
4. Kiểm tra network connection

### 9. Logs quan trọng

#### Thành công:
```
[ProfileTest] Testing getUserById with userId: 1
[API] Getting user info for user 1
[API] User info response: {...}
[ProfileTest] User data received: {...}
[UserProfile] Fetching profile for userId: 1
[UserProfile] User data received: {...}
```

#### Lỗi:
```
[API] Error getting user info for user 1: AxiosError: Request failed with status code 404
[API] Error response: {"message": "User not found"}
[ProfileTest] Error: AxiosError: Request failed with status code 404
```

## Kết luận

Sử dụng ProfileNavigationTestComponent để debug từng bước:
1. Test API trước
2. Test navigation sau
3. Kiểm tra console logs
4. Sửa lỗi theo từng bước

Nếu vẫn có vấn đề, hãy chia sẻ console logs để được hỗ trợ thêm.
