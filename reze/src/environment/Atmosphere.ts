import { Mesh, PlaneGeometry, ShaderMaterial } from "three";
export class Atmosphere {
  material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0.1 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 vUv;uniform float uTime,uStrength;void main(){float wave=sin(vUv.x*8.+uTime*.12)*.3+sin(vUv.x*13.-uTime*.09)*.15;float haze=pow(1.-vUv.y,4.)*(.5+wave);gl_FragColor=vec4(.63,.72,.69,haze*uStrength);}`,
  });
  mesh = new Mesh(new PlaneGeometry(1, 1), this.material);
  constructor() {
    this.mesh.position.z = 5;
    this.mesh.renderOrder = 5;
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
