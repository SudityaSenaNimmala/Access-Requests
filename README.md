# DB Access Request Tool

A full-stack application for managing database query requests with an approval workflow. Developers can submit query requests, team leads review and approve them, and queries are executed directly without giving developers direct database access.

## Features

- **OAuth Authentication**: Secure Microsoft SSO login (Azure AD)
- **Role-Based Access Control**: Developer, Team Lead, and Admin roles
- **Query Request Workflow**: Submit, review, approve/reject queries
- **Direct Query Execution**: Approved queries run automatically on MongoDB
- **Real-time Updates**: Socket.io for instant notifications
- **Email Notifications**: Automated emails for request status changes
- **Admin Panel**: Manage users and database instances

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Passport.js (Microsoft OAuth)
- Socket.io
- Nodemailer

### Frontend
- React 18 + Vite
- TailwindCSS
- React Router
- Monaco Editor
- Socket.io Client

## Prerequisites

- Node.js 18+
- MongoDB instance
- Google OAuth credentials

## Setup

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env` file (copy from `backend/env.example`):

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/db_access_tool

# Session
SESSION_SECRET=your-secret-key

# Microsoft OAuth (Azure AD)
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback
MICROSOFT_TENANT_ID=your-tenant-id-or-common

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email (SMTP)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourcompany.com
SMTP_PASS=your-password
EMAIL_FROM=DB Access Tool <noreply@yourcompany.com>

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key!
```

### 3. Microsoft Azure AD Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Enter app name (e.g., "DB Access Tool")
5. Select supported account types (single tenant or multi-tenant)
6. Add redirect URI: `http://localhost:5000/api/auth/microsoft/callback` (Web platform)
7. After creation, copy **Application (client) ID** to `MICROSOFT_CLIENT_ID`
8. Copy **Directory (tenant) ID** to `MICROSOFT_TENANT_ID` (or use "common" for multi-tenant)
9. Go to **Certificates & secrets** > **New client secret**
10. Copy the secret value to `MICROSOFT_CLIENT_SECRET`
11. Go to **API permissions** > Add `User.Read` permission (should be added by default)

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173`

## Usage

### For Developers

1. Login with Microsoft
2. Go to "New Request"
3. Select database instance and collection
4. Choose query type and enter query JSON
5. Provide reason and select team lead
6. Submit request
7. Wait for approval - results appear automatically

### For Team Leads

1. Login with Microsoft
2. Go to "Team Requests"
3. Review pending requests
4. Approve (executes query) or Reject with comment
5. View execution results

### For Admins

1. Manage users and assign roles
2. Add/edit database instances
3. Test database connections
4. View all requests

## Query Format Examples

### Find
```json
{
  "filter": { "status": "active" },
  "limit": 10,
  "sort": { "createdAt": -1 }
}
```

### Aggregate
```json
[
  { "$match": { "status": "active" } },
  { "$group": { "_id": "$category", "count": { "$sum": 1 } } }
]
```

### Update
```json
{
  "filter": { "_id": "..." },
  "update": { "$set": { "status": "inactive" } }
}
```

## Security

- OAuth ensures authenticated users only
- Connection strings encrypted at rest
- Role-based access control
- Query execution sandboxed per request
- Audit trail for all operations

## License

MIT
