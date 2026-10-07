uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
void main(){
 float edge=1.-smoothstep(.1,.5,abs(vUv.x-.5));
 float tail=sin(vUv.y*3.14159);
 gl_FragColor=vec4(.78,.88,.86,edge*tail*vAlpha*uOpacity);
 #include <colorspace_fragment>
}
