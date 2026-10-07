attribute vec3 seed;
uniform float uTime,uSpeed,uWind,uAngle,uLength,uWidth;
uniform vec2 uViewport;
varying vec2 vUv;
varying float vAlpha;
void main() {
 vUv=uv;
 float travel=fract(seed.y-uTime*uSpeed*(.13+seed.z*.09));
 float slant=uAngle+uWind*.12;
 float x=fract(seed.x+(1.-travel)*slant);
 vec3 p=position;
 p.x=p.x*uWidth+slant*p.y*uLength+(x-.5)*uViewport.x*1.3;
 p.y=p.y*uLength+(travel-.5)*uViewport.y*1.3;
 vAlpha=.4+seed.z*.6;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}
