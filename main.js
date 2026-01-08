import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import anime from 'animejs';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pure black

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraParams = { distance: 256 }; // Start distant
camera.position.z = cameraParams.distance;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.15; // Subtle retro glow
bloomPass.radius = 0.5;
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Background Grid
const gridGeometry = new THREE.PlaneGeometry(300, 300);

const gridCanvas = document.createElement('canvas');
gridCanvas.width = 64;
gridCanvas.height = 64;
const gridCtx = gridCanvas.getContext('2d');
gridCtx.clearRect(0, 0, 64, 64); // Ensure background is transparent
gridCtx.fillStyle = '#FFFFFF';
gridCtx.fillRect(32, 26, 1, 12); // Vertical
gridCtx.fillRect(26, 32, 12, 1); // Horizontal
const gridTexture = new THREE.CanvasTexture(gridCanvas);
gridTexture.magFilter = THREE.NearestFilter;
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat.set(20, 20); // 300 / 15 = 20 repeats

const gridMaterial = new THREE.MeshBasicMaterial({
    map: gridTexture,
    color: 0x808000,
    transparent: true,
    opacity: 0,
    depthWrite: false // Prevents the transparent parts from blocking objects behind
});
const bgGrid = new THREE.Mesh(gridGeometry, gridMaterial);
bgGrid.position.z = -50;
bgGrid.visible = false;
scene.add(bgGrid);

// Background Floating Rectangles
const bgRectGeometry = new THREE.PlaneGeometry(1, 1);
const bgRects = [];
const bgRectGroup = new THREE.Group();
bgRectGroup.visible = false;
scene.add(bgRectGroup);

function createRectTexture() {
    const width = 4;
    const height = 4;
    const size = width * height;
    const data = new Uint8Array(4 * size);

    for (let i = 0; i < size; i++) {
        const stride = i * 4;
        if (Math.random() > 0.5) {
            // Random Dim Blue (Max ~32)
            const blue = 10 + Math.floor(Math.random() * 22);
            data[stride] = 0;
            data[stride + 1] = 0;
            data[stride + 2] = blue;
            data[stride + 3] = 255;
        } else {
            // Transparent
            data[stride] = 0;
            data[stride + 1] = 0;
            data[stride + 2] = 0;
            data[stride + 3] = 0;
        }
    }

    const texture = new THREE.DataTexture(data, width, height);
    texture.needsUpdate = true;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping; // Stretch horizontally
    texture.wrapT = THREE.RepeatWrapping;      // Tile vertically
    return texture;
}

function spawnBgRect(initialX) {
    // Random Size
    const w = 40 + Math.random() * 60;
    const h = 10 + Math.random() * 40;

    const texture = createRectTexture();
    texture.repeat.set(1, h / 4); // Tile vertically based on height

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });

    const rect = new THREE.Mesh(bgRectGeometry, material);
    
    rect.scale.set(w, h, 1);

    // Position (Start Left, Move Right)
    rect.position.x = initialX !== undefined ? initialX : -262.5;
    rect.position.y = (Math.random() - 0.5) * 225;
    rect.position.z = -60 - Math.random() * 60; // Behind grid (-50)

    rect.userData = { speed: 0.1 + Math.random() * 0.2 };
    bgRectGroup.add(rect);
    bgRects.push(rect);
    return rect;
}

// 2. Load Font & Create Text
let rings = [];
let socialButtons = [];
const loader = new FontLoader();
loader.load('https://unpkg.com/three@0.160.0/examples/fonts/droid/droid_sans_mono_regular.typeface.json', function (font) {
    const size = 1.5;
    const spacing = 1.0; // Gap between words
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x11ff11,
        transparent: true,
        opacity: 0
    });

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

    // 3. Create "scroll down"
    const scrollSize = size * 0.33;
    const shapes3 = font.generateShapes('scroll down', scrollSize);
    const geo3 = new THREE.ShapeGeometry(shapes3);
    geo3.computeBoundingBox();
    const w3 = geo3.boundingBox.max.x - geo3.boundingBox.min.x;
    const h3 = geo3.boundingBox.max.y - geo3.boundingBox.min.y;
    geo3.translate(-0.5 * w3, -0.5 * h3, 0);

    const scrollMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x11ff11,
        transparent: true,
        opacity: 0
    });

    const scrollGroup = new THREE.Group();
    const textMesh = new THREE.Mesh(geo3, scrollMaterial);
    scrollGroup.add(textMesh);

    // Create Stacked V Icons
    const vShapes = font.generateShapes('v', scrollSize);
    const vGeo = new THREE.ShapeGeometry(vShapes);
    vGeo.computeBoundingBox();
    const vH = vGeo.boundingBox.max.y - vGeo.boundingBox.min.y;
    vGeo.translate(-0.5 * (vGeo.boundingBox.max.x - vGeo.boundingBox.min.x), -0.5 * vH, 0);

    const createIcon = (xPos) => {
        const v1 = new THREE.Mesh(vGeo, scrollMaterial);
        const v2 = new THREE.Mesh(vGeo, scrollMaterial);
        v2.position.y = -vH * 0.65; // Stack below
        const g = new THREE.Group();
        g.add(v1, v2);
        g.position.set(xPos, vH * 0.3, 0);
        return g;
    };

    scrollGroup.add(createIcon(-(w3 / 2) - 0.8)); // Left Icon
    scrollGroup.add(createIcon((w3 / 2) + 0.8));  // Right Icon

    scrollGroup.position.y = 2.0;
    scene.add(scrollGroup);

    // 4. Social Buttons
    const textureLoader = new THREE.TextureLoader();
    const githubTex = textureLoader.load('./github.png');
    const linkedinTex = textureLoader.load('./linkedin.png');

    const iconGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const githubMat = new THREE.MeshBasicMaterial({ 
        map: githubTex, 
        color: 0xffffff,
        transparent: true, 
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0 
    });
    const linkedinMat = new THREE.MeshBasicMaterial({ 
        map: linkedinTex, 
        color: 0xffffff,
        transparent: true, 
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0 
    });

    const githubMesh = new THREE.Mesh(iconGeo, githubMat);
    const linkedinMesh = new THREE.Mesh(iconGeo, linkedinMat);

    githubMesh.position.set(-1.5, -2.5, 0);
    linkedinMesh.position.set(1.5, -2.5, 0);

    githubMesh.userData = { url: 'https://github.com/ianptan' };
    linkedinMesh.userData = { url: 'https://www.linkedin.com/in/ianptan' };

    scene.add(githubMesh);
    scene.add(linkedinMesh);
    socialButtons.push(githubMesh, linkedinMesh);

    // Create Ring
    // Calculate total width for ring sizing
    const totalWidth = w1 + w2 + spacing;
    const ringGeometry = new THREE.RingGeometry((totalWidth * 0.6) - 0.1, (totalWidth * 0.6) + 0.1, 64);

    // Fix UVs to wrap texture around the ring (Strip mapping)
    const posAttribute = ringGeometry.attributes.position;
    const uvAttribute = ringGeometry.attributes.uv;
    const thetaSegments = 64;
    for (let i = 0; i < posAttribute.count; i++) {
        const col = i % (thetaSegments + 1);
        const row = Math.floor(i / (thetaSegments + 1));
        // Map U to width (0..1), V to circumference (0..1)
        uvAttribute.setXY(i, row, col / thetaSegments);
    }
    ringGeometry.attributes.uv.needsUpdate = true;

    // Generate Glitch Texture
    function createRingTexture(withGlitch) {
        const width = 4, height = 64;
        const size = width * height;
        const data = new Uint8Array(4 * size);

        // 1. Base Green (Pure Green)
        for (let i = 0; i < size; i++) {
            const stride = i * 4;
            data[stride] = 0; data[stride + 1] = 255; data[stride + 2] = 0; data[stride + 3] = 255;
        }

        if (withGlitch) {
            // 2. Generate Clumps (Patches of noisy blue)
            const numClumps = 10; // ~50% coverage
            for (let i = 0; i < numClumps; i++) {
                const cx = Math.floor(Math.random() * width);
                const cy = Math.floor(Math.random() * height);
                const w = Math.floor(Math.random() * 2); // 0 or 1 radius (1 or 3 px wide)
                const h = Math.floor(Math.random() * 5) + 2; // 2 to 6 radius (5 to 13 px tall)

                for (let x = cx - w; x <= cx + w; x++) {
                    for (let y = cy - h; y <= cy + h; y++) {
                        // Wrap Y (circumference), Clamp X (width)
                        const py = (y + height * 2) % height;
                        if (x >= 0 && x < width) {
                            // Noisy fill (85% chance to be blue inside clump)
                            if (Math.random() > 0.15) {
                                const idx = (py * width + x) * 4;
                            // Blue (Pure Blue)
                            data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 255;
                            }
                        }
                    }
                }
            }
        }
        const tex = new THREE.DataTexture(data, width, height);
        tex.needsUpdate = true;
        tex.magFilter = THREE.NearestFilter; // Pixelated look
        tex.minFilter = THREE.NearestFilter;
        return tex;
    }

    const cleanTexture = createRingTexture(false);
    const glitchTexture = createRingTexture(true);

    const ringMaterial = new THREE.MeshBasicMaterial({ 
        map: cleanTexture,
        color: 0xffffff, // White so texture colors show true
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0 
    });
    
    const ringGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);

        ring.rotation.z = i * (Math.PI * 2 / 3);
        ring.userData = { speed: 0 };
        rings.push(ring);
        ringGroup.add(ring);
    }
    
    // Start invisible (rotated 90 degrees on Y axis)
    ringGroup.rotation.y = Math.PI / 2;
    scene.add(ringGroup);

    // Animation Group
    const introDuration = 400;
    const duration = 2000;
    const delay = 500 + introDuration; // Wait for intro to finish
    const easing = 'easeOutExpo';

    // Intro: Fade In
    anime({
        targets: '#overlay',
        opacity: 0,
        duration: introDuration,
        easing: 'linear'
    });

    // Intro: Camera Approach
    anime({
        targets: cameraParams,
        distance: 12, // Target distance
        duration: introDuration,
        easing: 'easeOutQuart' // Fast approach then stop
    });

    // Intro: Text Fade In
    anime({
        targets: material,
        opacity: 1,
        duration: introDuration,
        easing: 'linear'
    });

    // Reveal Rings (Fade In)
    anime({
        targets: ringMaterial,
        opacity: 1,
        duration: 100,
        delay: delay,
        easing: 'linear'
    });

    anime({
        targets: ringGroup.rotation,
        y: 0,
        duration: duration,
        delay: delay,
        complete: function() {
            // Assign unique textures to each ring for independent glitching
            rings.forEach(ring => {
                const tex = createRingTexture(true);
                ring.material = new THREE.MeshBasicMaterial({
                    map: tex,
                    color: 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 1
                });
            });

            // Start random patch flipping loop
            const glitchLoop = () => {
                for (let i = 0; i < 5; i++) {
                    const ring = rings[Math.floor(Math.random() * rings.length)];
                    const tex = ring.material.map;
                    const data = tex.image.data;
                    const width = 4, height = 64;

                    const cx = Math.floor(Math.random() * width);
                    const cy = Math.floor(Math.random() * height);
                    const w = Math.floor(Math.random() * 2);
                    const h = Math.floor(Math.random() * 5) + 2;

                    for (let x = cx - w; x <= cx + w; x++) {
                        for (let y = cy - h; y <= cy + h; y++) {
                            const py = (y + height * 2) % height;
                            if (x >= 0 && x < width) {
                                const idx = (py * width + x) * 4;
                                // Swap Green (idx+1) and Blue (idx+2)
                                const g = data[idx + 1];
                                data[idx + 1] = data[idx + 2];
                                data[idx + 2] = g;
                            }
                        }
                    }
                    tex.needsUpdate = true;
                }
                setTimeout(glitchLoop, 1000 + Math.random() * 4000); // Randomly every 1-5s
            };
            glitchLoop();

            // Reveal Grid & Background Rects (Moved here to ensure sync)
            bgGrid.visible = true;
            bgRectGroup.visible = true;

            anime({
                targets: gridMaterial,
                opacity: 1,
                duration: duration,
                easing: easing
            });

            const introRects = [];
            for (let i = 0; i < 60; i++) {
                const rect = spawnBgRect((Math.random() - 0.5) * 525);
                rect.userData.targetOpacity = rect.material.opacity;
                rect.material.opacity = 0;
                introRects.push(rect);
            }
            anime({
                targets: introRects.map(r => r.material),
                opacity: (el, i) => introRects[i].userData.targetOpacity,
                duration: 50,
                delay: (el, i) => i * 3,
                easing: easing,
                complete: function() {
                    anime({
                        targets: [scrollMaterial, githubMat, linkedinMat],
                        opacity: 1,
                        duration: 1000,
                        easing: 'linear',
                        complete: function() {
                            anime({
                                targets: scrollMaterial,
                                opacity: 0,
                                duration: 1000,
                                direction: 'alternate',
                                loop: true,
                                easing: 'easeInOutQuad'
                            });
                        }
                    });
                }
            });
        }
    });

    // Click Listener for Buttons
    const raycaster = new THREE.Raycaster();
    window.addEventListener('click', (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([githubMesh, linkedinMesh]);
        if (intersects.length > 0) {
            window.open(intersects[0].object.userData.url, '_blank');
        }
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
let clientX = -100;
let clientY = -100;
let cursorRotation = 0;
let cursorScale = 1;
const customCursor = document.getElementById('custom-cursor');
const raycaster = new THREE.Raycaster();

document.addEventListener('mousemove', (event) => {
    // Normalize mouse position between -1 and 1
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    clientX = event.clientX;
    clientY = event.clientY;
});

// 4. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Calculate orbit angles (5 degrees max = ~0.087 radians)
    const maxAngle = 10 * (Math.PI / 180);
    
    // Move camera based on mouse position
    camera.position.x = cameraParams.distance * Math.sin(mouseX * maxAngle);
    camera.position.y = cameraParams.distance * Math.sin(mouseY * maxAngle);
    camera.position.z = cameraParams.distance * Math.cos(mouseX * maxAngle) * Math.cos(mouseY * maxAngle);
    
    camera.lookAt(0, 0, 0);

    // Social Button Hover
    let isHovering = false;
    if (socialButtons.length > 0) {
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const intersects = raycaster.intersectObjects(socialButtons);
        if (intersects.length > 0) isHovering = true;

        socialButtons.forEach(btn => {
            const isHovered = intersects.find(i => i.object === btn);
            const targetZ = isHovered ? 2.0 : 0.0;
            btn.position.z += (targetZ - btn.position.z) * 0.15;
        });
    }

    // Update Custom Cursor
    const targetRotation = isHovering ? 45 : 0;
    const targetScale = isHovering ? 1.2 : 1.0;
    cursorRotation += (targetRotation - cursorRotation) * 0.15;
    cursorScale += (targetScale - cursorScale) * 0.15;

    if (customCursor) {
        customCursor.style.transform = `translate(${clientX}px, ${clientY}px) rotate(${cursorRotation}deg) scale(${cursorScale})`;
    }

    rings.forEach(ring => {
        ring.rotation.z += ring.userData.speed;
    });

    // Update Background Rects
    if (bgRectGroup.visible && Math.random() < 0.04) spawnBgRect();

    for (let i = bgRects.length - 1; i >= 0; i--) {
        const rect = bgRects[i];
        rect.position.x += rect.userData.speed;
        if (rect.position.x > 262.5) {
            bgRectGroup.remove(rect);
            if (rect.material.map) rect.material.map.dispose();
            rect.material.dispose();
            bgRects.splice(i, 1);
        }
    }

    composer.render();
}

animate();