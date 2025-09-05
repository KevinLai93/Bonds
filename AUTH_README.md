# 认证功能说明

## 概述

本API已添加JWT认证功能，支持用户登录和权限控制，无需数据库。

**重要：除了登录和健康检查端点外，所有其他API端点都需要有效的JWT token进行认证。**

## 用户账号

用户账号信息存储在 `src/users.js` 文件中（该文件已加入.gitignore，不会被提交到版本控制）。

### 默认用户账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | admin | 管理员 |
| user1 | user1 | user | 普通用户 |
| analyst | analyst123 | analyst | 分析师 |

## API端点

### 1. 用户登录

**POST** `/api/login`

**请求体：**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应：**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### 2. 获取用户资料

**GET** `/api/profile`

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**响应：**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  }
}
```

### 3. 管理员用户列表

**GET** `/api/admin/users`

**权限要求：** admin角色

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**响应：**
```json
{
  "success": true,
  "message": "Admin users list retrieved",
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "name": "Administrator"
    }
  ]
}
```

### 4. 债券发行数据查询

**GET** `/api/get_emissions`

**权限要求：** 需要认证（任何有效用户）

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**查询参数：**
- `isin` (必需): ISIN代码

**示例：**
```
GET /api/get_emissions?isin=US037833DY36
Authorization: Bearer <your-jwt-token>
```

**响应：**
返回Financial Data API的债券发行数据响应。

## 认证中间件

### 全局认证（推荐）
系统已配置全局认证中间件，自动保护所有非公开端点：

```javascript
import { globalAuth } from './middleware.js';

// 全局认证中间件 - 保护所有非公开端点
app.use(globalAuth);
```

**公开端点（无需认证）：**
- `/api/health` - 健康检查
- `/api/login` - 用户登录

**受保护端点（需要认证）：**
- `/api/profile` - 用户资料
- `/api/admin/users` - 管理员用户列表
- `/api/get_emissions` - 债券发行数据
- 所有其他新增的API端点

### 单独端点认证
```javascript
import { authenticateToken } from './auth.js';

app.get('/protected-route', authenticateToken, (req, res) => {
  // req.user 包含用户信息
});
```

### 角色验证
```javascript
import { requireRole } from './auth.js';

app.get('/admin-only', authenticateToken, requireRole(['admin']), (req, res) => {
  // 只有admin角色可以访问
});
```

### 可选认证
```javascript
import { optionalAuth } from './auth.js';

app.get('/optional-auth', optionalAuth, (req, res) => {
  // req.user 可能为undefined
});
```

## 前端使用示例

### 登录
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
      // 保存token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 发送认证请求
```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  };
  
  return fetch(url, config);
};

// 使用示例
const getProfile = async () => {
  const response = await fetchWithAuth('/api/profile');
  return response.json();
};
```

## 环境变量配置

在 `.env` 文件中添加：

```bash
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

## 安全注意事项

1. **JWT密钥**：生产环境中必须使用强密钥，不要使用默认值
2. **用户文件**：`src/users.js` 文件包含敏感信息，确保不会被提交到版本控制
3. **HTTPS**：生产环境必须使用HTTPS
4. **Token过期**：JWT token默认24小时过期，可根据需要调整

## 自定义用户

要添加新用户，编辑 `src/users.js` 文件：

```javascript
export const users = [
  // ... 现有用户
  {
    id: 4,
    username: 'newuser',
    password: 'newpassword',
    role: 'user',
    name: 'New User'
  }
];
```

## 故障排除

### 常见错误

1. **401 Unauthorized**: 缺少或无效的Authorization头
2. **403 Forbidden**: 用户角色权限不足
3. **Token expired**: JWT token已过期，需要重新登录

### 调试技巧

1. 检查JWT token是否在Authorization头中正确发送
2. 验证token是否过期
3. 确认用户角色权限设置
4. 查看服务器日志获取详细错误信息
