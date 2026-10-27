import * as THREE from 'three';

const PILOT_LATITUDE = 39;
const PILOT_LONGITUDE = -98;
const RADIUS = 2;

function pilotVector(): THREE.Vector3 {
  const latitude = THREE.MathUtils.degToRad(PILOT_LATITUDE);
  const phi = THREE.MathUtils.degToRad(PILOT_LONGITUDE + 180);
  const distance = RADIUS + 0.045;

  return new THREE.Vector3(
    -distance * Math.cos(latitude) * Math.cos(phi),
    distance * Math.sin(latitude),
    distance * Math.cos(latitude) * Math.sin(phi),
  );
}

export class InteractiveGlobe {
  private readonly mount: HTMLElement;
  private readonly marker: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  private readonly earth = new THREE.Group();
  private readonly markerPosition = pilotVector();
  private readonly resizeObserver: ResizeObserver;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private dragging = false;
  private active = true;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lastInteraction = performance.now();
  private frameId = 0;

  constructor(mount: HTMLElement, marker: HTMLElement) {
    this.mount = mount;
    this.marker = marker;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.mount.append(this.renderer.domElement);

    this.camera.position.set(0, 0, 7.2);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunlight.position.set(-3, 4, 6);
    this.scene.add(sunlight);

    const texture = new THREE.TextureLoader().load('/assets/earth-blue-marble.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    const surface = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 80, 64),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }),
    );
    this.earth.add(surface);
    this.earth.rotation.y = -0.08;
    this.earth.rotation.x = 0.04;
    this.scene.add(this.earth);

    this.mount.addEventListener('pointerdown', this.onPointerDown);
    this.mount.addEventListener('pointermove', this.onPointerMove);
    this.mount.addEventListener('pointerup', this.onPointerUp);
    this.mount.addEventListener('pointercancel', this.onPointerUp);
    this.mount.addEventListener('keydown', this.onKeyDown);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.mount);
    this.resize();
    this.animate();
  }

  setActive(active: boolean): void {
    this.active = active;
    if (active) this.lastInteraction = performance.now();
  }

  zoom(direction: 1 | -1): void {
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z + direction * 0.55,
      5.1,
      9.5,
    );
    this.lastInteraction = performance.now();
  }

  destroy(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.mount.removeEventListener('pointerdown', this.onPointerDown);
    this.mount.removeEventListener('pointermove', this.onPointerMove);
    this.mount.removeEventListener('pointerup', this.onPointerUp);
    this.mount.removeEventListener('pointercancel', this.onPointerUp);
    this.mount.removeEventListener('keydown', this.onKeyDown);
    this.renderer.dispose();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    this.dragging = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.lastInteraction = performance.now();
    this.mount.setPointerCapture(event.pointerId);
    this.mount.classList.add('is-dragging');
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    const deltaX = event.clientX - this.lastPointerX;
    const deltaY = event.clientY - this.lastPointerY;
    this.earth.rotation.y += deltaX * 0.0052;
    this.earth.rotation.x = THREE.MathUtils.clamp(
      this.earth.rotation.x + deltaY * 0.0035,
      -0.6,
      0.6,
    );
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.lastInteraction = performance.now();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.dragging = false;
    this.mount.classList.remove('is-dragging');
    if (this.mount.hasPointerCapture(event.pointerId)) {
      this.mount.releasePointerCapture(event.pointerId);
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const turn = event.shiftKey ? 0.22 : 0.1;
    switch (event.key) {
      case 'ArrowLeft':
        this.earth.rotation.y -= turn;
        break;
      case 'ArrowRight':
        this.earth.rotation.y += turn;
        break;
      case 'ArrowUp':
        this.earth.rotation.x = Math.max(-0.6, this.earth.rotation.x - turn);
        break;
      case 'ArrowDown':
        this.earth.rotation.x = Math.min(0.6, this.earth.rotation.x + turn);
        break;
      case '+':
      case '=':
        this.zoom(-1);
        break;
      case '-':
        this.zoom(1);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.lastInteraction = performance.now();
  };

  private resize(): void {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private updateMarker(): void {
    this.earth.updateMatrixWorld();
    const world = this.markerPosition.clone().applyMatrix4(this.earth.matrixWorld);
    const visible = world.z > 0.18;
    this.marker.hidden = !visible;
    if (!visible) return;

    const projected = world.project(this.camera);
    this.marker.style.left = `${((projected.x + 1) / 2) * this.mount.clientWidth}px`;
    this.marker.style.top = `${((1 - projected.y) / 2) * this.mount.clientHeight}px`;
  }

  private readonly animate = (): void => {
    this.frameId = requestAnimationFrame(this.animate);
    if (!this.active || document.hidden) return;
    if (!this.dragging && !this.reducedMotion.matches && performance.now() - this.lastInteraction > 4500) {
      this.earth.rotation.y += 0.00018;
    }
    this.renderer.render(this.scene, this.camera);
    this.updateMarker();
  };
}
