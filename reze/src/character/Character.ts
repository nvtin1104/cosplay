import { Mesh, PlaneGeometry, ShaderMaterial, Texture, Vector2 } from "three";
import vertexShader from "../shaders/hair.vert?raw";
import fragmentShader from "../shaders/hair.frag?raw";
import { CharacterMasks } from "./CharacterMasks";
import { BlinkAnimator } from "./BlinkAnimator";
import { HairAnimator } from "./HairAnimator";
import { breathing } from "./BreathingAnimator";
import type { Settings } from "../settings";
import type { WindController } from "../environment/WindController";
export class Character {
  masks = new CharacterMasks();
  blink = new BlinkAnimator();
  hair = new HairAnimator();
  material: ShaderMaterial;
  mesh: Mesh;
  pixelSize = new Vector2(1, 1);
  constructor(public texture: Texture) {
    const uniform = (value: unknown) => ({ value });
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        map: uniform(texture),
        closedMap: uniform(texture),
        uHasClosed: uniform(0),
        hairMask: uniform(this.masks.textures.hair),
        rootsMask: uniform(this.masks.textures.roots),
        tipsMask: uniform(this.masks.textures.tips),
        bodyMask: uniform(this.masks.textures.body),
        clothesMask: uniform(this.masks.textures.clothes),
        faceMask: uniform(this.masks.textures.face),
        leftEyeMask: uniform(this.masks.textures.leftEye),
        rightEyeMask: uniform(this.masks.textures.rightEye),
        uTime: uniform(0),
        uWind: uniform(0),
        uClothWind: uniform(0),
        uTurbulence: uniform(0),
        uFrequency: uniform(1),
        uRootLock: uniform(1),
        uTip: uniform(1),
        uBreath: uniform(0),
        uIdle: uniform(0),
        uBlink: uniform(0),
        uDebug: uniform(0),
      },
    });
    // Geometry uses pixel-sized coordinates: deformation amplitudes stay tiny at every screen size.
    this.mesh = new Mesh(
      new PlaneGeometry(2032, 2032, 180, 180),
      this.material,
    );
    this.mesh.position.z = 2;
    this.mesh.renderOrder = 3;
  }
  update(time: number, dt: number, s: Settings, wind: WindController) {
    this.blink.update(
      time,
      s.blinkEnabled && this.material.uniforms.uHasClosed.value > 0,
      s.blinkFrequency,
    );
    const u = this.material.uniforms;
    u.uTime.value = time * s.windSpeed;
    u.uWind.value = s.hairAmplitude === 0 ? 0 : this.hair.update(dt, wind, s);
    u.uClothWind.value =
      s.hairAmplitude > 0 ? wind.strength * wind.direction * 3 : 0;
    u.uTurbulence.value = s.quality === "Low" ? 0 : s.turbulence;
    u.uFrequency.value = s.hairFrequency;
    u.uRootLock.value = s.rootLock;
    u.uTip.value = s.tipInfluence;
    u.uBreath.value = breathing(time, s.breathingSpeed) * s.breathingStrength;
    u.uIdle.value = s.idleStrength;
    u.uBlink.value = this.blink.amount;
    u.uDebug.value = [
      "Off",
      "UV",
      "Hair mask",
      "Eye mask",
      "Body mask",
    ].indexOf(s.debug);
    this.material.wireframe = s.debug === "Mesh";
  }
  setQuality(quality: string) {
    this.mesh.geometry.dispose();
    const segments = quality === "Low" ? 72 : quality === "Medium" ? 120 : 180;
    this.mesh.geometry = new PlaneGeometry(2032, 2032, segments, segments);
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.masks.dispose();
    const closed = this.material.uniforms.closedMap.value;
    if (closed !== this.texture) closed.dispose();
  }
}
