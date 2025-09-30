const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Estado do jogo
const gameState = {
    players: {},
    food: [], // Array de comidas
    powerUps: [],
    obstacles: [],
    gameWidth: 600,
    gameHeight: 400,
    gameMode: 'classic',
    season: 'Halloween 2024',
    specialEvents: ['Zombie Invasion', 'Pumpkin Hunt'],
    gameStarted: false
};

// Sistema de ranking
let leaderboard = [];
const LEADERBOARD_FILE = 'leaderboard.json';

// Carregar ranking
try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
        leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
    }
} catch (error) {
    console.log('Erro ao carregar ranking:', error.message);
}

// Salvar ranking
function saveLeaderboard() {
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
    } catch (error) {
        console.log('Erro ao salvar ranking:', error.message);
    }
}

// Cores para jogadores
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function generateFood() {
    return {
        x: Math.floor(Math.random() * 30) * 20,
        y: Math.floor(Math.random() * 20) * 20
    };
}

function generateSingleFood() {
    // Gerar apenas 1-2 comidas por vez
    const count = Math.floor(Math.random() * 2) + 1;
    const food = [];
    for (let i = 0; i < count; i++) {
        food.push(generateFood());
    }
    return food;
}

function generatePowerUp() {
    const types = ['SPEED', 'INVINCIBLE', 'DOUBLE_POINTS', 'SHRINK', 'INVISIBLE', 'TELEPORT', 'BOMB', 'GHOST', 'PUMPKIN', 'BAT'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
        x: Math.floor(Math.random() * 30) * 20,
        y: Math.floor(Math.random() * 20) * 20,
        type: type,
        color: getPowerUpColor(type),
        id: Date.now() + Math.random()
    };
}

function getPowerUpColor(type) {
    const colors = {
        'SPEED': '#00ff00',
        'INVINCIBLE': '#ff00ff',
        'DOUBLE_POINTS': '#ffff00',
        'SHRINK': '#00ffff',
        'INVISIBLE': '#888888',
        'TELEPORT': '#ff8800',
        'BOMB': '#ff0000',
        'GHOST': '#E0E0E0',
        'PUMPKIN': '#FF6B35',
        'BAT': '#2C2C2C'
    };
    return colors[type] || '#ffffff';
}

function generateObstacles() {
    const obstacles = [];
    for (let i = 0; i < 5; i++) {
        obstacles.push({
            x: Math.floor(Math.random() * 30) * 20,
            y: Math.floor(Math.random() * 20) * 20
        });
    }
    return obstacles;
}

function checkCollision(player) {
    const head = player.snake[0];
    
    // Modo Classic: Cobra nao atravessa paredes laterais
    if (gameState.gameMode === 'classic') {
        if (head.x < 0 || head.x >= 600 || head.y < 0 || head.y >= 400) {
            return true;
        }
    }
    
    // Modo Battle: Cobra morre quando bate nas laterais
    if (gameState.gameMode === 'battle') {
        if (head.x < 0 || head.x >= 600 || head.y < 0 || head.y >= 400) {
            return true;
        }
    }
    
    // Obstaculos
    for (let obstacle of gameState.obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            return true;
        }
    }
    
    // Si mesmo
    for (let i = 1; i < player.snake.length; i++) {
        if (head.x === player.snake[i].x && head.y === player.snake[i].y) {
            return true;
        }
    }
    
    // Outros jogadores (modo batalha)
    if (gameState.gameMode === 'battle') {
        Object.values(gameState.players).forEach(otherPlayer => {
            if (otherPlayer.id !== player.id && otherPlayer.alive) {
                otherPlayer.snake.forEach(segment => {
                    if (head.x === segment.x && head.y === segment.y) {
                        return true;
                    }
                });
            }
        });
    }
    
    return false;
}

function moveSnake(player) {
    const head = { ...player.snake[0] };
    
    // Aplicar velocidade
    let speed = 1;
    if (player.speedBoost) speed = 2;
    
    switch (player.direction) {
        case 'up': head.y -= 20 * speed; break;
        case 'down': head.y += 20 * speed; break;
        case 'left': head.x -= 20 * speed; break;
        case 'right': head.x += 20 * speed; break;
    }
    
    // Modo Classic: Teleportar para o outro lado se sair das laterais
    if (gameState.gameMode === 'classic') {
        if (head.x < 0) head.x = 580;
        if (head.x >= 600) head.x = 0;
        if (head.y < 0) head.y = 380;
        if (head.y >= 400) head.y = 0;
    }
    
    player.snake.unshift(head);
    
    // Verificar comida
    let foodEaten = false;
    gameState.food = gameState.food.filter(food => {
        if (head.x === food.x && head.y === food.y) {
            let points = 10;
            if (player.doublePoints) points *= 2;
            if (gameState.season === 'Halloween 2024') points = Math.floor(points * 1.5);
            player.score += points;
            foodEaten = true;
            return false;
        }
        return true;
    });
    
    if (foodEaten) {
        // Adicionar apenas 1-2 comidas quando uma for comida
        const newFood = generateSingleFood();
        gameState.food.push(...newFood);
        
        // Chance de gerar power-up
        if (Math.random() < 0.2) {
            gameState.powerUps.push(generatePowerUp());
        }
    } else {
        player.snake.pop();
    }
    
    // Verificar power-ups
    gameState.powerUps = gameState.powerUps.filter(powerUp => {
        if (head.x === powerUp.x && head.y === powerUp.y) {
            applyPowerUp(player, powerUp.type);
            return false;
        }
        return true;
    });
}

function applyPowerUp(player, type) {
    switch (type) {
        case 'SPEED':
            player.speedBoost = true;
            setTimeout(() => { player.speedBoost = false; }, 5000);
            break;
        case 'INVINCIBLE':
            player.invincible = true;
            setTimeout(() => { player.invincible = false; }, 3000);
            break;
        case 'DOUBLE_POINTS':
            player.doublePoints = true;
            setTimeout(() => { player.doublePoints = false; }, 10000);
            break;
        case 'SHRINK':
            player.shrink = true;
            if (player.snake.length > 3) {
                player.snake = player.snake.slice(0, Math.floor(player.snake.length / 2));
            }
            setTimeout(() => { player.shrink = false; }, 8000);
            break;
        case 'INVISIBLE':
            player.invisible = true;
            setTimeout(() => { player.invisible = false; }, 5000);
            break;
        case 'TELEPORT':
            player.teleport = true;
            const newX = Math.floor(Math.random() * 30) * 20;
            const newY = Math.floor(Math.random() * 20) * 20;
            player.snake[0] = { x: newX, y: newY };
            setTimeout(() => { player.teleport = false; }, 1000);
            break;
        case 'BOMB':
            Object.values(gameState.players).forEach(otherPlayer => {
                if (otherPlayer.id !== player.id && otherPlayer.snake.length > 3) {
                    otherPlayer.snake = otherPlayer.snake.slice(0, Math.floor(otherPlayer.snake.length / 2));
                }
            });
            break;
        case 'GHOST':
            player.ghost = true;
            setTimeout(() => { player.ghost = false; }, 8000);
            break;
        case 'PUMPKIN':
            player.pumpkin = true;
            player.score += 50;
            setTimeout(() => { player.pumpkin = false; }, 5000);
            break;
        case 'BAT':
            player.bat = true;
            player.speedBoost = true;
            setTimeout(() => { 
                player.bat = false; 
                player.speedBoost = false; 
            }, 10000);
            break;
    }
}

function updateLeaderboard(player) {
    const existingIndex = leaderboard.findIndex(entry => entry.name === player.name);
    const entry = { name: player.name, score: player.score, date: new Date().toISOString() };
    
    if (existingIndex >= 0) {
        if (player.score > leaderboard[existingIndex].score) {
            leaderboard[existingIndex] = entry;
        }
    } else {
        leaderboard.push(entry);
    }
    
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    saveLeaderboard();
}

function broadcastRanking() {
    io.emit('rankingUpdate', leaderboard);
}

function triggerSeasonEvent() {
    const events = gameState.specialEvents;
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    io.emit('seasonEvent', randomEvent);
}

function startGame() {
    gameState.gameStarted = true;
    gameState.food = generateSingleFood();
    gameState.obstacles = generateObstacles();
    io.emit('gameStarted');
    console.log('Partida iniciada!');
}

io.on('connection', (socket) => {
    console.log('Jogador conectado:', socket.id);
    
    gameState.players[socket.id] = {
        id: socket.id,
        name: 'Jogador ' + (Object.keys(gameState.players).length + 1),
        snake: [{ x: 300, y: 200 }],
        direction: 'right',
        score: 0,
        color: getRandomColor(),
        alive: true,
        speedBoost: false,
        invincible: false,
        doublePoints: false,
        shrink: false,
        invisible: false,
        teleport: false,
        ghost: false,
        pumpkin: false,
        bat: false,
        team: null,
        skin: 'default',
        accessory: 'none',
        trail: 'none'
    };
    
    socket.emit('gameState', gameState);
    socket.emit('playerId', socket.id);
    socket.emit('rankingUpdate', leaderboard);
    
    // Notificar outros jogadores
    io.emit('playerJoined', gameState.players[socket.id]);
    
    // Mudanca de direcao
    socket.on('changeDirection', (direction) => {
        const player = gameState.players[socket.id];
        if (player && player.alive && gameState.gameStarted) {
            const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
            if (direction !== opposites[player.direction]) {
                player.direction = direction;
            }
        }
    });
    
    // Mudanca de nome
    socket.on('changeName', (newName) => {
        const player = gameState.players[socket.id];
        if (player && newName && newName.trim()) {
            const oldName = player.name;
            player.name = newName.trim();
            io.emit('playerNameChanged', { oldName: oldName, newName: newName });
        }
    });
    
    // Mudanca de skin
    socket.on('changeSkin', (skin) => {
        const player = gameState.players[socket.id];
        if (player) {
            player.skin = skin;
        }
    });
    
    // Mudanca de acessorio
    socket.on('changeAccessory', (accessory) => {
        const player = gameState.players[socket.id];
        if (player) {
            player.accessory = accessory;
        }
    });
    
    // Mudanca de efeito de rastro
    socket.on('changeTrail', (trail) => {
        const player = gameState.players[socket.id];
        if (player) {
            player.trail = trail;
        }
    });
    
    // Chat
    socket.on('chatMessage', (message) => {
        const player = gameState.players[socket.id];
        if (player) {
            io.emit('chatMessage', {
                player: player.name,
                message: message,
                color: player.color
            });
        }
    });
    
    // Mudanca de modo
    socket.on('changeMode', (mode) => {
        gameState.gameMode = mode;
        io.emit('gameModeChanged', mode);
    });
    
    // Iniciar jogo
    socket.on('startGame', () => {
        if (Object.keys(gameState.players).length >= 1 && !gameState.gameStarted) {
            startGame();
        }
    });
    
    // Desconexao
    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
        const player = gameState.players[socket.id];
        if (player) {
            updateLeaderboard(player);
            broadcastRanking();
        }
        delete gameState.players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

// Loop do jogo
setInterval(() => {
    if (!gameState.gameStarted) return;
    
    Object.values(gameState.players).forEach(player => {
        if (player.alive) {
            moveSnake(player);
            
            if (!player.invincible && !player.ghost && checkCollision(player)) {
                player.alive = false;
                updateLeaderboard(player);
                broadcastRanking();
                io.emit('playerDied', player.id);
                
                // Respawn apos 3 segundos
                setTimeout(() => {
                    if (gameState.players[player.id]) {
                        player.snake = [{ x: 300, y: 200 }];
                        player.direction = 'right';
                        player.alive = true;
                        player.speedBoost = false;
                        player.invincible = false;
                        player.doublePoints = false;
                        player.shrink = false;
                        player.invisible = false;
                        player.teleport = false;
                        player.ghost = false;
                        player.pumpkin = false;
                        player.bat = false;
                    }
                }, 3000);
            }
        }
    });
    
    // Limpar power-ups antigos
    gameState.powerUps = gameState.powerUps.filter(powerUp => {
        return Date.now() - powerUp.id < 15000;
    });
    
    // Eventos da temporada (chance de 1% a cada loop)
    if (Math.random() < 0.01) {
        triggerSeasonEvent();
    }
    
    io.emit('gameUpdate', gameState);
}, 150);

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Snake Multiplayer ULTIMATE FUNCIONANDO na porta ' + PORT);
    console.log('Abra http://localhost:' + PORT + ' para jogar!');
    console.log('Funcionalidades: 2 Modos de Jogo, Sala de Espera, Comidas Controladas, Power-ups e muito mais!');
});
