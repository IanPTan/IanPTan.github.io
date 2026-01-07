import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pure black

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const distance = 12; // Distance from center
camera.position.z = distance;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 2. Load Font & Create Text
const loader = new FontLoader();
loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const shapes = font.generateShapes('Under Construction', 1.5);
    const geometry = new THREE.ShapeGeometry(shapes);

    // Center the text
    geometry.computeBoundingBox();
    const xOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const yOffset = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    geometry.translate(xOffset, yOffset, 0);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(geometry, material);
    scene.add(textMesh);
});

// 3. Mouse Interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    // Normalize mouse position between -1 and 1
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 4. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Calculate orbit angles (5 degrees max = ~0.087 radians)
    const maxAngle = 5 * (Math.PI / 180);
    
    // Move camera based on mouse position
    camera.position.x = distance * Math.sin(mouseX * maxAngle);
    camera.position.y = distance * Math.sin(mouseY * maxAngle);
    camera.position.z = distance * Math.cos(mouseX * maxAngle) * Math.cos(mouseY * maxAngle);
    
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

animate();