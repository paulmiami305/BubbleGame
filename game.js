// Detect mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
}

// Game Configuration
const CONFIG = {
    BUBBLE_RADIUS: isMobileDevice() ? 18 : 20,
    ROWS: isMobileDevice() ? 6 : 10, // Reduced rows for mobile
    COLUMNS: isMobileDevice() ? 10 : 12, // Reduced columns for mobile
    COLORS: ['#00ffff', '#d946ef', '#8a2be2', '#00ff00', '#fde047', '#ff0000'], // Neon club colors: cyan, pink, blueviolet, green, yellow, red
    SHOOTER_Y_OFFSET: isMobileDevice() ? 40 : 50,
    GRAVITY: 0.3,
    BUBBLE_SPEED: 8,
    WALL_BOUNCE: 0.8,
    SOUND_ENABLED: true
};

// Sound Manager using Web Audio API
const SoundManager = {
    audioContext: null,
    initialized: false,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            CONFIG.SOUND_ENABLED = false;
        }
    },
    
    // Resume audio context (required by some browsers after user interaction)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // Play a collision sound (short pop)
    playCollision() {
        if (!CONFIG.SOUND_ENABLED || !this.audioContext) return;
        this.resumeContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    },
    
    // Play a match sound (satisfying chime)
    playMatch(count) {
        if (!CONFIG.SOUND_ENABLED || !this.audioContext) return;
        this.resumeContext();
        
        // Play multiple tones based on match count for more satisfying sound
        const baseFreq = 400;
        const tones = Math.min(count, 5); // Cap at 5 tones
        
        for (let i = 0; i < tones; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = baseFreq + (i * 100);
            oscillator.type = 'sine';
            
            const startTime = this.audioContext.currentTime + (i * 0.05);
            const duration = 0.2;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    },
    
    // Play falling bubble sound (whoosh/pop)
    playFalling(count) {
        if (!CONFIG.SOUND_ENABLED || !this.audioContext) return;
        this.resumeContext();
        
        // Play a whoosh sound for falling bubbles
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Descending frequency for whoosh effect
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
        
        // Add some pops for multiple bubbles
        if (count > 1) {
            for (let i = 1; i < Math.min(count, 4); i++) {
                setTimeout(() => {
                    const popOsc = this.audioContext.createOscillator();
                    const popGain = this.audioContext.createGain();
                    
                    popOsc.connect(popGain);
                    popGain.connect(this.audioContext.destination);
                    
                    popOsc.frequency.value = 150 + Math.random() * 50;
                    popOsc.type = 'square';
                    
                    popGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    popGain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    
                    popOsc.start(this.audioContext.currentTime);
                    popOsc.stop(this.audioContext.currentTime + 0.1);
                }, i * 50);
            }
        }
    }
};

// Initialize sound manager
SoundManager.init();

// Music Player using HTML5 Audio
const MusicPlayer = {
    audio: null,
    isMuted: false,
    hasStarted: false,
    
    init() {
        this.audio = document.getElementById('backgroundMusic');
        if (!this.audio) return;
        
        // Set volume (lower so it doesn't overpower game sounds)
        this.audio.volume = 0.4;
        
        // Don't try to autoplay - wait for play button click
        // The play button will trigger the music to start
    },
    
    // Try to autoplay the music
    async tryAutoplay() {
        if (!this.audio || this.hasStarted) return;
        
        try {
            await this.audio.play();
            this.hasStarted = true;
        } catch (error) {
            // Autoplay was prevented, will need user interaction
            // This is normal for most browsers
        }
    },
    
    // Play the music
    async play() {
        if (!this.audio) return;
        
        try {
            await this.audio.play();
            this.hasStarted = true;
        } catch (error) {
            // Play failed
            console.log('Play failed:', error);
        }
    },
    
    // Pause the music
    pause() {
        if (!this.audio) return;
        this.audio.pause();
    },
    
    // Toggle mute
    toggleMute() {
        if (!this.audio) return false;
        
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.audio.volume = 0;
        } else {
            this.audio.volume = 0.4;
            // Try to play if not already playing
            this.play().catch(() => {});
        }
        return this.isMuted;
    }
};

// Initialize music player when DOM is ready
function initMusicPlayer() {
    MusicPlayer.init();
    
    // Set up music toggle button
    const musicToggle = document.getElementById('musicToggle');
    const musicIcon = document.getElementById('musicIcon');
    
    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            const isMuted = MusicPlayer.toggleMute();
            musicToggle.classList.toggle('muted', isMuted);
            musicIcon.textContent = isMuted ? '🔇' : '🎵';
            
            // Resume audio context if needed (for game sounds)
            SoundManager.resumeContext();
            
            // Try to play music if unmuted (in case autoplay was blocked)
            if (!isMuted) {
                MusicPlayer.play().catch(() => {});
            }
        });
        
        // Also try to start music when toggle is clicked
        musicToggle.addEventListener('click', () => {
            if (!MusicPlayer.hasStarted) {
                MusicPlayer.play().catch(() => {});
            }
        }, { once: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
    initMusicPlayer();
}

// Game State
const gameState = {
    bubbles: [],
    fallingBubbles: [],
    poppingBubbles: [], // Bubbles currently animating their pop
    shooterBubble: null,
    nextBubble: null,
    shooting: false,
    score: 0,
    level: 1,
    gameOver: false,
    gameWon: false
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextBubbleCanvas');
const nextCtx = nextCanvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = container.clientWidth;
    
    // Better mobile height calculation
    const isMobile = isMobileDevice();
    const headerHeight = isMobile ? 50 : 60;
    const controlsHeight = isMobile ? 60 : 80;
    const logoHeight = isMobile ? 80 : 100;
    const maxHeight = window.innerHeight - headerHeight - controlsHeight - logoHeight;
    
    canvas.width = maxWidth;
    canvas.height = Math.min(maxHeight, isMobile ? 500 : 600);
    
    // Redraw if game has started
    if (gameState.bubbles.length > 0) {
        draw();
    }
}

resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    // Recalculate mobile settings on resize (e.g., device rotation)
    if (gameState.bubbles.length === 0) {
        // Only update config if game hasn't started
        const wasMobile = CONFIG.ROWS === 6;
        const isNowMobile = isMobileDevice();
        if (wasMobile !== isNowMobile) {
            CONFIG.BUBBLE_RADIUS = isNowMobile ? 18 : 20;
            CONFIG.ROWS = isNowMobile ? 6 : 10;
            CONFIG.COLUMNS = isNowMobile ? 10 : 12;
            CONFIG.SHOOTER_Y_OFFSET = isNowMobile ? 40 : 50;
        }
    }
});

// Bubble Class
class Bubble {
    constructor(x, y, color, gridX = null, gridY = null) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = CONFIG.BUBBLE_RADIUS;
        this.vx = 0;
        this.vy = 0;
        this.gridX = gridX;
        this.gridY = gridY;
        this.marked = false;
        this.falling = false;
    }
    
    draw() {
        ctx.save();
        
        // Base glass ball - brighter and more transparent with color tint
        const baseGradient = ctx.createRadialGradient(
            this.x - this.radius * 0.2,
            this.y - this.radius * 0.2,
            0,
            this.x,
            this.y,
            this.radius
        );
        baseGradient.addColorStop(0, this.colorToRGBA(this.color, 0.5));
        baseGradient.addColorStop(0.5, this.colorToRGBA(this.color, 0.6));
        baseGradient.addColorStop(1, this.colorToRGBA(this.color, 0.7));
        
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Lighter rim at bottom for subtle 3D depth
        const rimGradient = ctx.createLinearGradient(
            this.x, this.y - this.radius,
            this.x, this.y + this.radius
        );
        rimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        rimGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.03)');
        rimGradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.08)');
        rimGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        
        ctx.fillStyle = rimGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Main highlight - bright white reflection at top-left
        const highlightGradient = ctx.createRadialGradient(
            this.x - this.radius * 0.4,
            this.y - this.radius * 0.4,
            0,
            this.x - this.radius * 0.4,
            this.y - this.radius * 0.4,
            this.radius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
        highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Secondary smaller highlight for more realism
        const smallHighlight = ctx.createRadialGradient(
            this.x - this.radius * 0.25,
            this.y - this.radius * 0.5,
            0,
            this.x - this.radius * 0.25,
            this.y - this.radius * 0.5,
            this.radius * 0.3
        );
        smallHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        smallHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = smallHighlight;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Edge highlight - rim light for glass effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Lighter inner shadow at bottom for subtle depth
        const innerShadow = ctx.createRadialGradient(
            this.x,
            this.y + this.radius * 0.3,
            0,
            this.x,
            this.y + this.radius * 0.3,
            this.radius * 0.7
        );
        innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
        innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = innerShadow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    colorToRGBA(color, alpha) {
        const num = parseInt(color.replace("#", ""), 16);
        const r = (num >> 16) & 0xFF;
        const g = (num >> 8) & 0xFF;
        const b = num & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const r = Math.max(0, (num >> 16) - percent);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
        const b = Math.max(0, (num & 0x0000FF) - percent);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const r = Math.min(255, (num >> 16) + percent);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
        const b = Math.min(255, (num & 0x0000FF) + percent);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    update() {
        if (this.falling) {
            this.vy += CONFIG.GRAVITY;
            this.y += this.vy;
            this.x += this.vx;
            
            // Bounce off walls
            if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
                this.vx *= -CONFIG.WALL_BOUNCE;
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            }
        }
    }
    
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Initialize game grid
function initGame() {
    gameState.bubbles = [];
    gameState.fallingBubbles = [];
    gameState.shooting = false;
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.score = 0;
    
    // Create initial bubble grid
    const startY = 60;
    const spacing = CONFIG.BUBBLE_RADIUS * 2;
    
    for (let row = 0; row < CONFIG.ROWS; row++) {
        const offsetX = row % 2 === 1 ? CONFIG.BUBBLE_RADIUS : 0;
        for (let col = 0; col < CONFIG.COLUMNS; col++) {
            const x = offsetX + col * spacing + CONFIG.BUBBLE_RADIUS;
            const y = startY + row * spacing * 0.866; // Hexagonal spacing
            
            if (x + CONFIG.BUBBLE_RADIUS <= canvas.width) {
                const color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
                gameState.bubbles.push(new Bubble(x, y, color, col, row));
            }
        }
    }
    
    // Create shooter and next bubble
    createShooterBubble();
    createNextBubble();
    
    updateUI();
    draw();
}

// Create shooter bubble
function createShooterBubble() {
    const color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    gameState.shooterBubble = new Bubble(
        canvas.width / 2,
        canvas.height - CONFIG.SHOOTER_Y_OFFSET,
        color
    );
}

// Create next bubble preview
function createNextBubble() {
    const color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    gameState.nextBubble = { color };
    
    // Draw next bubble preview as glass ball
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Dark background
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Base glass ball - brighter and more transparent with color tint
    const baseGradient = nextCtx.createRadialGradient(25, 25, 0, 30, 30, 25);
    baseGradient.addColorStop(0, colorToRGBAForNext(color, 0.5));
    baseGradient.addColorStop(0.5, colorToRGBAForNext(color, 0.6));
    baseGradient.addColorStop(1, colorToRGBAForNext(color, 0.7));
    
    nextCtx.fillStyle = baseGradient;
    nextCtx.beginPath();
    nextCtx.arc(30, 30, 25, 0, Math.PI * 2);
    nextCtx.fill();
    
    // Lighter rim at bottom for subtle 3D depth
    const rimGradient = nextCtx.createLinearGradient(30, 5, 30, 55);
    rimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rimGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.03)');
    rimGradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.08)');
    rimGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    
    nextCtx.fillStyle = rimGradient;
    nextCtx.beginPath();
    nextCtx.arc(30, 30, 25, 0, Math.PI * 2);
    nextCtx.fill();
    
    // Main highlight - bright white reflection at top-left
    const highlightGradient = nextCtx.createRadialGradient(18, 18, 0, 18, 18, 15);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    nextCtx.fillStyle = highlightGradient;
    nextCtx.beginPath();
    nextCtx.arc(30, 30, 25, 0, Math.PI * 2);
    nextCtx.fill();
    
    // Secondary smaller highlight
    const smallHighlight = nextCtx.createRadialGradient(22, 15, 0, 22, 15, 8);
    smallHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    smallHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    nextCtx.fillStyle = smallHighlight;
    nextCtx.beginPath();
    nextCtx.arc(30, 30, 25, 0, Math.PI * 2);
    nextCtx.fill();
    
    // Edge highlight - rim light for glass effect
    nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    nextCtx.lineWidth = 1;
    nextCtx.beginPath();
    nextCtx.arc(30, 30, 24.5, 0, Math.PI * 2);
    nextCtx.stroke();
    
    // Lighter inner shadow at bottom for subtle depth
    const innerShadow = nextCtx.createRadialGradient(30, 38, 0, 30, 38, 18);
    innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
    innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    nextCtx.fillStyle = innerShadow;
    nextCtx.beginPath();
    nextCtx.arc(30, 30, 22, 0, Math.PI * 2);
    nextCtx.fill();
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenColorForNext(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - percent);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
    const b = Math.max(0, (num & 0x0000FF) - percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function colorToRGBAForNext(color, alpha) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = (num >> 16) & 0xFF;
    const g = (num >> 8) & 0xFF;
    const b = num & 0xFF;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorToRGBAForPop(color, alpha) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = (num >> 16) & 0xFF;
    const g = (num >> 8) & 0xFF;
    const b = num & 0xFF;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Shooting mechanics
let aimAngle = -Math.PI / 2;
let isAiming = false;
let mouseX = 0;
let mouseY = 0;
let isMouseOverCanvas = false;

function shootBubble() {
    if (gameState.shooting || gameState.gameOver) return;
    
    gameState.shooting = true;
    const bubble = gameState.shooterBubble;
    
    bubble.vx = Math.cos(aimAngle) * CONFIG.BUBBLE_SPEED;
    bubble.vy = Math.sin(aimAngle) * CONFIG.BUBBLE_SPEED;
    
    function animate() {
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Check wall collisions
        if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
            bubble.vx *= -1;
            bubble.x = Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.x));
        }
        
        // Check ceiling collision
        if (bubble.y - bubble.radius < 0) {
            bubble.y = bubble.radius;
            snapBubbleToGrid(bubble);
            return;
        }
        
        // Check collision with existing bubbles
        for (let existingBubble of gameState.bubbles) {
            const distance = bubble.distanceTo(existingBubble);
            if (distance < bubble.radius * 2) {
                // Play collision sound
                SoundManager.playCollision();
                snapBubbleToGrid(bubble, existingBubble);
                return;
            }
        }
        
        // Continue if bubble is still moving
        if (bubble.y < canvas.height) {
            requestAnimationFrame(animate);
            draw();
        } else {
            // Bubble fell off screen - game over
            endGame(false);
        }
    }
    
    animate();
}

// Snap bubble to grid position
function snapBubbleToGrid(bubble, collisionBubble = null) {
    const spacing = CONFIG.BUBBLE_RADIUS * 2;
    const hexHeight = spacing * 0.866; // sqrt(3)/2
    
    let bestX = bubble.x;
    let bestY = bubble.y;
    let minDist = Infinity;
    
    // Find the nearest valid grid position
    const startY = 60;
    const maxRows = 20;
    
    for (let row = 0; row < maxRows; row++) {
        const offsetX = row % 2 === 1 ? CONFIG.BUBBLE_RADIUS : 0;
        const y = startY + row * hexHeight;
        
        // Calculate how many columns fit
        const maxCols = Math.floor((canvas.width - offsetX) / spacing);
        
        for (let col = 0; col < maxCols; col++) {
            const x = offsetX + col * spacing + CONFIG.BUBBLE_RADIUS;
            
            // Check if this position is too close to existing bubbles
            let tooClose = false;
            for (let existing of gameState.bubbles) {
                const dist = Math.sqrt((x - existing.x) ** 2 + (y - existing.y) ** 2);
                if (dist < spacing * 0.9) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                const dist = Math.sqrt((bubble.x - x) ** 2 + (bubble.y - y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    bestX = x;
                    bestY = y;
                }
            }
        }
    }
    
    // If we found a collision bubble, prefer positions near it
    if (collisionBubble && minDist > spacing) {
        const neighbors = [
            { x: collisionBubble.x - spacing, y: collisionBubble.y },
            { x: collisionBubble.x + spacing, y: collisionBubble.y },
            { x: collisionBubble.x - spacing / 2, y: collisionBubble.y - hexHeight },
            { x: collisionBubble.x + spacing / 2, y: collisionBubble.y - hexHeight },
            { x: collisionBubble.x - spacing / 2, y: collisionBubble.y + hexHeight },
            { x: collisionBubble.x + spacing / 2, y: collisionBubble.y + hexHeight }
        ];
        
        for (let neighbor of neighbors) {
            let tooClose = false;
            for (let existing of gameState.bubbles) {
                const dist = Math.sqrt((neighbor.x - existing.x) ** 2 + (neighbor.y - existing.y) ** 2);
                if (dist < spacing * 0.9) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose && neighbor.x >= CONFIG.BUBBLE_RADIUS && neighbor.x <= canvas.width - CONFIG.BUBBLE_RADIUS) {
                const dist = Math.sqrt((bubble.x - neighbor.x) ** 2 + (bubble.y - neighbor.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    bestX = neighbor.x;
                    bestY = neighbor.y;
                }
            }
        }
    }
    
    bubble.x = bestX;
    bubble.y = bestY;
    
    // Add to grid
    gameState.bubbles.push(bubble);
    
    // Check for matches
    checkMatches(bubble);
    
    // Check for disconnected bubbles
    checkDisconnectedBubbles();
    
    // Check win condition
    if (gameState.bubbles.length === 0) {
        endGame(true);
        return;
    }
    
    // Check lose condition (bubbles too low)
    const lowestBubble = Math.max(...gameState.bubbles.map(b => b.y));
    if (lowestBubble > canvas.height - 100) {
        endGame(false);
        return;
    }
    
    // Prepare next shot
    gameState.shooterBubble = new Bubble(
        canvas.width / 2,
        canvas.height - CONFIG.SHOOTER_Y_OFFSET,
        gameState.nextBubble.color
    );
    createNextBubble();
    gameState.shooting = false;
    draw();
}

// Find matching bubbles (3+ of same color)
function checkMatches(startBubble) {
    const matches = findConnectedBubbles(startBubble, startBubble.color);
    
    if (matches.length >= 3) {
        // Play match sound
        SoundManager.playMatch(matches.length);
        
        // Create pop animations for matched bubbles
        matches.forEach(bubble => {
            const index = gameState.bubbles.indexOf(bubble);
            if (index > -1) {
                gameState.bubbles.splice(index, 1);
                
                // Add to popping bubbles with animation state
                const popBubble = {
                    x: bubble.x,
                    y: bubble.y,
                    color: bubble.color,
                    radius: bubble.radius,
                    scale: 1.0,
                    alpha: 1.0,
                    startTime: Date.now()
                };
                gameState.poppingBubbles.push(popBubble);
            }
        });
        
        // Start pop animation
        animatePop();
        
        // Update score
        gameState.score += matches.length * 10;
        updateUI();
        
        // Wait for animation before checking disconnected bubbles
        setTimeout(() => {
            // Check for disconnected bubbles after removal
            checkDisconnectedBubbles();
            
            // Check win condition
            if (gameState.bubbles.length === 0) {
                endGame(true);
                return;
            }
        }, 200); // Wait for pop animation
    }
}

// Animate popping bubbles
function animatePop() {
    const now = Date.now();
    const duration = 200; // Animation duration in ms
    
    // Update and remove finished animations
    for (let i = gameState.poppingBubbles.length - 1; i >= 0; i--) {
        const popBubble = gameState.poppingBubbles[i];
        const elapsed = now - popBubble.startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) {
            // Animation complete, remove it
            gameState.poppingBubbles.splice(i, 1);
        } else {
            // Update animation
            // Scale up then down (pop effect)
            if (progress < 0.3) {
                // Expand phase
                popBubble.scale = 1 + (progress / 0.3) * 0.5; // Scale to 1.5x
            } else {
                // Shrink and fade phase
                const shrinkProgress = (progress - 0.3) / 0.7;
                popBubble.scale = 1.5 - (shrinkProgress * 1.5);
                popBubble.alpha = 1 - shrinkProgress;
            }
        }
    }
    
    // Continue animation if there are still popping bubbles
    if (gameState.poppingBubbles.length > 0) {
        draw();
        requestAnimationFrame(animatePop);
    } else {
        draw();
    }
}

// Find all connected bubbles of the same color
function findConnectedBubbles(startBubble, color) {
    const visited = new Set();
    const matches = [];
    
    function dfs(bubble) {
        if (visited.has(bubble) || bubble.color !== color) return;
        
        visited.add(bubble);
        matches.push(bubble);
        
        // Check all nearby bubbles
        for (let other of gameState.bubbles) {
            if (!visited.has(other) && bubble.distanceTo(other) < CONFIG.BUBBLE_RADIUS * 2.1) {
                dfs(other);
            }
        }
    }
    
    dfs(startBubble);
    return matches;
}

// Check for bubbles disconnected from ceiling
function checkDisconnectedBubbles() {
    if (gameState.bubbles.length === 0) return;
    
    // Start from top row - mark all connected to ceiling
    const topBubbles = gameState.bubbles.filter(b => b.y < 100);
    const connected = new Set();
    
    function markConnected(bubble) {
        if (connected.has(bubble)) return;
        connected.add(bubble);
        
        for (let other of gameState.bubbles) {
            if (!connected.has(other) && bubble.distanceTo(other) < CONFIG.BUBBLE_RADIUS * 2.1) {
                markConnected(other);
            }
        }
    }
    
    topBubbles.forEach(b => markConnected(b));
    
    // Remove disconnected bubbles (make them fall)
    const disconnected = gameState.bubbles.filter(b => !connected.has(b));
    
    if (disconnected.length > 0) {
        // Play falling sound
        SoundManager.playFalling(disconnected.length);
        
        disconnected.forEach(bubble => {
            const index = gameState.bubbles.indexOf(bubble);
            if (index > -1) {
                gameState.bubbles.splice(index, 1);
                bubble.falling = true;
                bubble.vx = (Math.random() - 0.5) * 2;
                bubble.vy = 0;
                gameState.fallingBubbles.push(bubble);
                
                // Add score for falling bubbles
                gameState.score += 5;
            }
        });
        
        updateUI();
        animateFallingBubbles();
    }
}

// Animate falling bubbles
function animateFallingBubbles() {
    function animate() {
        let hasActive = false;
        
        for (let i = gameState.fallingBubbles.length - 1; i >= 0; i--) {
            const bubble = gameState.fallingBubbles[i];
            
            if (bubble.y < canvas.height + 100) {
                bubble.update();
                hasActive = true;
            } else {
                // Remove bubbles that have fallen off screen
                gameState.fallingBubbles.splice(i, 1);
            }
        }
        
        if (hasActive) {
            draw();
            requestAnimationFrame(animate);
        } else {
            draw();
        }
    }
    
    animate();
}

// Drawing functions
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw dark club background with subtle lighting
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle ambient lighting effects
    const lightGradient1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 0,
        canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.8
    );
    lightGradient1.addColorStop(0, 'rgba(0, 255, 255, 0.05)');
    lightGradient1.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const lightGradient2 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.4, 0,
        canvas.width * 0.8, canvas.height * 0.4, canvas.width * 0.7
    );
    lightGradient2.addColorStop(0, 'rgba(255, 0, 255, 0.05)');
    lightGradient2.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const lightGradient3 = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.1, 0,
        canvas.width * 0.5, canvas.height * 0.1, canvas.width * 0.6
    );
    lightGradient3.addColorStop(0, 'rgba(138, 43, 226, 0.04)');
    lightGradient3.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGradient3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all bubbles
    gameState.bubbles.forEach(bubble => bubble.draw());
    
    // Draw popping bubbles (with animation)
    gameState.poppingBubbles.forEach(popBubble => {
        ctx.save();
        ctx.globalAlpha = popBubble.alpha;
        
        // Draw popping bubble with scale effect
        const currentRadius = popBubble.radius * popBubble.scale;
        
        // Base glass ball - brighter and more transparent with color tint
        const baseGradient = ctx.createRadialGradient(
            popBubble.x - currentRadius * 0.2,
            popBubble.y - currentRadius * 0.2,
            0,
            popBubble.x,
            popBubble.y,
            currentRadius
        );
        baseGradient.addColorStop(0, colorToRGBAForPop(popBubble.color, 0.3));
        baseGradient.addColorStop(0.5, colorToRGBAForPop(popBubble.color, 0.4));
        baseGradient.addColorStop(1, colorToRGBAForPop(popBubble.color, 0.5));
        
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(popBubble.x, popBubble.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Main highlight - bright white reflection
        const highlightGradient = ctx.createRadialGradient(
            popBubble.x - currentRadius * 0.4,
            popBubble.y - currentRadius * 0.4,
            0,
            popBubble.x - currentRadius * 0.4,
            popBubble.y - currentRadius * 0.4,
            currentRadius * 0.6
        );
        highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * popBubble.alpha})`);
        highlightGradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.7 * popBubble.alpha})`);
        highlightGradient.addColorStop(0.6, `rgba(255, 255, 255, ${0.3 * popBubble.alpha})`);
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(popBubble.x, popBubble.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Draw falling bubbles
    gameState.fallingBubbles.forEach(bubble => bubble.draw());
    
    // Draw shooter
    if (gameState.shooterBubble && !gameState.shooting) {
        gameState.shooterBubble.draw();
        
        // Draw neon aim line - always visible
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(gameState.shooterBubble.x, gameState.shooterBubble.y);
        const lineLength = 200;
        ctx.lineTo(
            gameState.shooterBubble.x + Math.cos(aimAngle) * lineLength,
            gameState.shooterBubble.y + Math.sin(aimAngle) * lineLength
        );
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add subtle glow to aim line
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(gameState.shooterBubble.x, gameState.shooterBubble.y);
        ctx.lineTo(
            gameState.shooterBubble.x + Math.cos(aimAngle) * lineLength,
            gameState.shooterBubble.y + Math.sin(aimAngle) * lineLength
        );
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Draw shooting bubble
    if (gameState.shooting && gameState.shooterBubble) {
        gameState.shooterBubble.draw();
    }
}

// Input handling
function handleAim(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX || event.touches[0].clientX) - rect.left;
    const y = (event.clientY || event.touches[0].clientY) - rect.top;
    
    mouseX = x;
    mouseY = y;
    
    const shooterX = canvas.width / 2;
    const shooterY = canvas.height - CONFIG.SHOOTER_Y_OFFSET;
    
    const dx = x - shooterX;
    const dy = y - shooterY;
    
    aimAngle = Math.atan2(dy, dx);
    
    // Limit angle to upper half
    if (aimAngle > -0.1) aimAngle = -0.1;
    if (aimAngle < -Math.PI + 0.1) aimAngle = -Math.PI + 0.1;
    
    isAiming = true;
    draw();
}

// Update aim angle based on mouse position
function updateAimFromMouse() {
    if (!isMouseOverCanvas || gameState.shooting || gameState.gameOver) return;
    
    const shooterX = canvas.width / 2;
    const shooterY = canvas.height - CONFIG.SHOOTER_Y_OFFSET;
    
    const dx = mouseX - shooterX;
    const dy = mouseY - shooterY;
    
    aimAngle = Math.atan2(dy, dx);
    
    // Limit angle to upper half
    if (aimAngle > -0.1) aimAngle = -0.1;
    if (aimAngle < -Math.PI + 0.1) aimAngle = -Math.PI + 0.1;
}

function handleShoot() {
    if (isAiming && !gameState.shooting && !gameState.gameOver) {
        shootBubble();
    }
    isAiming = false;
}

// Mouse events
canvas.addEventListener('mouseenter', (e) => {
    isMouseOverCanvas = true;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    updateAimFromMouse();
    draw();
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    SoundManager.resumeContext(); // Resume audio context on first interaction
    handleAim(e);
});

canvas.addEventListener('mousemove', (e) => {
    handleAim(e);
    if (!gameState.shooting) {
        draw();
    }
});

canvas.addEventListener('mouseup', (e) => {
    e.preventDefault();
    handleShoot();
});

canvas.addEventListener('mouseleave', () => {
    isAiming = false;
    isMouseOverCanvas = false;
    draw();
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    SoundManager.resumeContext(); // Resume audio context on first interaction
    isMouseOverCanvas = true;
    handleAim(e);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleAim(e);
    if (!gameState.shooting) {
        draw();
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleShoot();
    isMouseOverCanvas = false;
});

// UI updates
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
}

// Game over
function endGame(won) {
    gameState.gameOver = true;
    gameState.gameWon = won;
    
    const overlay = document.getElementById('gameOverlay');
    const title = document.getElementById('overlayTitle');
    const message = document.getElementById('overlayMessage');
    const finalScore = document.getElementById('finalScore');
    
    title.textContent = won ? 'You Win!' : 'Game Over';
    finalScore.textContent = gameState.score;
    overlay.classList.add('active');
}

// Restart button
document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('gameOverlay').classList.remove('active');
    initGame();
});

// Music will start when play button is clicked, so we don't need these handlers

// Game loop for continuous updates
function gameLoop() {
    // Update falling bubbles
    for (let i = gameState.fallingBubbles.length - 1; i >= 0; i--) {
        const bubble = gameState.fallingBubbles[i];
        bubble.update();
        
        // Remove bubbles that have fallen off screen
        if (bubble.y > canvas.height + 100) {
            gameState.fallingBubbles.splice(i, 1);
        }
    }
    
    // Redraw if there are falling bubbles, aiming, or mouse is over canvas
    if (gameState.fallingBubbles.length > 0 || isAiming || isMouseOverCanvas) {
        draw();
    }
    
    // Update aim line continuously
    if (isMouseOverCanvas && !gameState.shooting && !gameState.gameOver) {
        updateAimFromMouse();
    }
    
    requestAnimationFrame(gameLoop);
}

// Play button handler - dismiss overlay and start music
const playButton = document.getElementById('playButton');
const playOverlay = document.getElementById('playOverlay');

if (playButton && playOverlay) {
    playButton.addEventListener('click', () => {
        // Hide the play overlay
        playOverlay.classList.add('hidden');
        
        // Start the background music (this will work because we have user interaction)
        MusicPlayer.play().catch(err => {
            console.log('Music play failed:', err);
        });
        
        // Resume audio context for game sounds
        SoundManager.resumeContext();
    });
}

// Start game
initGame();
gameLoop();
