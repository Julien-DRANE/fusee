// Sélectionne le canvas et initialise le contexte
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Dimensions du canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables globales initiales
const initialRocket = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 150,
    width: 50,
    height: 100,
    dx: 0,
    dy: 0,
    acceleration: 1.5,  // Accélération initiale (utilisée pour le clavier)
    maxSpeed: 15,        // Limite de la vitesse maximale
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
const followSpeed = 10; // Vitesse de suivi en pixels par frame

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

// Gérer le chargement des images
let imagesLoaded = 0;
const totalImages = obstacleImages.length + 4; // Inclure l'image de la fusée, la planète, la lune et les cœurs

// Variables de vies
let lives = 3; // Nombre initial de vies

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
        const size = Math.random() * 3 + 1; // Taille de l'étoile
        const speed = size / 2;             // Vitesse proportionnelle à la taille
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        stars.push({ x, y, size, speed });
    }
}

// Générer la planète (décor)
function generatePlanet() {
    const x = Math.random() * (canvas.width - 400);  // Position horizontale aléatoire
    planet = {
        x: x,
        y: -800,          // Position de départ hors de l'écran
        width: 400,       // Largeur de la planète
        height: 400,      // Hauteur de la planète
        speed: 0.5        // Vitesse lente pour traverser l'écran
    };
}

// Générer la lune (décor)
function generateMoon() {
    const x = Math.random() * (canvas.width - 800);  // Position horizontale aléatoire
    moon = {
        x: x,
        y: -1600,         // Position de départ hors de l'écran
        width: 800,       // Largeur de la lune
        height: 800,      // Hauteur de la lune
        speed: 0.2        // Vitesse très lente pour traverser l'écran
    };
}

// Mettre à jour les positions des étoiles
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed; // Faire descendre les étoiles
        if (star.y > canvas.height) {
            star.y = 0; // Réinitialiser la position pour créer un effet de boucle
            star.x = Math.random() * canvas.width;
        }
    });
}

// Mettre à jour la position de la planète
function updatePlanet() {
    if (planet) {
        planet.y += planet.speed; // Faire descendre la planète
        if (planet.y > canvas.height) {
            planet = null; // Supprimer la planète lorsqu'elle sort de l'écran
        }
    } else {
        // Générer la planète avec une probabilité de 1 sur 500 à chaque frame
        if (Math.random() < 0.002) {
            generatePlanet();
        }
    }
}

// Mettre à jour la position de la lune
function updateMoon() {
    if (moon) {
        moon.y += moon.speed; // Faire descendre la lune
        if (moon.y > canvas.height) {
            moon = null; // Supprimer la lune lorsqu'elle sort de l'écran
        }
    } else {
        // Générer la lune avec une probabilité de 1 sur 1000 à chaque frame
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
function generateObstacle() {
    const size = Math.random() * 50 + 30;
    const x = Math.random() * (canvas.width - size);
    const speed = (Math.random() * 3 + 2) * obstacleSpeedMultiplier; // Appliquer le multiplicateur de vitesse
    const imageIndex = Math.floor(Math.random() * obstacleImages.length);
    obstacles.push({ x, y: -size, size, speed, image: obstacleImages[imageIndex] });
}

// Déplacer la fusée avec inertie ou suivant le doigt
function moveRocket() {
    if (!touchActive) {
        // Appliquer la friction pour ralentir progressivement la fusée
        rocket.dx *= rocket.friction;
        rocket.dy *= rocket.friction;

        // Limiter la vitesse maximale de la fusée
        if (rocket.dx > rocket.maxSpeed) rocket.dx = rocket.maxSpeed;
        if (rocket.dx < -rocket.maxSpeed) rocket.dx = -rocket.maxSpeed;
        if (rocket.dy > rocket.maxSpeed) rocket.dy = rocket.maxSpeed;
        if (rocket.dy < -rocket.maxSpeed) rocket.dy = -rocket.maxSpeed;

        // Déplacer la fusée selon la vitesse
        rocket.x += rocket.dx;
        rocket.y += rocket.dy;
    }

    // Empêcher la fusée de sortir du canvas horizontalement
    if (rocket.x < 0) rocket.x = 0;
    if (rocket.x + rocket.width > canvas.width) rocket.x = canvas.width - rocket.width;

    // Empêcher la fusée de sortir du canvas verticalement
    if (rocket.y < 0) rocket.y = 0;
    if (rocket.y + rocket.height > canvas.height) rocket.y = canvas.height - rocket.height;
}

// Gérer les collisions avec tolérance
function detectCollision(rocket, obstacle) {
    // Calculer les centres
    const rocketCenterX = rocket.x + rocket.width / 2;
    const rocketCenterY = rocket.y + rocket.height / 2;
    const obstacleCenterX = obstacle.x + obstacle.size / 2;
    const obstacleCenterY = obstacle.y + obstacle.size / 2;

    // Calculer la distance entre les centres
    const deltaX = rocketCenterX - obstacleCenterX;
    const deltaY = rocketCenterY - obstacleCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Définir le seuil de collision avec tolérance
    const collisionThreshold = (rocket.width / 2) + (obstacle.size / 2) + 30; // Augmenté de 20 à 30 pixels de tolérance

    // Vérifier si la distance est inférieure au seuil
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
    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Time: ${(elapsedTime / 10).toFixed(1)}s`, 20, 20);
}

// Dessiner les cœurs (vies) en haut à droite
function drawLives() {
    const heartSize = 30; // Taille d'un cœur
    const padding = 10;    // Espacement entre les cœurs
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(heartImage, canvas.width - (heartSize + padding) * (i + 1), 20, heartSize, heartSize);
    }
}

// Dessiner le score dans une bulle verte
function drawScore() {
    const bubbleRadius = 100;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Dessiner la bulle verte
    ctx.beginPath();
    ctx.arc(centerX, centerY, bubbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.fill();
    ctx.closePath();

    // Dessiner le texte du score
    ctx.font = "30px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Score: ${score.toFixed(1)}s`, centerX, centerY);
}

// Fonction pour afficher le score et retourner au bouton "Start Game"
function displayScore() {
    // Dessiner le score une fois
    drawScore();

    // Après un délai, réinitialiser le jeu et afficher le bouton "Start Game"
    setTimeout(() => {
        showScore = false;
        document.getElementById("startButton").style.display = "block";
        canvas.style.display = "none";
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Remettre la musique à zéro
    }, 2000); // Affiche le score pendant 2 secondes
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
    const deadZone = 10; // pixels

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
let obstacleInterval;

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

    drawStars();          // Dessiner les étoiles
    drawPlanet();         // Dessiner la planète
    drawMoon();           // Dessiner la lune
    drawObstacles();      // Dessiner les obstacles
    drawRocket();         // Dessiner la fusée
    drawTimer();          // Dessiner le compteur de temps
    drawLives();          // Dessiner les vies

    if (showScore) {
        drawScore();      // Dessiner le score si nécessaire
    }

    animationFrameId = requestAnimationFrame(gameLoop); // Demander la prochaine frame
}

// Augmenter la difficulté progressivement
function increaseDifficulty() {
    difficultyLevel += 1;            // Augmenter le niveau de difficulté
    obstacleSpeedMultiplier += 0.2;  // Augmenter la vitesse des obstacles

    // Ajouter plus d'obstacles
    for (let i = 0; i < difficultyLevel; i++) {
        generateObstacle();
    }
}

// Fonction pour démarrer ou réinitialiser le jeu
function startGame() {
    // Réinitialiser les variables du jeu
    rocket = { ...initialRocket };
    obstacles = [];
    stars = [];
    planet = null;
    moon = null;
    difficultyLevel = 1;
    obstacleSpeedMultiplier = 1;
    elapsedTime = 0;
    showScore = false;
    score = 0;
    lives = 3; // Réinitialiser les vies

    // Générer à nouveau les étoiles
    generateStars();

    // Remettre le canvas visible et le bouton de démarrage caché
    document.getElementById("startButton").style.display = "none";
    canvas.style.display = "block";

    // Démarrer la musique de fond
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();

    // Recommencer la boucle de jeu
    gameLoop();

    // Augmenter la difficulté toutes les 5 secondes (divisé par deux)
    difficultyInterval = setInterval(increaseDifficulty, 5000); // Anciennement 10000ms

    // Générer des obstacles à intervalles réguliers
    obstacleInterval = setInterval(generateObstacle, 800);

    // Démarrer le timer
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsedTime += 1;
    }, 100); // Incrémente toutes les 100ms (dixièmes de seconde)
}

// Mettre à jour les obstacles et gérer les collisions
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obstacle = obstacles[i];
        obstacle.y += obstacle.speed; // Appliquer la vitesse augmentée
        if (obstacle.y > canvas.height) {
            obstacles.splice(i, 1);
            continue;
        }
        if (detectCollision(rocket, obstacle)) {
            // Gérer la perte d'une vie
            obstacles.splice(i, 1); // Retirer l'obstacle en collision
            lives -= 1;             // Perdre une vie

            // Jouer le son de collision
            collisionSound.currentTime = 0; // Remettre le son à zéro
            collisionSound.play();

            if (lives <= 0) {
                // Si aucune vie restante, arrêter le jeu et afficher le score
                cancelAnimationFrame(animationFrameId);
                clearInterval(obstacleInterval);
                clearInterval(difficultyInterval);
                clearInterval(timerInterval);
                showScore = true;
                score = elapsedTime / 10; // Convertir en secondes avec une décimale
                setTimeout(() => {
                    // Afficher la bulle verte avec le score
                    displayScore();
                }, 100); // Légère pause avant d'afficher le score
            }

            break; // Sortir de la boucle après gestion de la collision
        }
    }
}

// Fonction pour afficher le score et retourner au bouton "Start Game"
function displayScore() {
    // Dessiner le score une fois
    drawScore();

    // Après un délai, réinitialiser le jeu et afficher le bouton "Start Game"
    setTimeout(() => {
        showScore = false;
        document.getElementById("startButton").style.display = "block";
        canvas.style.display = "none";
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Remettre la musique à zéro
    }, 2000); // Affiche le score pendant 2 secondes
}

// Fonction pour réinitialiser le jeu (si nécessaire)
function resetGame() {
    // Cette fonction est maintenant intégrée dans 'startGame' et 'displayScore'
    // Vous pouvez l'utiliser pour d'autres réinitialisations si nécessaire
}

// Événement pour démarrer le jeu
document.getElementById("startButton").addEventListener("click", startGame);
