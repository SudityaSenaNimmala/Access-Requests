// ==============================================================================
// MongoDB Initialization Script
// Creates the application database and user
// ==============================================================================

// Switch to the application database
db = db.getSiblingDB('db_access_tool');

// Create application user with readWrite permissions
db.createUser({
  user: 'app_user',
  pwd: 'app_password_change_me',
  roles: [
    {
      role: 'readWrite',
      db: 'db_access_tool'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ microsoftId: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.requests.createIndex({ developerId: 1, status: 1 });
db.requests.createIndex({ teamLeadId: 1, status: 1 });
db.requests.createIndex({ createdAt: -1 });
db.requests.createIndex({ status: 1 });

db.dbinstances.createIndex({ name: 1 }, { unique: true });
db.dbinstances.createIndex({ isActive: 1 });

print('✅ Database initialized successfully!');
print('📊 Collections and indexes created for db_access_tool');

