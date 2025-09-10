# CorHRV Waiting List Website Planning

## Project Overview
A waiting list website with admin login functionality for managing waitlist entries.

## Key Features
1. **Public Waiting List Page**
   - Modern, clean design
   - Form for users to join waiting list
   - Admin button in top-right corner

2. **Admin Authentication**
   - Login modal/window
   - Credentials: lars@lanian.ch / Lars.128
   - Session management

3. **Admin Dashboard**
   - View all waiting list entries
   - Manage/delete entries
   - Export functionality

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js + Express
- Database: JSON file storage (for simplicity)
- Authentication: Simple session-based

## File Structure
```
/app/
├── planning.md
├── task.md
├── readme.md
├── package.json
├── server.js
├── /public/
│   ├── index.html
│   ├── admin.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── main.js
│       └── admin.js
└── /data/
    └── waitlist.json
```

## Security Considerations
- Password stored as environment variable (in production)
- Session timeout after inactivity
- HTTPS in production
- Input validation and sanitization
