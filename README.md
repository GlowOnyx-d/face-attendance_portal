# Face Attendance Portal - Production Grade

A modern, full-stack face recognition attendance system built with React, TypeScript, Node.js, and SQLite.

## Features

**Core Features**
- Real-time face recognition & attendance marking
- User authentication with JWT
- Role-based access control (Admin, Employee, Manager)
- SQLite database with proper schema
- CSV export/import for attendance records
- Responsive UI with Tailwind CSS & Dark Mode

**Production Ready**
- TypeScript for type safety
- Proper error handling & validation
- Docker & Docker Compose support
- GitHub Actions CI/CD
- Comprehensive logging
- Security best practices

**Advanced Features**
- Attendance analytics & statistics
- Daily/monthly attendance reports
- Bulk attendance operations
- User management dashboard
- Audit logging

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/GlowOnyx-d/face-attendance_portal.git
cd face-attendance-portal/project

# Install dependencies
npm install
npm install --prefix server
```

### 2. Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Update .env with your settings
```

### 3. Start Development

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client

# Or both together
npm run dev:full
```

Visit `http://localhost:5173`

## Docker

```bash
# Development
docker-compose up --build

# Production
docker build -f Dockerfile.server -t face-attendance-server .
docker build -f Dockerfile.client -t face-attendance-client .
docker run -p 4000:4000 face-attendance-server
docker run -p 80:80 face-attendance-client
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/faces/register` - Register face
- `GET /api/faces` - Get all faces
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/export/csv` - Export CSV

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite for bundling
- Tailwind CSS for styling
- Zustand for state management
- React Query for API calls
- face-api.js for face recognition

**Backend**
- Node.js + Express
- TypeScript
- SQLite with better-sqlite3
- JWT authentication
- Zod for validation
- bcryptjs for password hashing

**DevOps**
- Docker & Docker Compose
- GitHub Actions CI/CD
- nginx for reverse proxy

## Project Structure

```
project/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── store/              # Zustand stores
│   └── utils/              # Utilities
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── middleware.ts       # Express middleware
│   ├── database.ts         # SQLite setup
│   └── auth.ts             # Authentication
├── public/models/          # Face recognition models
└── docker/                 # Docker configs
```

## Security

✅ JWT authentication
✅ Password hashing with bcrypt
✅ Input validation with Zod
✅ SQL prepared statements
✅ CORS configuration
✅ Audit logging
✅ Error handling

## Performance

- Lazy loading for models
- Database indexes
- Gzip compression
- Client-side caching
- Code splitting
- Optimized bundle

## Scripts

```bash
npm run dev              # Start frontend dev server
npm run dev:server       # Start backend dev server
npm run dev:full         # Start both
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
npm test                 # Run tests
```

## Environment Variables

```env
# Backend
NODE_ENV=development
PORT=4000
DATABASE_URL=./data/attendance.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Frontend (in .env.local)
VITE_API_URL=http://localhost:4000/api
```

## Database Schema

SQLite database with tables for:
- Users (with roles)
- Faces (with face descriptors)
- Attendance (with status tracking)
- Audit logs

## Deployment

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Manual
```bash
# Build
npm run build:server
npm run build

# Run
node server/dist/index.js
```

## Troubleshooting

**Models not found:** Run `npm run dev:daemon` to download models
**Database locked:** Delete `.db` files and restart
**CORS errors:** Check `CORS_ORIGIN` in `.env`
**Face recognition fails:** Check camera permissions and model files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## License

MIT License

## Support

- Issues: [GitHub Issues](https://github.com/GlowOnyx-d/face-attendance_portal/issues)
- Discussions: [GitHub Discussions](https://github.com/GlowOnyx-d/face-attendance_portal/discussions)

---

For modern attendance systems

An example is included in `.env.example`.

## Run locally

From `project/`:

1) Install frontend dependencies

```bash
npm install
```

2) Install backend dependencies

```bash
npm run server:install
```

3) Start backend server (terminal 1)

```bash
npm run dev:server
```

4) Start frontend (terminal 2)

```bash
npm run dev:client
```

## API endpoints

- `GET /api/registered`
- `POST /api/register`
- `GET /api/attendance`
- `POST /api/attendance`
- `POST /api/match`

## Notes

- Backend storage is file-based (`server/db.json`) for simple local development.
- For production, migrate to a real database and add authentication + HTTPS.
yolo test
pair extraordinaire test
pair extraordinaire retry
