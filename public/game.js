const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos do DOM
const scoreElement = document.getElementById('score');
const playerCountElement = document.getElementById('playerCount');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('level');
const seasonPointsElement = document.getElementById('seasonPoints');
const playersListElement = document.getElementById('playersList');
const rankingListElement = document.getElementById('rankingList');
const chatMessagesElement = document.getElementById('chatMessages');
const chatInputElement = document.getElementById('chatInput');
const chatSendElement = document.getElementById('chatSend');
const powerUpsElement = document.getElementById('powerUps');
const gameEventsElement = document.getElementById('gameEvents');
const playerNameDisplayElement = document.getElementById('playerNameDisplay');
const playerStatsElement = document.getElementById('playerStats');
const playerAvatarElement = document.getElementById('playerAvatar');
const playerLevelElement = document.getElementById('playerLevel');
const nameInputElement = document.getElementById('nameInput');
const nameChangeBtnElement = document.getElementById('nameChangeBtn');
const seasonBannerElement = document.getElementById('seasonBanner');

// Sala de espera
const waitingRoomElement = document.getElementById('waitingRoom');
const waitingPlayersElement = document.getElementById('waitingPlayers');
const startGameBtnElement = document.getElementById('startGameBtn');

// Estado do jogo
let gameState = { players: {}, food: [], powerUps: [], obstacles: [] };
let myPlayerId = null;
let myScore = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let currentTheme = 'default';
let currentMode = 'classic';
let globalRanking = [];
let gameEvents = [];
let playerName = localStorage.getItem('playerName') || 'Jogador 1';
let seasonPoints = parseInt(localStorage.getItem('seasonPoints') || '0');
let currentSeason = 'Halloween 2024';
let selectedSkin = localStorage.getItem('selectedSkin') || 'default';
let selectedAccessory = localStorage.getItem('selectedAccessory') || 'none';
let selectedTrail = localStorage.getItem('selectedTrail') || 'none';
let gameStarted = false;

// Controle de movimento
let lastDirection = null;
let lastMoveTime = 0;
const MOVE_INTERVAL = 150;

const GRID_SIZE = 20;

// Temas
const themes = {
    default: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', canvas: '#000', grid: '#333' },
    dark: { background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', canvas: '#1a1a1a', grid: '#444' },
    neon: { background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)', canvas: '#000', grid: '#00ff88' },
    sunset: { background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', canvas: '#1a0a0a', grid: '#ff6b6b' },
    halloween: { background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', canvas: '#1a0a0a', grid: '#ff6b35' }
};

// Skins de cobra
const snakeSkins = {
    default: { name: 'Classica', color: '#4CAF50', pattern: 'solid' },
    fire: { name: 'Fogo', color: '#FF5722', pattern: 'flame' },
    ice: { name: 'Gelo', color: '#2196F3', pattern: 'ice' },
    rainbow: { name: 'Arco-iris', color: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', pattern: 'rainbow' },
    ghost: { name: 'Fantasma', color: '#E0E0E0', pattern: 'ghost' },
    zombie: { name: 'Zumbi', color: '#8BC34A', pattern: 'zombie' }
};

// Acessorios
const accessories = {
    none: { name: 'Nenhum', icon: 'S' },
    crown: { name: 'Coroa', icon: 'C' },
    glasses: { name: 'Oculos', icon: 'O' },
    hat: { name: 'Chapeu', icon: 'H' },
    wings: { name: 'Asas', icon: 'A' },
    mask: { name: 'Mascara', icon: 'M' }
};

// Efeitos de rastro
const trailEffects = {
    none: { name: 'Nenhum', effect: 'none' },
    sparkles: { name: 'Brilhos', effect: 'sparkles' },
    fire: { name: 'Fogo', effect: 'fire' },
    ice: { name: 'Gelo', effect: 'ice' },
    rainbow: { name: 'Arco-iris', effect: 'rainbow' },
    smoke: { name: 'Fumaca', effect: 'smoke' }
};

// Inicializar
highScoreElement.textContent = highScore;
seasonPointsElement.textContent = seasonPoints;
playerNameDisplayElement.textContent = playerName;
updatePlayerAvatar();
setupEventListeners();
setupTabs();
setupThemeSelector();
setupGameModes();
setupMobileControls();
setupCustomization();
updateSeasonBanner();
setupWaitingRoom();

// Conectar ao servidor
socket.on('connect', () => {
    console.log('Conectado ao servidor!');
    addChatMessage('Sistema', 'Conectado ao servidor!', 'system');
    addGameEvent('Conectado ao servidor');
    showNotification('Conectado ao servidor!');
});

socket.on('playerId', (id) => { 
    myPlayerId = id; 
    socket.emit('changeName', playerName);
    socket.emit('changeSkin', selectedSkin);
    socket.emit('changeAccessory', selectedAccessory);
    socket.emit('changeTrail', selectedTrail);
});

socket.on('gameState', (state) => {
    gameState = state;
    updateUI();
    draw();
    updateWaitingRoom();
});

socket.on('gameUpdate', (state) => {
    gameState = state;
    updateUI();
    draw();
});

socket.on('playerJoined', (player) => {
    addChatMessage('Sistema', player.name + ' entrou no jogo!', 'system');
    addGameEvent(player.name + ' entrou no jogo');
    showNotification(player.name + ' entrou no jogo!');
    updateWaitingRoom();
});

socket.on('playerLeft', (playerId) => {
    addChatMessage('Sistema', 'Um jogador saiu do jogo', 'system');
    addGameEvent('Um jogador saiu do jogo');
    updateWaitingRoom();
});

socket.on('playerDied', (playerId) => {
    if (gameState.players[playerId]) {
        addChatMessage('Sistema', gameState.players[playerId].name + ' morreu!', 'system');
        addGameEvent(gameState.players[playerId].name + ' morreu');
    }
});

socket.on('chatMessage', (data) => {
    addChatMessage(data.player, data.message, 'player', data.color);
});

socket.on('playerNameChanged', (data) => {
    addChatMessage('Sistema', data.oldName + ' agora e ' + data.newName, 'system');
    addGameEvent(data.oldName + ' mudou para ' + data.newName);
});

socket.on('rankingUpdate', (ranking) => {
    globalRanking = ranking;
    updateRanking();
});

socket.on('seasonEvent', (event) => {
    addGameEvent('Evento da temporada: ' + event);
    showNotification(event);
});

socket.on('gameStarted', () => {
    gameStarted = true;
    waitingRoomElement.classList.add('hidden');
    showNotification('Partida iniciada!');
});

function setupWaitingRoom() {
    startGameBtnElement.addEventListener('click', () => {
        socket.emit('startGame');
    });
}

function updateWaitingRoom() {
    const players = Object.values(gameState.players);
    waitingPlayersElement.innerHTML = players.map(player => 
        '<div class="waiting-player" style="border-left-color: ' + player.color + '">' +
            '<div style="font-weight: bold;">' + player.name + '</div>' +
            '<div style="font-size: 0.8em; opacity: 0.8;">Pronto</div>' +
        '</div>'
    ).join('');
    
    // Habilitar botÃ£o se houver pelo menos 1 jogador
    if (players.length >= 1) {
        startGameBtnElement.disabled = false;
        startGameBtnElement.textContent = 'Iniciar Partida (' + players.length + ' jogador' + (players.length > 1 ? 'es' : '') + ')';
    } else {
        startGameBtnElement.disabled = true;
        startGameBtnElement.textContent = 'Iniciar Partida (Min: 1 jogador)';
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', (event) => {
        if (event.target === chatInputElement || event.target === nameInputElement) {
            if (event.key === 'Enter') {
                if (event.target === chatInputElement) sendMessage();
                if (event.target === nameInputElement) changeName();
            }
            return;
        }
        
        // SÃ³ permitir movimento se o jogo tiver comeÃ§ado
        if (!gameStarted) return;
        
        let direction = null;
        switch(event.code) {
            case 'ArrowUp': case 'KeyW': direction = 'up'; break;
            case 'ArrowDown': case 'KeyS': direction = 'down'; break;
            case 'ArrowLeft': case 'KeyA': direction = 'left'; break;
            case 'ArrowRight': case 'KeyD': direction = 'right'; break;
        }
        
        if (direction) {
            event.preventDefault();
            handleDirectionChange(direction);
        }
    });
    
    chatSendElement.addEventListener('click', sendMessage);
    nameChangeBtnElement.addEventListener('click', changeName);
}

function handleDirectionChange(direction) {
    const now = Date.now();
    
    // Enviar direção apenas se for diferente da última
    if (direction !== lastDirection) {
        lastDirection = direction;
        socket.emit('changeDirection', direction);
    }
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

function setupThemeSelector() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.theme-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentTheme = btn.dataset.theme;
            applyTheme();
        });
    });
}

function setupGameModes() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.mode-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            socket.emit('changeMode', currentMode);
            addGameEvent('Modo alterado para: ' + currentMode);
        });
    });
}

function setupMobileControls() {
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameStarted) return;
            const direction = btn.dataset.direction;
            handleDirectionChange(direction);
        });
    });
}

function setupCustomization() {
    // Skins de cobra
    const skinsContainer = document.getElementById('snakeSkins');
    Object.entries(snakeSkins).forEach(([key, skin]) => {
        const item = document.createElement('div');
        item.className = 'customization-item';
        if (key === selectedSkin) item.classList.add('selected');
        item.innerHTML = '<div class="customization-preview" style="background: ' + skin.color + '"></div><div>' + skin.name + '</div>';
        item.addEventListener('click', () => {
            document.querySelectorAll('#snakeSkins .customization-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedSkin = key;
            localStorage.setItem('selectedSkin', selectedSkin);
            socket.emit('changeSkin', selectedSkin);
        });
        skinsContainer.appendChild(item);
    });
    
    // Acessorios
    const accessoriesContainer = document.getElementById('accessories');
    Object.entries(accessories).forEach(([key, accessory]) => {
        const item = document.createElement('div');
        item.className = 'customization-item';
        if (key === selectedAccessory) item.classList.add('selected');
        item.innerHTML = '<div style="font-size: 2em;">' + accessory.icon + '</div><div>' + accessory.name + '</div>';
        item.addEventListener('click', () => {
            document.querySelectorAll('#accessories .customization-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedAccessory = key;
            localStorage.setItem('selectedAccessory', selectedAccessory);
            socket.emit('changeAccessory', selectedAccessory);
        });
        accessoriesContainer.appendChild(item);
    });
    
    // Efeitos de rastro
    const trailsContainer = document.getElementById('trailEffects');
    Object.entries(trailEffects).forEach(([key, trail]) => {
        const item = document.createElement('div');
        item.className = 'customization-item';
        if (key === selectedTrail) item.classList.add('selected');
        item.innerHTML = '<div style="font-size: 2em;">*</div><div>' + trail.name + '</div>';
        item.addEventListener('click', () => {
            document.querySelectorAll('#trailEffects .customization-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedTrail = key;
            localStorage.setItem('selectedTrail', selectedTrail);
            socket.emit('changeTrail', selectedTrail);
        });
        trailsContainer.appendChild(item);
    });
}

function applyTheme() {
    const theme = themes[currentTheme];
    document.body.style.background = theme.background;
    draw();
}

function sendMessage() {
    const message = chatInputElement.value.trim();
    if (message) {
        socket.emit('chatMessage', message);
        chatInputElement.value = '';
    }
}

function changeName() {
    const newName = nameInputElement.value.trim();
    if (newName && newName !== playerName) {
        const oldName = playerName;
        playerName = newName;
        localStorage.setItem('playerName', playerName);
        playerNameDisplayElement.textContent = playerName;
        updatePlayerAvatar();
        socket.emit('changeName', playerName);
        nameInputElement.value = '';
    }
}

function updatePlayerAvatar() {
    const firstLetter = playerName.charAt(0).toUpperCase();
    playerAvatarElement.textContent = firstLetter;
    playerAvatarElement.style.background = getRandomGradient();
}

function getRandomGradient() {
    const gradients = [
        'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
        'linear-gradient(45deg, #45B7D1, #96CEB4)',
        'linear-gradient(45deg, #FFEAA7, #DDA0DD)',
        'linear-gradient(45deg, #98D8C8, #F7DC6F)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function addChatMessage(player, message, type, color = '#fff') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ' + type;
    
    if (type === 'player') {
        messageDiv.innerHTML = '<span style="color: ' + color + '; font-weight: bold;">' + player + ':</span> ' + message;
    } else {
        messageDiv.innerHTML = '<strong>' + player + ':</strong> ' + message;
    }
    
    chatMessagesElement.appendChild(messageDiv);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

function addGameEvent(eventText) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    gameEvents.unshift({ time: timeStr, text: eventText });
    if (gameEvents.length > 20) gameEvents.pop();
    
    gameEventsElement.innerHTML = gameEvents.map(event => 
        '<div class="event-item"><span class="event-time">' + event.time + '</span> ' + event.text + '</div>'
    ).join('');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateRanking() {
    rankingListElement.innerHTML = globalRanking.map((player, index) => 
        '<div class="ranking-item">' +
            '<div class="ranking-position">' + (index + 1) + 'o</div>' +
            '<div class="ranking-name">' + player.name + '</div>' +
            '<div class="ranking-score">' + player.score + '</div>' +
        '</div>'
    ).join('');
}

function updateSeasonBanner() {
    seasonBannerElement.innerHTML = 'Temporada 2024 - Modo Halloween Ativo!';
}

function draw() {
    const theme = themes[currentTheme];
    
    // Limpar canvas
    ctx.fillStyle = theme.canvas;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar grade
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Desenhar obstaculos
    gameState.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#666';
        ctx.fillRect(obstacle.x, obstacle.y, GRID_SIZE, GRID_SIZE);
    });
    
    // Desenhar comida (apenas 1-2 por vez)
    gameState.food.forEach(food => {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(
            food.x + GRID_SIZE/2,
            food.y + GRID_SIZE/2,
            GRID_SIZE/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    
    // Desenhar power-ups
    gameState.powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, GRID_SIZE - 2, GRID_SIZE - 2);
        
        // Efeito de brilho
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(powerUp.x, powerUp.y, GRID_SIZE - 2, GRID_SIZE - 2);
        ctx.shadowBlur = 0;
    });
    
    // Desenhar jogadores
    Object.values(gameState.players).forEach(player => {
        if (player.alive && player.snake.length > 0) {
            // Efeito de invencibilidade
            if (player.invincible) {
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 15;
            }
            
            // Efeito de invisibilidade
            if (player.invisible) {
                ctx.globalAlpha = 0.5;
            }
            
            player.snake.forEach((segment, index) => {
                if (index === 0) {
                    // Cabeca da cobra
                    ctx.fillStyle = player.color;
                    ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                    
                    // Olhos
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(segment.x + 4, segment.y + 4, 3, 3);
                    ctx.fillRect(segment.x + 13, segment.y + 4, 3, 3);
                    
                    // Acessorio
                    if (player.accessory && player.accessory !== 'none') {
                        ctx.fillStyle = '#FFD700';
                        ctx.font = '16px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(accessories[player.accessory].icon, segment.x + GRID_SIZE/2, segment.y - 5);
                    }
                } else {
                    // Corpo da cobra
                    ctx.fillStyle = player.color;
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(segment.x + 2, segment.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
                    ctx.globalAlpha = 1;
                }
            });
            
            // Resetar efeitos
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            
            // Nome do jogador
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            if (player.snake[0]) {
                let statusText = player.name;
                if (player.invincible) statusText += ' (INVENCIVEL)';
                if (player.invisible) statusText += ' (INVISIVEL)';
                if (player.team) statusText += ' [' + player.team + ']';
                statusText += ' (' + player.score + ')';
                
                ctx.fillText(
                    statusText,
                    player.snake[0].x + GRID_SIZE/2,
                    player.snake[0].y - 5
                );
            }
        }
    });
}

function updateUI() {
    const playerCount = Object.keys(gameState.players).length;
    playerCountElement.textContent = playerCount;
    
    if (myPlayerId && gameState.players[myPlayerId]) {
        myScore = gameState.players[myPlayerId].score;
        scoreElement.textContent = myScore;
        
        // Atualizar nivel
        const level = Math.floor(myScore / 50) + 1;
        levelElement.textContent = level;
        playerLevelElement.textContent = level;
        
        // Atualizar pontos da temporada
        if (myScore > 0) {
            seasonPoints += Math.floor(myScore * 0.1);
            seasonPointsElement.textContent = seasonPoints;
            localStorage.setItem('seasonPoints', seasonPoints);
        }
        
        // Atualizar stats do jogador
        playerStatsElement.textContent = 'Nivel ' + level + ' | ' + myScore + ' pontos';
        
        if (myScore > highScore) {
            highScore = myScore;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Atualizar power-ups ativos
        const player = gameState.players[myPlayerId];
        const activePowerUps = [];
        
        if (player.speedBoost) activePowerUps.push('Velocidade');
        if (player.invincible) activePowerUps.push('Invencivel');
        if (player.doublePoints) activePowerUps.push('Pontos Duplos');
        if (player.shrink) activePowerUps.push('Encolher');
        if (player.invisible) activePowerUps.push('Invisivel');
        if (player.teleport) activePowerUps.push('Teletransporte');
        
        powerUpsElement.innerHTML = activePowerUps.map(powerUp => 
            '<div class="power-up active">' + powerUp + '</div>'
        ).join('');
    }
    
    // Atualizar lista de jogadores
    const playersArray = Object.values(gameState.players)
        .sort((a, b) => b.score - a.score);
    
    playersListElement.innerHTML = playersArray.map(player => 
        '<div class="player-item" style="border-left-color: ' + player.color + '">' +
            '<div class="player-name">' + player.name + (player.team ? ' [' + player.team + ']' : '') + '</div>' +
            '<div class="player-score">' + player.score + '</div>' +
            '<div class="player-status">' + (player.alive ? 'VIVO' : 'MORTO') + '</div>' +
        '</div>'
    ).join('');
}

// Inicializar o jogo
draw();
