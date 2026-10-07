uniform sampler2D map, closedMap, leftEyeMask, rightEyeMask, hairMask, bodyMask;
uniform float uBlink, uHasClosed, uDebug;
varying vec2 vUv;
float coverage(vec4 mask) { return mask.r * mask.a; }
void main() {
 vec4 color=texture2D(map,vUv);
 float l=coverage(texture2D(leftEyeMask,vUv)), r=coverage(texture2D(rightEyeMask,vUv));
 // The open-eye photo contains no closed eyelid. Never squash the iris or
 // stretch nearby skin over it; use only aligned closed-eye artwork.
 if(uHasClosed>.5 && uBlink>0.) {
   vec4 closed=texture2D(closedMap,vUv);
   color.rgb=mix(color.rgb,closed.rgb,max(l,r)*uBlink*closed.a);
 }
 if(uDebug>0.5 && uDebug<1.5) color.rgb=mix(color.rgb,vec3(vUv,0.),.7);
 if(uDebug>1.5 && uDebug<2.5) color.rgb=mix(color.rgb,vec3(.55,1.,.7),coverage(texture2D(hairMask,vUv))*.65);
 if(uDebug>2.5 && uDebug<3.5) color.rgb=mix(color.rgb,vec3(1.,.6,.2),max(l,r)*.8);
 if(uDebug>3.5) color.rgb=mix(color.rgb,vec3(.3,.7,1.),coverage(texture2D(bodyMask,vUv))*.65);
 gl_FragColor=color;
 #include <colorspace_fragment>
}
