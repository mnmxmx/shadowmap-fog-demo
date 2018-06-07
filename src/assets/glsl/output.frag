uniform float uTick;
uniform vec3 uDirLightPos;

uniform sampler2D shadowMap;
uniform vec2 shadowMapSize;
uniform vec3 uFogColor;

uniform bool isFog;
// uniform bool isHemiLight;
uniform bool isShadowmap;


varying vec3 vPos;
varying vec3 vNormal;

varying vec3 vColor;
varying vec4 vShadowCoord;
varying vec4 FragPosLightSpace;
varying float vFogFactor;


float bias;

float unpackDepth( const in vec4 rgba_depth ) {
  const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0);
    return dot(rgba_depth, bit_shift);
}

float sampleVisibility( vec3 coord ) {
  return step( coord.z, unpackDepth( texture2D( shadowMap, coord.xy ) ) + bias );
}


const float PI = 3.1415926;

const vec3 hemiLight_g = vec3(0.9, 0.9, 0.3);

// hemisphere sky color
const vec3 hemiLight_s_1 = vec3(0.6,0.8,0.9);
const vec3 hemiLight_s_2 = vec3(0.2,0.6,0.9);

const vec3 hemiLightPos_1 = vec3(-100.0, -100.0, 100.0);
const vec3 hemiLightPos_2 = vec3(-100.0, 100.0, -100.0);

// directional light color
const vec3 dirLight_1 = vec3(1.0);


vec3 calcIrradiance_hemi(vec3 newNormal, vec3 lightPos, vec3 grd, vec3 sky){
  float dotNL = clamp(dot(newNormal, normalize(lightPos)), 0.0, 1.0);

  return mix(grd, sky, dotNL);
}

vec3 calcIrradiance_dir(vec3 normal, vec3 lightPos, vec3 light){
  float dotNL = dot(normal, normalize(lightPos));

  return light * max(dotNL, 0.0);
}



void main(){
  // vec3 fdx = dFdx( vPos );
  // vec3 fdy = dFdy( vPos );
  // vec3 n = normalize(cross(fdx, fdy));
  
  vec3 dirColor = vec3(0.0);

  float dirColorRatio = 0.2;
  dirColor += calcIrradiance_dir(vNormal, uDirLightPos, dirLight_1) * dirColorRatio;

  vec3 hemiColor = vec3(0.0);
  hemiColor += calcIrradiance_hemi(vNormal, hemiLightPos_1, hemiLight_g, hemiLight_s_1) * (0.7 - dirColorRatio) * 0.5;
  hemiColor += calcIrradiance_hemi(vNormal, hemiLightPos_2, hemiLight_g, hemiLight_s_2) * (0.7 - dirColorRatio) * 0.5;

  bias = max(0.05 * (1.0 - dot(vNormal, uDirLightPos)), 0.005);  

  float shadow = 0.0;
  vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w;

  float step = 1.0;

  vec2 inc = vec2( step ) / shadowMapSize;

  shadow += sampleVisibility( shadowCoord + vec3(     -inc.x, -inc.y, 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(     0., -inc.y, 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(     inc.x, -inc.y, 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3( -inc.x,     0., 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(     -inc.x, inc.y, 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(     0., inc.y, 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(     inc.x, inc.y, 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(  inc.x,     0., 0. ) );
  shadow += sampleVisibility( shadowCoord + vec3(     0.,      0, 0. ) );
  shadow /= 9.;

  shadow = (isShadowmap) ? shadow : 1.0;


  vec3 _color = vColor * 0.6;
  vec3 ambient = _color;

  vec3 color = (ambient + shadow * dirColor) * (1.0 + hemiColor); 

  float depth = unpackDepth( texture2D( shadowMap, shadowCoord.xy ) );

  // float shadow2 = (shadowCoord.x + shadowCoord.y + shadowCoord.z) / 3.0;
  // color -= shadow2;
  // color += 0.5;

  if(isFog){
    color = mix(uFogColor, color, vFogFactor);

  }

  gl_FragColor = vec4(color, 1.0);
}