const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");
const levelInfo = document.getElementById("level-info");
const gameMessage = document.getElementById("game-message");
const restartBtn = document.getElementById("restart-btn");

const paddleWidth = 12;
const paddleHeight = 100;
const ballRadius = 10;

const MAX_LEVEL = 5;
const BASE_BALL_SPEED = 5;

// Left Paddle (Player)
const player = {
    x: 0,
    y: canvas.height/2 - paddleHeight/2,
    width: paddleWidth,
    height: paddleHeight,
    color: "#00FFB2"
};

// Right Paddle (AI)
const ai = {
    x: canvas.width - paddleWidth,
    y: canvas.height/2 - paddleHeight/2,
    width: paddleWidth,
    height: paddleHeight,
    color: "#FF006E",
    speed: 4
};

// Ball (will be reset per level)
let ball = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: ballRadius,
    speed: BASE_BALL_SPEED,
    velocityX: BASE_BALL_SPEED,
    velocityY: BASE_BALL_SPEED,
    color: "#FFF"
};

let level = 1;
let isGameOver = false;
let isGameWin = false;
let animationId = null;

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);
    ctx.closePath();
    ctx.fill();
}

function drawNet() {
    ctx.fillStyle = "#fff";
    for(let i = 0; i < canvas.height; i += 20) {
        ctx.fillRect(canvas.width/2 - 1, i, 2, 10);
    }
}

function render() {
    drawRect(0, 0, canvas.width, canvas.height, "#222");
    drawNet();
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function resetBall(newSpeed = BASE_BALL_SPEED) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = newSpeed;
    // Ball will always go toward the player after reset, randomize angle
    let angle = (Math.random() * Math.PI / 2) - (Math.PI / 4); // -45deg to +45deg
    let dir = (Math.random() > 0.5) ? 1 : -1;
    ball.velocityX = dir * newSpeed * Math.cos(angle);
    ball.velocityY = newSpeed * Math.sin(angle);
}

function collision(b, p) {
    return (
        b.x - b.radius < p.x + p.width &&
        b.x + b.radius > p.x &&
        b.y - b.radius < p.y + p.height &&
        b.y + b.radius > p.y
    );
}

function update() {
    if (isGameOver || isGameWin) return;

    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Wall collision
    if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }

    // Paddle collision (player)
    if(collision(ball, player)) {
        ball.x = player.x + player.width + ball.radius;
        ball.velocityX = -ball.velocityX;
        let collidePoint = (ball.y - (player.y + player.height/2)) / (player.height/2);
        let angleRad = collidePoint * (Math.PI/4);
        let direction = 1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
    }

    // Paddle collision (AI)
    if(collision(ball, ai)) {
        ball.x = ai.x - ball.radius;
        ball.velocityX = -ball.velocityX;
        let collidePoint = (ball.y - (ai.y + ai.height/2)) / (ai.height/2);
        let angleRad = collidePoint * (Math.PI/4);
        let direction = -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
    }

    // Ball out of bounds (player misses: left)
    if(ball.x - ball.radius < 0) {
        endGame(false); // Game over
    }

    // Ball out of bounds (AI misses: right)
    if(ball.x + ball.radius > canvas.width) {
        if (level < MAX_LEVEL) {
            level++;
            nextLevel();
        } else {
            endGame(true); // Player wins!
        }
    }

    // AI movement
    let targetY = ball.y - ai.height/2;
    ai.y += (targetY - ai.y) * 0.08;
    ai.y = Math.max(Math.min(ai.y, canvas.height - ai.height), 0);

    // Clamp player paddle
    player.y = Math.max(Math.min(player.y, canvas.height - player.height), 0);
}

function nextLevel() {
    levelInfo.textContent = `Level: ${level}`;
    displayMessage(`Level ${level}!`);
    resetBall(BASE_BALL_SPEED + (level - 1) * 2); // Increase ball speed each level
    setTimeout(() => {
        clearMessage();
        isGameOver = false;
        isGameWin = false;
        gameLoop();
    }, 1000);
    isGameOver = true;
}

function endGame(win) {
    cancelAnimationFrame(animationId);
    isGameOver = !win;
    isGameWin = win;
    if (win) {
        displayMessage("You Win! 🎉");
    } else {
        displayMessage("Game Over!");
    }
    restartBtn.style.display = "inline-block";
}

function displayMessage(msg) {
    gameMessage.textContent = msg;
}
function clearMessage() {
    gameMessage.textContent = "";
}

canvas.addEventListener("mousemove", evt => {
    if (isGameOver || isGameWin) return;
    let rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY - rect.top;
    player.y = mouseY - player.height / 2;
});

restartBtn.addEventListener("click", () => {
    restartBtn.style.display = "none";
    level = 1;
    levelInfo.textContent = `Level: 1`;
    clearMessage();
    resetBall(BASE_BALL_SPEED);
    isGameOver = false;
    isGameWin = false;
    gameLoop();
});

// Main game loop
function gameLoop() {
    if (!isGameOver && !isGameWin) {
        update();
        render();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    level = 1;
    levelInfo.textContent = `Level: 1`;
    resetBall(BASE_BALL_SPEED);
    isGameOver = false;
    isGameWin = false;
    restartBtn.style.display = "none";
    clearMessage();
    gameLoop();
}

// Start
startGame();