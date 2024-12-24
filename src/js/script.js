import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import snowVertexShader from '../shaders/snow/vertex.glsl'
import snowFragmentShader from '../shaders/snow/fragment.glsl'

/**
 * Loaders
 */
const textureLoader = new THREE.TextureLoader()

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('../draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('../textures/model/baked_241223_02.jpg')
const backgroundTexture = textureLoader.load('../textures/background/nightSkyTexture.png')
const snowTexture = textureLoader.load('../textures/snow/snowTexture.png')

bakedTexture.flipY = false
snowTexture.flipY = false

bakedTexture.colorSpace = THREE.SRGBColorSpace
backgroundTexture.colorSpace = THREE.SRGBColorSpace
snowTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Base
 */
// Debug
const gui = new GUI()
gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = backgroundTexture

const maxRange = 8;
const minRange = maxRange / 2;
const snowCount = 100

/**
 * Materials
 */
const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
})

// tree
const treeStarMaterial = new THREE.MeshBasicMaterial({ color: '#f9f4bb' })

// floor
const floorSnowMaterial = new THREE.MeshBasicMaterial({ color: '#8bdbff' })
const floorStarMaterial = new THREE.MeshBasicMaterial({ color: '#FFFFFF' })

// snow
const snowMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: snowVertexShader,
    fragmentShader: snowFragmentShader,
    uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 80 },
        uColor: { value: new THREE.Color('#FFFFFF') },
        uLightColor: { value: new THREE.Color('#4AC7FF') },
        uTex: { value: snowTexture },
    }
})


/**
 * Model
 */
const model = gltfLoader.load(
    '../models/241223_xmas_blue_apply.glb',
    (gltf) => {
        gltf.scene.traverse((child) => {
            child.material = bakedMaterial
        })
        scene.add(gltf.scene)

        const treeStarMesh = gltf.scene.children.find((child) => child.name === 'tree_star')
        const floorSnowMesh = gltf.scene.children.find((child) => child.name === 'floor_snow')
        const floorStarMesh = gltf.scene.children.find((child) => child.name === 'floor_star')

        treeStarMesh.material = treeStarMaterial
        floorSnowMesh.material = floorSnowMaterial
        floorStarMesh.material = floorStarMaterial
    }
)



/**
 * Snow
 */
const snowGeometry = new THREE.BufferGeometry()

const snowPositions = new Float32Array(snowCount * 3)

for (let i = 0; i < snowCount; i++) {
    const x = Math.floor(Math.random() * maxRange - minRange);
    const y = Math.floor(Math.random() * maxRange - minRange) ;
    const z = Math.floor(Math.random() * maxRange - minRange);

    snowPositions[i * 3 + 0] = x
    snowPositions[i * 3 + 1] = y
    snowPositions[i * 3 + 2] = z
}
snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3))

const snowVelocities = []
for (let i = 0; i < snowCount; i++) {
    const x = (Math.random() - 0.5) * 0.1
    const y = (Math.random() - 0.5) * 0.1
    const z = (Math.random() - 0.5) * 0.1

    const particle = new THREE.Vector3(x, y, z)
    snowVelocities.push(particle)
}
snowGeometry.velocities = snowVelocities

const snow = new THREE.Points(snowGeometry, snowMaterial)
scene.add(snow)

/**
 * Lights
 */
// // Ambient light
// const ambientLight = new THREE.AmbientLight('#fff', 1)
// scene.add(ambientLight)

// // Directional Light
// const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
// directionalLight.position.set(1, 1, 0)
// scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update snow
    snowMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 6.2
camera.position.y = 2.6
camera.position.z = 0
scene.add(camera)

gui.add(camera.position, 'x').min(-10).max(10).step(0.01).name('cameraX')
gui.add(camera.position, 'y').min(-10).max(10).step(0.01).name('cameraY')
gui.add(camera.position, 'z').min(-10).max(10).step(0.01).name('cameraZ')

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    for (let i = 0; i < snowCount; i++) {
        const y = i * 3 + 1;
        const z = i * 3 + 2;

        const velY = (0.01 * Math.cos(i / 300 + elapsedTime / 70) + 0.2) * 0.1;
        const velZ = Math.cos(elapsedTime + i / 10) * 0.005;        

        snowPositions[y] -= velY;
        snowPositions[z] += velZ;

        if (snowPositions[y] < -minRange ) {
            snowPositions[y] = minRange;
        }
    }
    snowGeometry.attributes.position.needsUpdate = true;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()