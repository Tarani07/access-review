# Sparrow Vision IGA Backend

Backend API for the Sparrow Vision Identity Governance and Administration (IGA) Platform.

## Features

- 🔐 JWT-based authentication
- 👥 User and role management
- 📊 Audit logging
- 🛡️ Policy management and violation detection
- 📈 Dashboard analytics
- 🔒 Role-based access control (RBAC)
- 🚀 Cloud-ready deployment

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (Neon recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy environment variables:
   ```bash
   cp env.example .env
   ```

5. Configure your environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users` - Get all users (with pagination)

### Roles
- `GET /api/roles` - Get all roles

### Audit
- `GET /api/audit` - Get audit logs (with pagination and filters)

### Policies
- `GET /api/policies` - Get all policies
- `GET /api/policies/violations` - Get policy violations

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/audit-logs` - Get recent audit logs
- `GET /api/dashboard/risk-assessment` - Get risk assessment data

## Database Schema

The application automatically creates the following tables:

- `users` - User accounts
- `roles` - User roles and permissions
- `audit_logs` - System audit trail
- `policies` - Access policies
- `policy_violations` - Policy violation records

## Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Docker

1. Build the Docker image:
   ```bash
   docker build -t sparrow-vision-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 3001:3001 --env-file .env sparrow-vision-backend
   ```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:5173 |

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection prevention with parameterized queries

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (coming soon)

### Code Structure

```
src/
├── config/
│   └── database.js      # Database configuration
├── middleware/
│   └── auth.js          # Authentication middleware
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management routes
│   ├── roles.js         # Role management routes
│   ├── audit.js         # Audit logging routes
│   ├── policies.js      # Policy management routes
│   └── dashboard.js     # Dashboard data routes
└── server.js            # Main server file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
