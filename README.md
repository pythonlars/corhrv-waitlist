# CorHRV Waiting List Application

## Overview
A professional waiting list management system for CorHRV - a Heart Rate Variability tracking app for Polar H10 users.

## Features
- **Public Waiting List Page**: Clean, modern design matching the provided screenshots
- **Admin Dashboard**: Secure admin area for managing signups
- **Authentication**: Login system with specified credentials
- **Real-time Statistics**: Track total signups, daily signups, and notification status
- **Export Functionality**: Download waitlist as CSV
- **Search & Filter**: Find specific users quickly
- **Notification Management**: Track who has been notified about app launch

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The application will run on http://localhost:3000

## Admin Access
- Click the "Admin" button in the top-right corner
- Login credentials:
  - Email: lars@lanian.ch
  - Password: Lars.128

## Admin Features
- View all waitlist entries
- Export data as CSV
- Mark users as notified
- Delete entries
- Search and filter users
- Send app download links (simulated)

## Project Structure
```
/app/
├── server.js           # Express server and API endpoints
├── package.json        # Node.js dependencies
├── /public/           
│   ├── index.html      # Main waiting list page
│   ├── admin.html      # Admin dashboard
│   ├── /css/          
│   │   ├── styles.css  # Main page styles
│   │   └── admin.css   # Admin dashboard styles
│   └── /js/           
│       ├── main.js     # Main page functionality
│       └── admin.js    # Admin dashboard functionality
└── /data/             
    └── waitlist.json   # Data storage (created automatically)
```

## API Endpoints
- `GET /api/waitlist/count` - Get total signup count
- `POST /api/waitlist` - Add new signup
- `POST /api/login` - Admin authentication
- `POST /api/logout` - Admin logout
- `GET /api/auth/check` - Check authentication status
- `GET /api/waitlist` - Get all entries (admin only)
- `DELETE /api/waitlist/:id` - Delete entry (admin only)
- `PUT /api/waitlist/:id/notify` - Mark as notified (admin only)
- `GET /api/waitlist/export` - Export as CSV (admin only)

## Email Configuration

To enable actual email sending from lars@lanian.ch:

1. **Create `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Configure Gmail App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Generate an App Password for "CorHRV Waitlist"
   - Add it to your `.env` file:
     ```
     EMAIL_USER=lars@lanian.ch
     EMAIL_PASS=your-16-character-app-password
     ```

3. **Restart the server** to load environment variables

## Security Notes
- In production, use environment variables for credentials
- Enable HTTPS for secure data transmission
- Implement rate limiting for API endpoints
- Add CSRF protection for forms
- Never commit `.env` file to version control

## Technologies Used
- Node.js & Express.js (Backend)
- Vanilla JavaScript (Frontend)
- Session-based authentication
- JSON file storage (for simplicity)
- Responsive CSS design
