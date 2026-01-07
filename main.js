import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import anime from 'animejs';

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
let rings = [];
const loader = new FontLoader();
loader.load('https://unpkg.com/three@0.160.0/examples/fonts/droid/droid_sans_mono_regular.typeface.json', function (font) {
    const size = 1.5;
    const spacing = 1.0; // Gap between words
    const material = new THREE.MeshBasicMaterial({ color: 0x22ff22 });

    // 1. Create "Ian"
    const shapes1 = font.generateShapes('Ian', size);
    const geo1 = new THREE.ShapeGeometry(shapes1);
    geo1.computeBoundingBox();
    const w1 = geo1.boundingBox.max.x - geo1.boundingBox.min.x;
    // Center geometry locally
    geo1.translate(-0.5 * w1, -0.5 * (geo1.boundingBox.max.y - geo1.boundingBox.min.y), 0);
    const mesh1 = new THREE.Mesh(geo1, material);
    scene.add(mesh1);

    // 2. Create "Tan"
    const shapes2 = font.generateShapes('Tan', size);
    const geo2 = new THREE.ShapeGeometry(shapes2);
    geo2.computeBoundingBox();
    const w2 = geo2.boundingBox.max.x - geo2.boundingBox.min.x;
    // Center geometry locally
    geo2.translate(-0.5 * w2, -0.5 * (geo2.boundingBox.max.y - geo2.boundingBox.min.y), 0);
    const mesh2 = new THREE.Mesh(geo2, material);
    scene.add(mesh2);

    // Create Ring
    // Calculate total width for ring sizing
    const totalWidth = w1 + w2 + spacing;
    const ringGeometry = new THREE.RingGeometry((totalWidth * 0.6) - 0.1, (totalWidth * 0.6) + 0.1, 64, 1, 0, Math.PI * 1.8);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x22ff22, side: THREE.DoubleSide });
    
    const ringGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        // Space gaps 120 degrees apart (0, 120, 240)
        ring.rotation.z = i * (Math.PI * 2 / 3);
        ring.userData = { speed: 0 };
        rings.push(ring);
        ringGroup.add(ring);
    }
    
    // Start invisible (rotated 90 degrees on Y axis)
    ringGroup.rotation.y = Math.PI / 2;
    scene.add(ringGroup);

    // Animation Group
    const duration = 2000;
    const delay = 500;
    const easing = 'easeOutExpo';

    anime({
        targets: ringGroup.rotation,
        y: 0,
        duration: duration,
        delay: delay,
        easing: easing
    });

    // Spread rings after rotation
    anime({
        targets: [rings[1].scale, rings[2].scale],
        x: (el, i) => 1.1 + (i * 0.1), // 1.1 for rings[1], 1.2 for rings[2]
        y: (el, i) => 1.1 + (i * 0.1),
        duration: duration,
        delay: delay + duration, // Wait for rotation to finish
        easing: easing
    });

    // Pop rings forward (Z-axis)
    anime({
        targets: rings.map(r => r.position),
        z: (el, i) => i * 2,
        duration: duration,
        delay: delay + duration,
        easing: easing
    });

    // Start continuous rotation (Fastest inner, slowest outer)
    anime({
        targets: rings.map(r => r.userData),
        speed: (el, i) => (0.02 - (i * 0.005)) / 8,
        duration: duration,
        delay: delay + duration,
        easing: easing
    });

    anime({
        targets: mesh1.position,
        x: [0, -(totalWidth / 2) + (w1 / 2)], // Move Left (Centered)
        duration: duration,
        delay: delay,
        easing: easing
    });

    anime({
        targets: mesh2.position,
        x: [0, (totalWidth / 2) - (w2 / 2)], // Move Right (Centered)
        duration: duration,
        delay: delay,
        easing: easing
    });
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
    const maxAngle = 10 * (Math.PI / 180);
    
    // Move camera based on mouse position
    camera.position.x = distance * Math.sin(mouseX * maxAngle);
    camera.position.y = distance * Math.sin(mouseY * maxAngle);
    camera.position.z = distance * Math.cos(mouseX * maxAngle) * Math.cos(mouseY * maxAngle);
    
    camera.lookAt(0, 0, 0);

    rings.forEach(ring => {
        ring.rotation.z += ring.userData.speed;
    });

    renderer.render(scene, camera);
}

animate();