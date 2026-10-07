import {
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  PlaneGeometry,
  Mesh,
  ShaderMaterial,
  Vector2,
} from "three";
import vertexShader from "../shaders/rain.vert?raw";
import fragmentShader from "../shaders/rain.frag?raw";
import type { Settings } from "../settings";
import type { WindController } from "./WindController";
export class RainSystem {
  meshes: Mesh[] = [];
  constructor() {
    for (let layer = 0; layer < 3; layer++) {
      const geometry = new InstancedBufferGeometry();
      const plane = new PlaneGeometry(1, 1);
      geometry.index = plane.index!.clone();
      for (const name of ["position", "uv"])
        geometry.setAttribute(name, plane.attributes[name].clone());
      plane.dispose();
      const seeds = new Float32Array(1600 * 3);
      for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
      geometry.setAttribute("seed", new InstancedBufferAttribute(seeds, 3));
      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 1 },
          uWind: { value: 0 },
          uAngle: { value: 0 },
          uLength: { value: [9, 19, 38][layer] },
          uWidth: { value: [0.6, 0.8, 1.2][layer] },
          uOpacity: { value: 0.1 },
          uViewport: { value: new Vector2(1, 1) },
        },
      });
      const mesh = new Mesh(geometry, material);
      mesh.position.z = [-2, 0, 4][layer];
      mesh.renderOrder = [1, 2, 4][layer];
      mesh.frustumCulled = false;
      this.meshes.push(mesh);
    }
  }
  resize(w: number, h: number) {
    for (const mesh of this.meshes)
      (mesh.material as ShaderMaterial).uniforms.uViewport.value.set(w, h);
  }
  update(time: number, s: Settings, wind: WindController) {
    this.meshes.forEach((mesh, i) => {
      const u = (mesh.material as ShaderMaterial).uniforms;
      u.uTime.value = time;
      u.uSpeed.value = s.rainSpeed * [0.65, 1, 1.5][i];
      u.uWind.value = wind.strength * wind.direction;
      u.uAngle.value = s.rainAngle;
      u.uOpacity.value = s.rainOpacity * [0.32, 0.62, 1][i];
      (mesh.geometry as InstancedBufferGeometry).instanceCount = Math.floor(
        (s.quality === "Low" ? 350 : s.quality === "Medium" ? 800 : 1600) *
          s.rainIntensity *
          (i === 2 ? s.foregroundAmount : 1),
      );
    });
  }
  dispose() {
    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      (mesh.material as ShaderMaterial).dispose();
    }
  }
}
