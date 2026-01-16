# Bubble Shooter Game

A browser-based bubble shooter game built with HTML5 Canvas and vanilla JavaScript. Playable on both desktop and mobile devices.

## Features

- **Classic Bubble Shooter Gameplay**: Aim and shoot bubbles to match 3+ of the same color
- **Physics-Based Shooting**: Realistic bubble trajectory with wall bouncing
- **Smart Matching**: Automatic detection and removal of matching bubble groups
- **Gravity System**: Disconnected bubbles fall and can be cleared for bonus points
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Touch Controls**: Full touch support for mobile gameplay
- **Score System**: Earn points for matching bubbles and clearing falling bubbles
- **Modern UI**: Beautiful gradient design with smooth animations

## How to Play

1. **Aim**: Move your mouse or finger to aim the shooter
2. **Shoot**: Click or release to fire a bubble
3. **Match**: Connect 3 or more bubbles of the same color to clear them
4. **Win**: Clear all bubbles to win the level
5. **Lose**: If bubbles reach the bottom, the game ends

## Controls

- **Desktop**: Click and drag to aim, release to shoot
- **Mobile**: Touch and drag to aim, release to shoot

## Installation

Simply open `index.html` in a modern web browser. No build process or dependencies required!

## Deployment to Vercel

This game can be easily deployed to Vercel:

### Option 1: Using Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Navigate to the project directory:
   ```bash
   cd /path/to/Game
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project or create a new one.

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Vercel will automatically detect it as a static site
5. Click "Deploy"

### Option 3: Using Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Vercel dashboard
3. Click "Add New Project"
4. Import your repository
5. Vercel will auto-deploy on every push

The game will be live at `your-project-name.vercel.app`!

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Game Mechanics

- **Bubble Colors**: 6 different colors for variety
- **Grid System**: Hexagonal grid layout for optimal bubble placement
- **Collision Detection**: Accurate bubble-to-bubble and wall collision detection
- **Chain Reactions**: Clearing bubbles can cause others to fall, creating combo opportunities

## Customization

You can easily customize the game by modifying the `CONFIG` object in `game.js`:

```javascript
const CONFIG = {
    BUBBLE_RADIUS: 20,        // Size of bubbles
    ROWS: 10,                 // Initial rows of bubbles
    COLUMNS: 12,              // Columns in grid
    COLORS: [...],            // Bubble colors
    BUBBLE_SPEED: 8,          // Shooting speed
    GRAVITY: 0.3              // Falling speed
};
```

Enjoy playing!
# BubbleGame
