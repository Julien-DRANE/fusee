// Sélectionne le canvas et initialise le contexte
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Détecter si l'appareil est mobile
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Définir un facteur d'échelle pour les appareils mobiles
const scaleFactor = isMobile ? 2 : 1;

// Dimensions du canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables globales initiales
const initialRocket = {
    x: (canvas.width / 2 - 25 * scaleFactor),
    y: canvas.height - 150 * scaleFactor,
    width: 50 * scaleFactor,
    height: 100 * scaleFactor,
    dx: 0,
    dy: 0,
    acceleration: 1.5 * scaleFactor,  // Accélération initiale (utilisée pour le clavier)
    maxSpeed: 15 * scaleFactor,        // Limite de la vitesse maximale
    friction: 0.93       // Réduction de la friction pour maintenir de l'inertie
};

let rocket = { ...initialRocket };
let obstacles = [];
let stars = [];
let planet = null;       // Variable pour la planète
let moon = null;         // Variable pour la lune
const numberOfStars = 100;
const backgroundMusic = document.getElementById("backgroundMusic");
let difficultyLevel = 1; // Niveau de difficulté initial
let obstacleSpeedMultiplier = 1; // Multiplicateur de vitesse des obstacles

// Compteur de temps
let elapsedTime = 0; // En dixièmes de seconde
let timerInterval;

// Variables pour afficher le score
let showScore = false;
let score = 0;

// Variables pour le suivi tactile
let touchActive = false;
let touchX = 0;
let touchY = 0;
const followSpeed = 10 * scaleFactor; // Vitesse de suivi en pixels par frame

// Charger l'image de la fusée
const rocketImage = new Image();
rocketImage.src = "rocket.png";

// Charger les images des obstacles
const obstacleImages = ["unicorn.png", "koala.png", "crocodile.png"].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Charger l'image de la planète
const planetImage = new Image();
planetImage.src = "planet.png";

// Charger l'image de la lune
const moonImage = new Image();
moonImage.src = "lune.png";

// Charger l'image des cœurs pour les vies
const heartImage = new Image();
heartImage.src = "coeur.png";

// Charger le son de collision
const collisionSound = new Audio('collision.mp3'); // Assure-toi que collision.mp3 est dans le même répertoire

// Charger le son de vie supplémentaire
const extraLifeSound = new Audio('extra.mp3'); // Assure-toi que extra.mp3 est dans le même répertoire

// Gérer le chargement des images
let imagesLoaded = 0;
const totalImages = obstacleImages.length + 4; // Inclure l'image de la fusée, la planète, la lune et les cœurs

// Variables de vies
let lives = 3; // Nombre initial de vies

// Variables pour le cœur bonus
let bonusHeart = null;
let bonusHeartInterval;

// Variables pour les meilleurs scores
let highScores = [];

// Vérifier le chargement des images et démarrer le jeu
function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        document.getElementById("startButton").style.display = "block";
    }
}

// Ajouter des gestionnaires d'événements de chargement et d'erreur pour chaque image
rocketImage.onload = imageLoaded;
planetImage.onload = imageLoaded;
moonImage.onload = imageLoaded;
heartImage.onload = imageLoaded;
rocketImage.onerror = planetImage.onerror = moonImage.onerror = heartImage.onerror = function () {
    console.error("Erreur de chargement de l'image.");
    alert("Erreur de chargement de l'image.");
};

obstacleImages.forEach(img => {
    img.onload = imageLoaded;
    img.onerror = function () {
        console.error(`Erreur de chargement de l'image : ${img.src}`);
        alert(`Erreur de chargement de l'image : ${img.src}`);
    };
});

// Générer des étoiles aléatoires
function generateStars() {
    stars = []; // Réinitialiser les étoiles
    for (let i = 0; i < numberOfStars; i++) {
        const size = (Math.random() * 3 + 1) * scaleFactor; // Taille de l'étoile
        const speed = size / 2;             // Vitesse proportionnelle à la taille
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        stars.push({ x, y, size, speed });
    }
}

// Générer la planète (décor)
function generatePlanet() {
    const width = 400 * scaleFactor;
    const height = 400 * scaleFactor;
    const x = Math.random() * (canvas.width - width);
    planet = {
        x: x,
        y: -800 * scaleFactor,          // Position de départ hors de l'écran
        width: width,
        height: height,
        speed: 0.5 * scaleFactor
    };
}

// Générer la lune (décor)
function generateMoon() {
    const width = 800 * scaleFactor;
    const height = 800 * scaleFactor;
    const x = Math.random() * (canvas.width - width);
    moon = {
        x: x,
        y: -1600 * scaleFactor,         // Position de départ hors de l'écran
        width: width,
        height: height,
        speed: 0.2 * scaleFactor
    };
}

// Mettre à jour les positions des étoiles
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Mettre à jour la position de la planète
function updatePlanet() {
    if (planet) {
        planet.y += planet.speed;
        if (planet.y > canvas.height) {
            planet = null;
        }
    } else {
        if (Math.random() < 0.002) {
            generatePlanet();
        }
    }
}

// Mettre à jour la position de la lune
function updateMoon() {
    if (moon) {
        moon.y += moon.speed;
        if (moon.y > canvas.height) {
            moon = null;
        }
    } else {
        if (Math.random() < 0.001) {
            generateMoon();
        }
    }
}

// Dessiner les étoiles avec des vitesses et tailles différentes
function drawStars() {
    stars.forEach(star => {
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
}

// Dessiner la planète
function drawPlanet() {
    if (planet) {
        ctx.drawImage(planetImage, planet.x, planet.y, planet.width, planet.height);
    }
}

// Dessiner la lune
function drawMoon() {
    if (moon) {
        ctx.drawImage(moonImage, moon.x, moon.y, moon.width, moon.height);
    }
}

// Fonction pour générer des obstacles
let obstacleSpawnInterval = 1000; // Intervalle initial de génération d'obstacles en millisecondes
let obstacleGenerationTimeout;

function startObstacleGeneration() {
    // Effacer le timeout précédent s'il existe
    clearTimeout(obstacleGenerationTimeout);

    // Générer un obstacle
    generateObstacle();

    // Planifier la prochaine génération
    obstacleGenerationTimeout = setTimeout(startObstacleGeneration, obstacleSpawnInterval);
}

function generateObstacle() {
    const size = (Math.random() * 50 + 30) * scaleFactor;
    const x = Math.random() * (canvas.width - size);
    const speed = (Math.random() * 3 + 2) * obstacleSpeedMultiplier * scaleFactor;
    const imageIndex = Math.floor(Math.random() * obstacleImages.length);
    obstacles.push({ x, y: -size, size, speed, image: obstacleImages[imageIndex] });
}

// Déplacer la fusée avec inertie ou suivant le doigt
function moveRocket() {
    if (!touchActive) {
        rocket.dx *= rocket.friction;
        rocket.dy *= rocket.friction;

        if (rocket.dx > rocket.maxSpeed) rocket.dx = rocket.maxSpeed;
        if (rocket.dx < -rocket.maxSpeed) rocket.dx = -rocket.maxSpeed;
        if (rocket.dy > rocket.maxSpeed) rocket.dy = rocket.maxSpeed;
        if (rocket.dy < -rocket.maxSpeed) rocket.dy = -rocket.maxSpeed;

        rocket.x += rocket.dx;
        rocket.y += rocket.dy;
    }

    if (rocket.x < 0) rocket.x = 0;
    if (rocket.x + rocket.width > canvas.width) rocket.x = canvas.width - rocket.width;
    if (rocket.y < 0) rocket.y = 0;
    if (rocket.y + rocket.height > canvas.height) rocket.y = canvas.height - rocket.height;
}

// Gérer les collisions avec tolérance
function detectCollision(obj1, obj2) {
    if (!obj2) return false;

    const obj1CenterX = obj1.x + obj1.width / 2;
    const obj1CenterY = obj1.y + obj1.height / 2;
    const obj2CenterX = obj2.x + obj2.size / 2;
    const obj2CenterY = obj2.y + obj2.size / 2;

    const deltaX = obj1CenterX - obj2CenterX;
    const deltaY = obj1CenterY - obj2CenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const collisionThreshold = (obj1.width / 2) + (obj2.size / 2) + 30 * scaleFactor;

    return distance < collisionThreshold;
}

// Dessiner la fusée
function drawRocket() {
    ctx.drawImage(rocketImage, rocket.x, rocket.y, rocket.width, rocket.height);
}

// Dessiner les obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.size, obstacle.size);
    });
}

// Dessiner le compteur de temps
function drawTimer() {
    ctx.font = `${24 * scaleFactor}px Arial`;
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Time: ${(elapsedTime / 10).toFixed(1)}s`, 20 * scaleFactor, 20 * scaleFactor);
}

// Dessiner les cœurs (vies) en haut à droite
function drawLives() {
    const heartSize = 30 * scaleFactor; // Taille d'un cœur
    const padding = 10 * scaleFactor;    // Espacement entre les cœurs
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(heartImage, canvas.width - (heartSize + padding) * (i + 1), 20 * scaleFactor, heartSize, heartSize);
    }
}

// Générer le cœur bonus
function generateBonusHeart() {
    const size = 30 * scaleFactor; // Taille du cœur bonus
    const x = Math.random() * (canvas.width - size);
    bonusHeart = {
        x: x,
        y: -size,
        size: size,
        speed: 2 * scaleFactor // Vitesse de descente du cœur bonus
    };
}

// Mettre à jour le cœur bonus
function updateBonusHeart() {
    if (bonusHeart) {
        bonusHeart.y += bonusHeart.speed;
        if (bonusHeart.y > canvas.height) {
            bonusHeart = null; // Supprimer le cœur bonus lorsqu'il sort de l'écran
        }
        // Détection de collision avec la fusée
        if (detectCollision(rocket, bonusHeart)) {
            lives = Math.min(lives + 1, 3); // Augmenter les vies jusqu'à un maximum de 3
            extraLifeSound.currentTime = 0; // Remettre le son à zéro
            extraLifeSound.play(); // Jouer le son de vie supplémentaire
            bonusHeart = null; // Retirer le cœur bonus après collecte
        }
    }
}

// Dessiner le cœur bonus
function drawBonusHeart() {
    if (bonusHeart) {
        ctx.drawImage(heartImage, bonusHeart.x, bonusHeart.y, bonusHeart.size, bonusHeart.size);
    }
}

// Gestion des touches pressées
const keysPressed = {};

// Contrôles de la fusée via clavier
document.addEventListener("keydown", e => {
    keysPressed[e.key] = true;
});

document.addEventListener("keyup", e => {
    keysPressed[e.key] = false;
});

// Appliquer les contrôles clavier à la fusée
function applyControls() {
    if (keysPressed["ArrowLeft"]) {
        rocket.dx -= rocket.acceleration;
    }
    if (keysPressed["ArrowRight"]) {
        rocket.dx += rocket.acceleration;
    }
    if (keysPressed["ArrowUp"]) {
        rocket.dy -= rocket.acceleration;
    }
    if (keysPressed["ArrowDown"]) {
        rocket.dy += rocket.acceleration;
    }
}

// Gestion des événements tactiles
canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchmove", handleTouchMove, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchActive = true;
    touchX = touch.clientX;
    touchY = touch.clientY;
    e.preventDefault(); // Empêcher le défilement de la page
}

function handleTouchMove(e) {
    const touch = e.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
    e.preventDefault(); // Empêcher le défilement de la page
}

function handleTouchEnd(e) {
    touchActive = false;
}

// Fonction pour mettre à jour la position de la fusée vers le doigt
function updateRocketPosition() {
    const centerX = rocket.x + rocket.width / 2;
    const centerY = rocket.y + rocket.height / 2;

    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;

    // Calculer la distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Définir un seuil de distance pour éviter les mouvements mineurs
    const deadZone = 10 * scaleFactor; // pixels

    if (distance > deadZone) {
        // Calculer la direction
        const angle = Math.atan2(deltaY, deltaX);

        // Calculer le mouvement
        const moveX = Math.cos(angle) * followSpeed;
        const moveY = Math.sin(angle) * followSpeed;

        // Appliquer le mouvement, en s'assurant de ne pas dépasser la position du doigt
        if (Math.abs(moveX) > Math.abs(deltaX)) {
            rocket.x = touchX - rocket.width / 2;
        } else {
            rocket.x += moveX;
        }

        if (Math.abs(moveY) > Math.abs(deltaY)) {
            rocket.y = touchY - rocket.height / 2;
        } else {
            rocket.y += moveY;
        }
    }
}

// Fonction principale de la boucle de jeu
let animationFrameId;
let difficultyInterval;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas

    applyControls();      // Appliquer les contrôles clavier
    moveRocket();         // Déplacer la fusée

    if (touchActive) {
        updateRocketPosition(); // Mettre à jour la position de la fusée vers le doigt
    }

    updateStars();        // Mettre à jour les étoiles
    updatePlanet();       // Mettre à jour la planète
    updateMoon();         // Mettre à jour la lune
    updateObstacles();    // Mettre à jour les obstacles
    updateBonusHeart();   // Mettre à jour le cœur bonus

    drawStars();          // Dessiner les étoiles
    drawPlanet();         // Dessiner la planète
    drawMoon();           // Dessiner la lune
    drawObstacles();      // Dessiner les obstacles
    drawBonusHeart();     // Dessiner le cœur bonus
    drawRocket();         // Dessiner la fusée
    drawTimer();          // Dessiner le compteur de temps
    drawLives();          // Dessiner les vies

    animationFrameId = requestAnimationFrame(gameLoop); // Demander la prochaine frame
}

// Augmenter la difficulté progressivement
function increaseDifficulty() {
    difficultyLevel += 1;            // Augmenter le niveau de difficulté
    obstacleSpeedMultiplier += 0.2;  // Augmenter la vitesse des obstacles

    // Diminuer l'intervalle de génération des obstacles pour en générer plus fréquemment
    obstacleSpawnInterval = Math.max(300, obstacleSpawnInterval - 100); // Ne pas descendre en dessous de 300ms

    // Redémarrer la génération des obstacles avec le nouvel intervalle
    startObstacleGeneration();
}

// Fonction pour charger les meilleurs scores depuis le localStorage
function loadHighScores() {
    const storedScores = localStorage.getItem('highScores');
    if (storedScores) {
        highScores = JSON.parse(storedScores);
    }
}

// Fonction pour sauvegarder les meilleurs scores dans le localStorage
function saveHighScores() {
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Fonction pour afficher l'écran de fin de jeu
function displayGameOver() {
    // Arrêter la boucle de jeu et nettoyer les intervalles
    cancelAnimationFrame(animationFrameId);
    clearInterval(difficultyInterval);
    clearInterval(timerInterval);
    clearInterval(bonusHeartInterval);
    clearTimeout(obstacleGenerationTimeout);

    // Cacher le canvas et le bouton de démarrage
    canvas.style.display = "none";
    document.getElementById("startButton").style.display = "none";

    // Afficher l'écran de fin de jeu
    const gameOverScreen = document.getElementById("gameOverScreen");
    const scoreDisplay = document.getElementById("scoreDisplay");
    gameOverScreen.style.display = "block";
    scoreDisplay.innerText = `Votre score : ${score.toFixed(1)}s`;

    // Mettre en pause la musique de fond
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

    // Cacher le bouton "Rejouer" au début
    document.getElementById("restartButton").style.display = "none";

    // Ajouter un écouteur d'événement pour soumettre le score
    document.getElementById("submitScoreButton").onclick = submitScore;

    // Ajouter un écouteur d'événement pour redémarrer le jeu
    document.getElementById("restartButton").onclick = function() {
        gameOverScreen.style.display = "none";
        startGame();
    };
}

// Fonction pour soumettre le score du joueur
function submitScore() {
    const playerNameInput = document.getElementById("playerNameInput");
    const playerName = playerNameInput.value.trim();
    if (playerName !== '') {
        highScores.push({ name: playerName, score: score });
        // Trier les meilleurs scores par ordre décroissant
        highScores.sort((a, b) => b.score - a.score);
        // Conserver uniquement les 10 meilleurs scores
        highScores = highScores.slice(0, 10);
        saveHighScores();
        displayHighScores();
        // Réinitialiser le champ d'entrée
        playerNameInput.value = '';

        // Afficher le bouton "Rejouer"
        document.getElementById("restartButton").style.display = "block";
    } else {
        alert('Veuillez entrer votre nom.');
    }
}

// Fonction pour afficher les meilleurs scores
function displayHighScores() {
    const highScoreTable = document.getElementById("highScoreTable");
    const highScoresList = document.getElementById("highScoresList");
    highScoresList.innerHTML = '';
    highScores.forEach((entry) => {
        const li = document.createElement('li');
        li.innerText = `${entry.name} - ${entry.score.toFixed(1)}s`;
        highScoresList.appendChild(li);
    });
    highScoreTable.style.display = "block";
}

// Mettre à jour les obstacles et gérer les collisions
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obstacle = obstacles[i];
        obstacle.y += obstacle.speed;
        if (obstacle.y > canvas.height) {
            obstacles.splice(i, 1);
            continue;
        }
        if (detectCollision(rocket, obstacle)) {
            // Gérer la perte d'une vie
            obstacles.splice(i, 1);
            lives -= 1;

            // Jouer le son de collision
            collisionSound.currentTime = 0;
            collisionSound.play();

            if (lives <= 0) {
                // Fin du jeu
                score = elapsedTime / 10;
                displayGameOver();
                break;
            }
        }
    }
}

// Fonction pour démarrer ou réinitialiser le jeu
function startGame() {
    // Charger les meilleurs scores
    loadHighScores();

    // Réinitialiser les variables du jeu
    rocket = { ...initialRocket };
    obstacles = [];
    stars = [];
    planet = null;
    moon = null;
    difficultyLevel = 1;
    obstacleSpeedMultiplier = 1;
    obstacleSpawnInterval = 1000;
    elapsedTime = 0;
    showScore = false;
    score = 0;
    lives = 3;
    bonusHeart = null;

    // Générer les étoiles
    generateStars();

    // Cacher l'écran de fin de jeu et le tableau des meilleurs scores
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("highScoreTable").style.display = "none";

    // Afficher le canvas et cacher le bouton de démarrage
    canvas.style.display = "block";
    document.getElementById("startButton").style.display = "none";

    // Démarrer la musique de fond
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();

    // Démarrer la boucle de jeu
    gameLoop();

    // Augmenter la difficulté toutes les 20 secondes
    difficultyInterval = setInterval(increaseDifficulty, 20000);

    // Démarrer la génération des obstacles
    startObstacleGeneration();

    // Démarrer le timer
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsedTime += 1;
    }, 100); // Incrémente toutes les 100ms

    // Générer un cœur bonus toutes les 40 secondes
    clearInterval(bonusHeartInterval);
    bonusHeartInterval = setInterval(generateBonusHeart, 40000);
}

// Appeler loadHighScores lorsque le script se charge
loadHighScores();

// Écouteur d'événement pour le bouton de démarrage
document.getElementById("startButton").addEventListener("click", startGame);
