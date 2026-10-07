uniform sampler2D hairMask, rootsMask, tipsMask, bodyMask, clothesMask, faceMask;
uniform float uTime, uWind, uClothWind, uTurbulence, uFrequency, uRootLock, uTip, uBreath, uIdle;
varying vec2 vUv;
float noise(float x) { return sin(x * .79 + sin(x * .43)) * .65 + sin(x * 1.91 + 2.) * .35; }
float coverage(vec4 mask) { return mask.r * mask.a; }
void main() {
 vUv=uv; vec3 p=position;
 float face=coverage(texture2D(faceMask,uv));
 float hair=coverage(texture2D(hairMask,uv));
 float root=coverage(texture2D(rootsMask,uv));
 float tip=coverage(texture2D(tipsMask,uv));
 float weight=smoothstep(.33,.58,1.-uv.y);
 weight=mix(weight,1.,tip*.75)*uTip*(1.-root*uRootLock);
 float t=uTime*uFrequency-weight*.7;
 // Independent phases let the side locks bend and settle.
 float organic=.22+sin(t*1.7+uv.x*23.+uv.y*7.)*.72
   +noise(t*.9+uv.x*13.)*.3
   +sin(t*4.1+uv.x*49.)*.15*uTurbulence;
 float hairWeight=hair*weight*(1.-face);
 p.x+=hairWeight*uWind*organic;
 p.y+=hairWeight*abs(uWind)*noise(t*.9+uv.x*19.)*.18;
 float body=coverage(texture2D(bodyMask,uv))*(1.-face)*(1.-hair);
 float clothes=coverage(texture2D(clothesMask,uv))*(1.-face)*(1.-hair);
 float chest=exp(-pow((uv.y-.29)*6.,2.));
 p.y+=body*chest*uBreath;
 p.x+=clothes*uClothWind*.15*noise(uTime*.5+uv.y*9.);
 p.y+=body*uIdle*(sin(uTime*.37)+sin(uTime*.17)*.3)*.45;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}
