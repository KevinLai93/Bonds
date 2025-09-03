# Cbonds API

A Node.js Express API for querying bond emissions data from Cbonds.

## Features

- Query bond emissions by ISIN code
- JWT-based authentication system
- Role-based access control
- **Multi-language support with intelligent translation (English, Simplified Chinese, Traditional Chinese)**
- **Real-time price querying with time-based sorting**
- HTTPS support with mkcert certificates
- CORS enabled for cross-origin requests
- Environment variable configuration
- AWS Lambda deployment ready

## Local Development

### Prerequisites

- Node.js 18+
- mkcert (for HTTPS)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
CBONDS_LOGIN=your_email@domain.com
CBONDS_PASSWORD=your_password
```

3. Generate SSL certificates:
```bash
mkcert -install
mkdir -p ssl
mkcert -key-file ssl/key.pem -cert-file ssl/cert.pem localhost 127.0.0.1 ::1
```

4. Start the server:
```bash
# HTTPS (recommended)
npm start

# Development with auto-reload
npm run dev
```

### Local Endpoints

### 公开端点（无需认证）
- Health: `http://localhost:3000/api/health`
- Login: `POST http://localhost:3000/api/login`

### 受保护端点（需要认证）
- Profile: `GET http://localhost:3000/api/profile`
- Admin Users: `GET http://localhost:3000/api/admin/users` (admin only)
- Get Emissions: `http://localhost:3000/api/get_emissions?isin=US037833DY36&lang=zh`
- Get Emitents: `http://localhost:3000/api/get_emitents?emitent_id=23541&lang=zh`

#### CBonds API端点
- Get Emission Default: `GET http://localhost:3000/api/cbonds/get_emission_default?isin=US037833DY36`
- Get Emission Guarantors: `GET http://localhost:3000/api/cbonds/get_emission_guarantors?isin=US037833DY36`
- Get Flow New: `GET http://localhost:3000/api/cbonds/get_flow_new?isin=US037833DY36`
- Get Offert: `GET http://localhost:3000/api/cbonds/get_offert?isin=US037833DY36`
- Get Tradings New: `GET http://localhost:3000/api/cbonds/get_tradings_new?isin=US037833DY36&sort_by=date_desc`

## AWS Deployment

### Option 1: Serverless (Lambda + API Gateway) - Recommended

#### Prerequisites

1. Install AWS CLI and configure credentials:
```bash
aws configure
```

2. Install Serverless Framework:
```bash
npm install -g serverless
```

3. Install deployment dependencies:
```bash
npm install
```

#### Deploy

1. Set environment variables in AWS Systems Manager Parameter Store:
```bash
aws ssm put-parameter --name "/cbonds-api/dev/CBONDS_LOGIN" --value "your_email@domain.com" --type "SecureString"
aws ssm put-parameter --name "/cbonds-api/dev/CBONDS_PASSWORD" --value "your_password" --type "SecureString"
```

2. Update `serverless.yml` with your region and environment variable references.

3. Deploy:
```bash
# Deploy to dev
npm run deploy

# Deploy to production
npm run deploy:prod
```

4. The deployment will output your API Gateway URL.

#### Benefits
- Pay per request (very cost-effective for low traffic)
- Auto-scaling
- No server management
- Built-in monitoring

### Option 2: EC2 (Traditional Server)

#### Prerequisites

1. AWS EC2 instance (t3.micro for testing)
2. Security group with port 80/443 open
3. Domain name (optional)

#### Deploy

1. Launch EC2 instance with Ubuntu/Amazon Linux
2. Install Node.js and PM2
3. Clone your repository
4. Set environment variables
5. Use PM2 to run the service

#### Benefits
- Full control over the server
- Fixed IP address
- Can run multiple services

### Option 3: ECS Fargate

#### Prerequisites

1. Docker installed locally
2. AWS ECS cluster
3. Application Load Balancer

#### Deploy

1. Create Dockerfile
2. Build and push to ECR
3. Deploy to ECS Fargate
4. Configure ALB

## Environment Variables

- `CBONDS_LOGIN`: Your Cbonds login email
- `CBONDS_PASSWORD`: Your Cbonds password
- `JWT_SECRET`: JWT signing secret (default: development secret)
- `JWT_EXPIRES_IN`: JWT token expiration time (default: 24h)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Port number (default: 6667)

## API Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "environment": "dev",
  "timestamp": "2025-08-27T12:00:00.000Z"
}
```

### POST /api/login
User authentication endpoint.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
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

### GET /api/profile
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
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

### GET /api/admin/users
Get users list (admin role required).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
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

### GET /api/get_emissions
Query bond emissions by ISIN with optional language translation.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `isin` (required): ISIN code
- `lang` (optional): Language code (`eng`, `zh`, `cht`, `zh-cn`, `zh-tw`)

**Example:**
```
GET /api/get_emissions?isin=US037833DY36&lang=zh
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
Returns Cbonds API response with bond emission data. When `lang=zh`, only the industry field (`emitent_branch_name_eng`) is translated to Chinese.

### GET /api/get_emitents
Query issuer information with optional language translation.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `emitent_id` (optional): Issuer ID
- `emitent_name` (optional): Issuer name
- `lang` (optional): Language code (`eng`, `zh`, `cht`, `zh-cn`, `zh-tw`)

**Example:**
```
GET /api/get_emitents?emitent_id=23541&lang=zh
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
Returns issuer information. When `lang=zh`, the industry field (`branch_name_eng`) and issuer introduction (`more_eng`) are translated to Chinese.

### GET /api/cbonds/get_issuers
Get issuers information from CBonds API.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
Returns CBonds API response with issuers data.

### GET /api/cbonds/get_companies
Get companies information from CBonds API.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
Returns CBonds API response with companies data.

### GET /api/cbonds/get_last_quotes
Get last quotes from CBonds API.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
Returns CBonds API response with last quotes data.

## CORS

The API supports CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Monitoring

### CloudWatch Logs (AWS)
- Lambda logs are automatically sent to CloudWatch
- Set up alarms for errors and latency

### Local Logs
- Morgan HTTP request logging
- Error logging to console

## Security

- JWT-based authentication system
- Role-based access control
- Environment variables for sensitive data
- HTTPS support with valid certificates
- CORS configuration for cross-origin requests
- Input validation for API parameters

## Troubleshooting

### Common Issues

1. **CORS errors**: Check CORS configuration and browser console
2. **SSL certificate errors**: Ensure mkcert is installed and certificates are valid
3. **Environment variables**: Verify `.env` file exists and variables are set
4. **Port conflicts**: Check if port 6667 is available

### AWS Deployment Issues

1. **Lambda timeout**: Increase timeout in `serverless.yml`
2. **Memory issues**: Increase memory allocation
3. **Environment variables**: Check Parameter Store configuration
4. **IAM permissions**: Verify Lambda execution role permissions

## Authentication Quick Start

### 1. 默认用户账号
系统预配置了以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | admin | 管理员 |
| user1 | user123 | user | 普通用户 |
| analyst | analyst123 | analyst | 分析师 |

### 2. 登录流程
```bash
# 1. 登录获取token
curl -k -X POST https://localhost:6667/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. 使用token访问受保护的端点
curl -k -H "Authorization: Bearer <your-token>" \
  https://localhost:6667/api/profile
```

### 3. 角色权限
- **admin**: 可以访问所有端点，包括用户管理
- **analyst**: 可以访问债券数据和用户资料
- **user**: 只能访问基本功能和自己的资料

### 4. 认证要求
除了登录和健康检查端点外，**所有其他API端点都需要有效的JWT token**。

**示例：访问债券数据**
```bash
# 1. 先登录获取token
curl -k -X POST https://localhost:6667/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. 使用token访问债券数据
curl -k -H "Authorization: Bearer <your-token>" \
  "https://localhost:6667/api/get_emissions?isin=US037833DY36"
```

## 🌐 Multi-Language Translation

### Translation Features
The API now supports intelligent translation for specific fields when using Chinese language parameters:

**Supported Languages:**
- `eng` - English (default)
- `zh` - Simplified Chinese
- `zh-cn` - Simplified Chinese
- `cht` - Traditional Chinese
- `zh-tw` - Taiwan Chinese

**Translated Fields:**
1. **Industry Classification** (`emitent_branch_name_eng` / `branch_name_eng`)
   - Example: "IT equipment" → "資訊科技設備"
2. **Issuer Introduction** (`profile_eng`)
   - Example: "Apple Inc. designs, manufactures..." → "蘋果公司設計、製造..."

**Translation Mechanism:**
1. **Local Dictionary First** - Fast response for common terms
2. **External API Fallback** - Uses Free Translate API for accurate translation
3. **Selective Translation** - Only translates specified fields, keeps others in original language

### Usage Examples

**Bond Data with Translation:**
```bash
# English version
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/get_emissions?isin=US037833DY36&lang=eng"

# Chinese version (only industry field translated)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/get_emissions?isin=US037833DY36&lang=zh"
```

**Issuer Data with Translation:**
```bash
# English version
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/get_emitents?emitent_id=23541&lang=eng"

# Simplified Chinese version (industry and introduction translated)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/get_emitents?emitent_id=23541&lang=zh"

# Traditional Chinese version (industry and introduction translated)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/get_emitents?emitent_id=23541&lang=cht"
```

### Translation Response Example

**English Response:**
```json
{
  "items": [{
    "emitent_name_eng": "Apple",
    "emitent_branch_name_eng": "IT equipment",
    "kind_name_eng": "International bonds",
    "emitent_type_name_eng": "corporate",
    "more_eng": "Apple Inc. designs, manufactures..."
  }]
}
```

**Simplified Chinese Response:**
```json
{
  "items": [{
    "emitent_name_eng": "Apple",                    // 保持英文
    "emitent_branch_name_eng": "IT设备",            // ✅ 翻譯為簡體中文
    "kind_name_eng": "International bonds",         // 保持英文
    "emitent_type_name_eng": "corporate",           // 保持英文
    "profile_eng": "苹果公司设计、制造..."          // ✅ 翻譯為簡體中文
  }]
}
```

**Traditional Chinese Response:**
```json
{
  "items": [{
    "emitent_name_eng": "Apple",                    // 保持英文
    "emitent_branch_name_eng": "IT設備",            // ✅ 翻譯為繁體中文
    "kind_name_eng": "International bonds",         // 保持英文
    "emitent_type_name_eng": "corporate",           // 保持英文
    "profile_eng": "蘋果公司設計、製造..."          // ✅ 翻譯為繁體中文
  }]
}
```

## 📊 Real-Time Price Querying

### Price Data Features
The API now supports time-based sorting for bond trading data to get the latest prices:

**Sorting Options:**
- `date_desc` - Get latest trading data (recommended)
- `date_asc` - Get historical trading data

**Price Data Fields:**
- `buying_quote` - Bid price
- `selling_quote` - Ask price  
- `mid_price` - Mid price
- `last_price` - Last traded price
- `volume` - Trading volume
- `update_time` - Last update timestamp

### Usage Examples

**Get Latest Prices:**
```bash
# Get most recent trading data
curl -H "Authorization: Bearer $TOKEN" \
"http://localhost:3000/api/cbonds/get_tradings_new?isin=US037833DY36&sort_by=date_desc"
```

**Get Historical Prices:**
```bash
# Get historical trading data
curl -H "Authorization: Bearer $TOKEN" \
"http://localhost:3000/api/cbonds/get_tradings_new?isin=US037833DY36&sort_by=date_asc"
```

**Frontend Integration:**
```javascript
// Get latest prices for real-time display
const latestPrices = await API.getTradingsNew('US037833DY36', 'date_desc');
const latestDate = latestPrices.items[0]?.date;
const todayTrades = latestPrices.items.filter(item => item.date === latestDate);

// Calculate average price
const avgPrice = todayTrades.reduce((sum, trade) => 
  sum + (parseFloat(trade.mid_price) || parseFloat(trade.buying_quote) || 0), 0
) / todayTrades.length;

console.log(`Latest price: ${avgPrice.toFixed(2)}`);
```

**Price Monitoring:**
```javascript
// Monitor price changes every 30 seconds
setInterval(async () => {
  const prices = await API.getTradingsNew('US037833DY36', 'date_desc');
  const latestPrice = prices.items[0]?.mid_price;
  updatePriceDisplay(latestPrice);
}, 30000);
```

## Support

For issues and questions:
1. Check the logs
2. Verify environment variables
3. Test endpoints locally first
4. Check AWS CloudWatch logs for Lambda issues
5. For translation issues, check Free Translate API availability
6. For price data issues, verify Cbonds API connectivity and credentials

