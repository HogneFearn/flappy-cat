# Flappy Bird Game - Node.js Deployment Guide

## CloudPanel Deployment Instructions

### Prerequisites
- CloudPanel with Node.js app support
- Access to file manager in CloudPanel

### Deployment Steps

1. **Create a new Node.js app in CloudPanel:**
   - Go to CloudPanel dashboard
   - Create new site/app
   - Choose Node.js application
   - Set the domain/subdomain

2. **Upload files via CloudPanel File Manager:**
   Upload these files to your app's root directory:
   ```
   server.js
   package.json
   public/
   ├── index.html
   ├── style.css
   ├── game.js
   └── cat.png
   ```

3. **Install dependencies:**
   - Open CloudPanel terminal for your app
   - Run: `npm install`

4. **Start the application:**
   - In CloudPanel, set the startup command to: `node server.js`
   - Or run manually: `npm start`

### File Structure
```
your-app/
├── server.js          (Express server)
├── package.json       (Dependencies)
├── game.db           (SQLite database - created automatically)
└── public/           (Static files)
    ├── index.html
    ├── style.css
    ├── game.js
    └── cat.png
```

### Features
- Multi-player shared leaderboard
- Per-player wallet persistence
- Real-time score updates
- Mobile-optimized gameplay
- Rare coin system (Gold: 1pt, Red: 5pts, Blue: 20pts)

### API Endpoints
- `GET /api/player/:name/wallet` - Get player wallet
- `POST /api/player/:name/wallet` - Update player wallet
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/leaderboard` - Add score to leaderboard
- `GET /api/highscore/obstacle` - Get high score
- `POST /api/highscore/obstacle` - Update high score

### Environment Variables (optional)
- `PORT` - Server port (default: 3000)

### Troubleshooting
- Ensure Node.js version is 14.0.0 or higher
- Check that all files are uploaded correctly
- Verify SQLite3 module is installed
- Check CloudPanel logs for any errors

### Local Development
```bash
npm install
npm start
```
Then visit `http://localhost:3000`
