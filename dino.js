const screen = document.getElementById("dinoGame");
const screenContext = screen.getContext("2d");
const xhr = new XMLHttpRequest();

function setup() {
    speed = 8;
    score = 0;
    scoreCounter = 0;
    cactusDelay = 0;
    cactusCounter = 0;
    cactusObjCounter = 0;
    cactusArray = [];

    ground = new Ground();
    ground.sprite.src = "assets/ground.png";
    dino = new Dinosaur();
    dino.images[0].src = "assets/dino right.png";
    dino.images[1].src = "assets/dino left.png";

    document.getElementById("gameOverText").style.display = "none";
    document.getElementById("restartButton").style.display = "none";

    state.current = state.play;
}

function gameOver() {
    state.current = state.gameOver;
    dino.sprite.src = "assets/dino dead.png";
    document.getElementById("restartButton").style.display = "block";
    document.getElementById("gameOverText").style.display = "block";
    document.getElementById("gameOverText").innerText = "Game Over";

    sendToLB();
}

function sendToLB() {
    let username = prompt("Enter a Username to store your score");
    if (username === null || username === "" || username === " " || username === undefined) {
        return;
    }

    while (username.indexOf(' ') >= 0 || username.length < 3 || username.length > 10) {
        if (username === null || username === "" || username === " " || username === undefined) {
            return;
        }
        username = prompt("Username must not contain spaces and must be 3-10 characters long");
    }

    let fullData = {
        Username: username,
        Score: score
    };
    xhr.open('POST', 'http://localhost:8080/api/sendscore', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(fullData));
}

const state = {
    ready: "ready",
    play: "play",
    gameOver: "gameOver",
    current: "ready"
};

class Dinosaur {
    counter = 0;
    stepCooldown = 10;
    index = 0;
    vel = 6;
    images = [
        this.sprite = new Image(),
        this.sprite = new Image()
    ];

    x = 10;
    y = 160;
    jumping = false;

    animation() {
        this.counter++;

        if (this.counter > this.stepCooldown) {
            this.counter = 0;
            this.index++;
            if (this.index >= this.images.length) {
                this.index = 0;
            }
        }
        this.sprite = this.images[this.index];
    }

    draw() {
        screenContext.drawImage(this.sprite, this.x, this.y);
    }

    update() {
        this.animation();
        this.vel += 0.5;
        if (this.vel > 10) {
            this.vel = 8;
        }
        this.y += ~~this.vel;
        if (this.y >= 160) {
            this.y = 160;
            this.jumping = false;
        }
    }
    jump() {
        dino.jumping = true;
        dino.vel -= 21.5;
    }
}

class Ground {
    sprite = new Image();

    x = 0;
    y = 240;

    draw() {
        screenContext.drawImage(this.sprite, this.x, this.y);
    }

    update() {
        if (state.current === state.play) {
            this.x -= speed;
        }
        if (this.x <= -1500) {
            this.x = 0;
        }
    }
}

class Cactus {
    sprite = new Image();
    x = 960;
    y = 15;
    top = screen.height - this.sprite.height - this.y

    whatCactus() {
        let cactusType = random(1, 2)
        let cactusNumber = random(1, 4)
        cactusType = cactusType === 1 ? "small" : "large";
        if (cactusNumber === 4) {
            this.sprite.src = "assets/4 large cactus.png"
        }
        else {
            this.sprite.src = `assets/${cactusNumber} ${cactusType} cactus.png`;
        }
    }
    draw() {
        screenContext.drawImage(this.sprite, this.x, (screen.height - this.sprite.height - this.y));
    }

    update() {
        this.x -= speed;
        if ((this.x + this.sprite.width) < 0) {
            cactusArray.shift();
        }
    }
}

window.addEventListener("keydown", function(event) {
    if (state.current === state.ready) {
        if (event.code === "Space" || event.code === "ArrowUp") {
            readyScreenDone();
        }
    }
    if ((event.code === "Space" || event.code === "ArrowUp") && !dino.jumping) {
        dino.jump();
    }
    else if (event.code === "ArrowDown" && dino.jumping) {
        if (dino.vel <= 5) {
            dino.vel = 6;
        }
        else if (dino.vel <= 8) {
            dino.vel += 2
        }
    }
});

function readyScreenDone() {
    state.current = state.play;
    document.getElementById("readyImage").style.display = "none";
}

function scoreAdder() {
    scoreCounter++
    if (scoreCounter >= 5) {
        scoreCounter = 0;
        score++;
        if (score % 100 === 0) {speed++;}
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function cactusDelayer() {
    cactusCounter++;
    if (cactusCounter > cactusDelay) {
        cactusCounter = 0;
        cactusDelay = random(60 - (speed * 1.25), 75 - (speed * 1.25));
        createCactusObject();
    }
}

function createCactusObject() {
    let objectName = 'cactus_' + cactusObjCounter;
    window[objectName] = new Cactus();
    cactusObjCounter++;
    cactusArray.push(objectName);
    window[objectName].whatCactus();
}

function collides() {
    if (((dino.y + dino.sprite.height) >= window[cactusArray[0]].top) &&
        ((dino.x + dino.sprite.width) >= window[cactusArray[0]].x)) {
        return true;
    }
}

let speed = 8;
let score = 0;
let scoreCounter = 0;
let cactusDelay = 0;
let cactusCounter = 0;
let cactusObjCounter = 0;
let cactusArray = [];

let ground = new Ground();
ground.sprite.src = "assets/ground.png";

let dino = new Dinosaur();
dino.images[0].src = "assets/dino right.png";
dino.images[1].src = "assets/dino left.png";

const scoreText = document.getElementById("score");

fetch('http://localhost:8080/api/gettopten')
    .then((response) => response.json())
    .then((data) => createLeaderboard(data))

async function createLeaderboard(jsonString) {
    const data = JSON.parse(jsonString);

    const table = document.createElement('table');
    table.id = "Leaderboard";

    const headerRow = document.createElement('tr');
    headerRow.id = "HeaderRow";

    const rankHeader = document.createElement('th');
    rankHeader.textContent = 'Rank';
    const usernameHeader = document.createElement('th');
    usernameHeader.textContent = 'Username';
    const scoreHeader = document.createElement('th');
    scoreHeader.textContent = 'Score';
    headerRow.appendChild(rankHeader);
    headerRow.appendChild(usernameHeader);
    headerRow.appendChild(scoreHeader);
    table.appendChild(headerRow);

    for (let i = 0; i < data.length; i++) {
        const row = document.createElement('tr');

        const rankCell = document.createElement('td');
        rankCell.textContent = (i + 1).toString();
        row.appendChild(rankCell);

        const usernameCell = document.createElement('td');
        usernameCell.textContent = data[i].Username;
        row.appendChild(usernameCell);

        const scoreCell = document.createElement('td');
        scoreCell.textContent = data[i].Score;
        row.appendChild(scoreCell);

        table.appendChild(row);
    }

    document.body.appendChild(table);
}


function Main() {
    screenContext.fillStyle = "#ffffff";
    screenContext.fillRect(0, 0, screen.width, screen.height);
    ground.draw();
    dino.draw();
    cactusArray.forEach(cactus => window[cactus].draw());
    if (state.current === state.play) {
        ground.update();
        dino.update();
        scoreAdder();
        cactusDelayer();
        cactusArray.forEach(cactus => window[cactus].update());
        if (collides()) {
            gameOver();
        }
    }
    scoreText.innerText = `${score}`;

    requestAnimationFrame(Main);
}