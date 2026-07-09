# API Documentation

Complete API reference for Face Attendance Portal.

## Base URL

```
http://localhost:4000/api
```

## Authentication

All endpoints (except `/auth`) require JWT token in header:

```
Authorization: Bearer {token}
```

## Response Format

All responses are JSON:

```json
{
  "data": {},
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```

## Endpoints

### Authentication

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}

Response 201:
{
  "userId": "abc123xyz",
  "email": "user@example.com",
  "name": "John Doe",
  "token": "eyJhbGc..."
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response 200:
{
  "userId": "abc123xyz",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "employee",
  "token": "eyJhbGc..."
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer {token}

Response 200:
{
  "id": "abc123xyz",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "employee",
  "status": "active"
}
```

### Face Management

#### Register Face

```http
POST /faces/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "rollNumber": "CS-001",
  "descriptor": [0.123, 0.456, ..., 0.789]  // 128 values
}

Response 201:
{
  "id": "face123",
  "name": "John Doe",
  "rollNumber": "CS-001",
  "registeredAt": "2024-01-01T00:00:00Z"
}
```

#### Get All Faces

```http
GET /faces
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "face123",
    "userId": "abc123xyz",
    "name": "John Doe",
    "rollNumber": "CS-001",
    "registeredAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get User's Faces

```http
GET /faces/user/{userId}
Authorization: Bearer {token}

Response 200:
[...]
```

#### Delete Face

```http
DELETE /faces/{faceId}
Authorization: Bearer {token}

Response 200:
{
  "message": "Face deleted successfully"
}
```

### Attendance

#### Mark Attendance

```http
POST /attendance/mark
Authorization: Bearer {token}
Content-Type: application/json

{
  "personId": "face123",
  "personName": "John Doe",
  "descriptor": [0.123, 0.456, ..., 0.789]
}

Response 201:
{
  "id": "att123",
  "personName": "John Doe",
  "date": "2024-01-01",
  "time": "09:30:00",
  "status": "present",
  "timestamp": "2024-01-01T09:30:00Z"
}
```

#### Get Attendance Records

```http
GET /attendance/records?startDate=2024-01-01&endDate=2024-01-31&limit=30&offset=0
Authorization: Bearer {token}

Response 200:
{
  "total": 22,
  "records": [
    {
      "id": "att123",
      "personName": "John Doe",
      "date": "2024-01-31",
      "time": "09:30:00",
      "status": "present",
      "timestamp": "2024-01-31T09:30:00Z"
    }
  ]
}
```

#### Get Attendance Stats

```http
GET /attendance/stats?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}

Response 200:
{
  "total": 22,
  "present": 20,
  "absent": 2,
  "late": 0,
  "percentage": "90.91"
}
```

#### Update Attendance (Admin Only)

```http
PATCH /attendance/{recordId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "absent"
}

Response 200:
{
  "message": "Attendance updated successfully"
}
```

#### Export Attendance CSV

```http
GET /attendance/export/csv?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}

Response 200:
Content-Type: text/csv
Content-Disposition: attachment; filename="attendance.csv"

Date,Time,Status
2024-01-01,09:30:00,present
2024-01-02,09:15:00,present
```

### User Management (Admin Only)

#### Get All Users

```http
GET /users
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "abc123xyz",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "employee",
    "status": "active"
  }
]
```

#### Get User by ID

```http
GET /users/{userId}
Authorization: Bearer {token}

Response 200:
{
  "id": "abc123xyz",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "employee",
  "status": "active"
}
```

#### Update User

```http
PATCH /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "role": "manager",
  "status": "active"
}

Response 200:
{
  "message": "User updated successfully"
}
```

#### Delete User (Admin Only)

```http
DELETE /users/{userId}
Authorization: Bearer {token}

Response 200:
{
  "message": "User deleted successfully"
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

## Rate Limiting

Coming soon: Rate limiting will be implemented.

## Webhooks

Coming soon: Event webhooks will be available.

## Pagination

Use `limit` and `offset` parameters:

```http
GET /attendance/records?limit=20&offset=40
```

## Filtering

Most list endpoints support filtering:

```http
GET /attendance/records?startDate=2024-01-01&endDate=2024-01-31&status=present
```

## Sorting

Use `sort` parameter:

```http
GET /attendance/records?sort=-date  # Descending
```

## Search

Full-text search on applicable endpoints:

```http
GET /users?search=John
```

---

For issues or questions about the API, please open an issue on GitHub.
