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

// Gérer le chargement des images
let imagesLoaded = 0;
const totalImages = obstacleImages.length + 3; // Inclure l'image de la fusée, la planète et la lune

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
rocketImage.onerror = planetImage.onerror = moonImage.onerror = function () {
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
        width: 400,       // Largeur de la planète multipliée par 4
        height: 400,      // Hauteur de la planète multipliée par 4
        speed: 0.5        // Vitesse lente pour traverser l'écran
    };
}

// Générer la lune (décor)
function generateMoon() {
    const x = Math.random() * (canvas.width - 800);  // Position horizontale aléatoire
    moon = {
        x: x,
        y: -1600,         // Position de départ hors de l'écran
        width: 800,       // Largeur de la lune (super grosse)
        height: 800,      // Hauteur de la lune (super grosse)
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

// Déplacer la fusée avec inertie
function moveRocket() {
    rocket.x += rocket.dx;
    rocket.y += rocket.dy;

    // Appliquer la friction pour ralentir progressivement la fusée
    rocket.dx *= rocket.friction;
    rocket.dy *= rocket.friction;

    // Limiter la vitesse maximale de la fusée
    if (rocket.dx > rocket.maxSpeed) rocket.dx = rocket.maxSpeed;
    if (rocket.dx < -rocket.maxSpeed) rocket.dx = -rocket.maxSpeed;
    if (rocket.dy > rocket.maxSpeed) rocket.dy = rocket.maxSpeed;
    if (rocket.dy < -rocket.maxSpeed) rocket.dy = -rocket.maxSpeed;

    // Empêcher la fusée de sortir du canvas horizontalement
    if (rocket.x < 0) rocket.x = 0;
    if (rocket.x + rocket.width > canvas.width) rocket.x = canvas.width - rocket.width;

    // Empêcher la fusée de sortir du canvas verticalement
    if (rocket.y < 0) rocket.y = 0;
    if (rocket.y + rocket.height > canvas.height) rocket.y = canvas.height - rocket.height;
}

// Gérer les collisions
function detectCollision(rocket, obstacle) {
    return !(
        rocket.y > obstacle.y + obstacle.size ||
        rocket.y + rocket.height < obstacle.y ||
        rocket.x > obstacle.x + obstacle.size ||
        rocket.x + rocket.width < obstacle.x
    );
}

// Fonction pour réinitialiser le jeu
function resetGame() {
    // Réinitialiser les variables du jeu
    rocket = { ...initialRocket };
    obstacles = [];
    stars = [];
    planet = null;
    moon = null;
    difficultyLevel = 1;
    obstacleSpeedMultiplier = 1;

    // Générer à nouveau les étoiles
    generateStars();

    // Remettre le canvas visible et le bouton de démarrage caché
    document.getElementById("startButton").style.display = "none";
    canvas.style.display = "block";

    // Recommencer la boucle de jeu
    gameLoop();

    // Réinitialiser l'intervalle de difficulté
    clearInterval(difficultyInterval);
    difficultyInterval = setInterval(increaseDifficulty, 10000);

    // Générer des obstacles à intervalles réguliers
    clearInterval(obstacleInterval);
    obstacleInterval = setInterval(generateObstacle, 800);
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
            // Arrêter toutes les boucles et redémarrer le jeu
            cancelAnimationFrame(animationFrameId);
            clearInterval(obstacleInterval);
            clearInterval(difficultyInterval);
            resetGame();
            break; // Sortir de la boucle après réinitialisation
        }
    }
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
let touchTarget = null;

// Contrôles de la fusée via écran tactile
canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchmove", handleTouchMove, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchTarget = { x: touch.clientX, y: touch.clientY };
    updateRocketVelocity(touchTarget.x, touchTarget.y);
}

function handleTouchMove(e) {
    const touch = e.touches[0];
    touchTarget = { x: touch.clientX, y: touch.clientY };
    updateRocketVelocity(touchTarget.x, touchTarget.y);
    e.preventDefault(); // Empêcher le défilement de la page
}

function handleTouchEnd(e) {
    touchTarget = null;
}

function updateRocketVelocity(x, y) {
    const centerX = rocket.x + rocket.width / 2;
    const centerY = rocket.y + rocket.height / 2;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    // Calculer la distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Définir un seuil de distance pour éviter les mouvements mineurs
    const deadZone = 20; // pixels

    if (distance > deadZone) {
        const angle = Math.atan2(deltaY, deltaX);
        const speed = 5; // Augmenter la vitesse pour une meilleure réactivité

        // Définir la vitesse directement vers la direction du toucher
        rocket.dx = Math.cos(angle) * speed;
        rocket.dy = Math.sin(angle) * speed;
    } else {
        // Si dans la zone morte, réduire la vitesse ou la mettre à zéro
        rocket.dx = 0;
        rocket.dy = 0;
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
    updateStars();        // Mettre à jour les étoiles
    updatePlanet();       // Mettre à jour la planète
    updateMoon();         // Mettre à jour la lune
    updateObstacles();    // Mettre à jour les obstacles

    drawStars();          // Dessiner les étoiles
    drawPlanet();         // Dessiner la planète
    drawMoon();           // Dessiner la lune
    drawObstacles();      // Dessiner les obstacles
    drawRocket();         // Dessiner la fusée

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

    // Générer à nouveau les étoiles
    generateStars();

    // Remettre le canvas visible et le bouton de démarrage caché
    document.getElementById("startButton").style.display = "none";
    canvas.style.display = "block";

    // Démarrer la musique de fond
    backgroundMusic.play();

    // Commencer la boucle de jeu
    gameLoop();

    // Augmenter la difficulté toutes les 10 secondes
    difficultyInterval = setInterval(increaseDifficulty, 10000);

    // Générer des obstacles à intervalles réguliers
    obstacleInterval = setInterval(generateObstacle, 800);
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
            // Arrêter toutes les boucles et réinitialiser le jeu
            cancelAnimationFrame(animationFrameId);
            clearInterval(obstacleInterval);
            clearInterval(difficultyInterval);
            resetGame();
            break; // Sortir de la boucle après réinitialisation
        }
    }
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

// Fonction pour réinitialiser le jeu
function resetGame() {
    // Réinitialiser les variables du jeu
    rocket = { ...initialRocket };
    obstacles = [];
    stars = [];
    planet = null;
    moon = null;
    difficultyLevel = 1;
    obstacleSpeedMultiplier = 1;

    // Générer à nouveau les étoiles
    generateStars();

    // Remettre le canvas visible et le bouton de démarrage caché
    document.getElementById("startButton").style.display = "none";
    canvas.style.display = "block";

    // Recommencer la boucle de jeu
    gameLoop();

    // Réinitialiser l'intervalle de difficulté
    clearInterval(difficultyInterval);
    difficultyInterval = setInterval(increaseDifficulty, 10000);

    // Générer des obstacles à intervalles réguliers
    clearInterval(obstacleInterval);
    obstacleInterval = setInterval(generateObstacle, 800);
}

// Démarrer le jeu après clic sur le bouton
document.getElementById("startButton").addEventListener("click", startGame);
