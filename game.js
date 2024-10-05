// Sélectionne le canvas et initialise le contexte
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Facteur de réduction
const scaleFactor = 1 / 2.3; // Réduction de la taille par un facteur de 2,3

// Dimensions du canvas (inchangées)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables globales initiales
const initialRocket = {
    x: canvas.width / 2 - (25 * scaleFactor),
    y: canvas.height - (150 * scaleFactor),
    width: 50 * scaleFactor,
    height: 100 * scaleFactor,
    dx: 0,
    dy: 0,
    acceleration: 1.5 * scaleFactor,
    maxSpeed: 15 * scaleFactor,
    friction: 0.93
};

let rocket = { ...initialRocket };
let obstacles = [];
let stars = [];
let planet = null;
let moon = null;
const numberOfStars = 100;
const backgroundMusic = document.getElementById("backgroundMusic");
let difficultyLevel = 1;
let obstacleSpeedMultiplier = 1;

const followSpeed = 10 * scaleFactor; // Vitesse de suivi ajustée

// Charger les images et sons comme précédemment...

// Générer les étoiles
function generateStars() {
    stars = [];
    for (let i = 0; i < numberOfStars; i++) {
        const size = (Math.random() * 3 + 1) * scaleFactor;
        const speed = size / 2;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        stars.push({ x, y, size, speed });
    }
}

// Générer les obstacles
function generateObstacle() {
    const size = (Math.random() * 50 + 30) * scaleFactor;
    const x = Math.random() * (canvas.width - size);
    const speed = (Math.random() * 3 + 2) * obstacleSpeedMultiplier * scaleFactor;
    const imageIndex = Math.floor(Math.random() * obstacleImages.length);
    obstacles.push({ x, y: -size, size, speed, image: obstacleImages[imageIndex] });
}

// Générer la planète et la lune avec les tailles ajustées...

// Ajuster les interactions tactiles
function handleTouchStart(e) {
    const touch = e.touches[0];
    touchActive = true;
    touchX = touch.clientX;
    touchY = touch.clientY;
    e.preventDefault();
}

function handleTouchMove(e) {
    const touch = e.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
    e.preventDefault();
}

function updateRocketPosition() {
    const centerX = rocket.x + rocket.width / 2;
    const centerY = rocket.y + rocket.height / 2;

    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const deadZone = 10 * scaleFactor;

    if (distance > deadZone) {
        const angle = Math.atan2(deltaY, deltaX);

        const moveX = Math.cos(angle) * followSpeed;
        const moveY = Math.sin(angle) * followSpeed;

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

// Ajuster le seuil de collision
function detectCollision(obj1, obj2) {
    if (!obj2) return false;

    const obj1CenterX = obj1.x + obj1.width / 2;
    const obj1CenterY = obj1.y + obj1.height / 2;
    const obj2CenterX = obj2.x + obj2.size / 2;
    const obj2CenterY = obj2.y + obj2.size / 2;

    const deltaX = obj1CenterX - obj2CenterX;
    const deltaY = obj1CenterY - obj2CenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const collisionThreshold = (obj1.width / 2) + (obj2.size / 2) + (30 * scaleFactor);

    return distance < collisionThreshold;
}

// Le reste du code reste inchangé
