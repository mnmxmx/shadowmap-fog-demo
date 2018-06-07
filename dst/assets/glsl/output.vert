#define GLSLIFY 1
// #pragma glslify: snoise = require("./noise2D")
attribute float aNum;
attribute vec3 aColor;

uniform sampler2D posMap;
uniform sampler2D velMap;
uniform float uSize;

uniform float uRange;

uniform float uTick;
uniform float uTileWidth;
// uniform mat4 biasMatrix;
uniform mat4 shadowP;
uniform mat4 shadowV;
uniform vec3 uDirLightPos;

uniform vec3 uEyePosition;
uniform float uFogStart;
uniform float uFogEnd;

varying vec3 vColor;
varying vec3 vNormal;

varying vec3 vPos;
varying vec4 vShadowCoord;
varying float vFogFactor;

const float PI = 3.1415926;

const float fogNear = 0.1;
const float fogFar  = 2000.0;
const float fogLinerDepth = 1.0 / (fogFar - fogNear);

const mat4 biasMatrix = mat4(
  0.5, 0.0, 0.0, 0.0,
  0.0, 0.5, 0.0, 0.0,
  0.0, 0.0, 0.5, 0.0,
  0.5, 0.5, 0.5, 1.0
);

mat2 calcRotate2D(float _deg){
  float _sin = sin(_deg);
  float _cos = cos(_deg);
  return mat2(_cos, _sin, -_sin, _cos);
}

float parabola( float x) {
  return 4.0 * (1.0 - x) * x;
}

mat3 calcLookAtMatrix(vec3 vector, float roll) {
  vec3 rr = vec3(sin(roll), cos(roll), 0.0);
  vec3 ww = normalize(vector);
  vec3 uu = normalize(cross(ww, rr));
  vec3 vv = normalize(cross(uu, ww));

  return mat3(uu, ww, vv);
}

void main(){

  vec2 posUv;
  posUv.x = mod(aNum + 0.5, uSize);
  posUv.y = float((aNum + 0.5) / uSize);
  posUv /= vec2(uSize);

  vec4 cubePosition = texture2D( posMap, posUv );
  vec4 cubeVelocity = texture2D( velMap, posUv );

  cubePosition.xyz *= uRange;
  cubeVelocity.xyz *= uRange;

  float alpha = cubeVelocity.a / 100.0;
  float scale = parabola( alpha);

  vec3 pos = position * scale;
  pos.zy = calcRotate2D(PI / 2.0) * pos.zy;

  mat4 localRotationMat = mat4( calcLookAtMatrix( cubeVelocity.xyz, 0.0 ) );

  vec3 modifiedVertex =  (localRotationMat * vec4( pos, 1.0 ) ).xyz;
  vec3 modifiedPosition = modifiedVertex + cubePosition.xyz;

  vec4 worldPosition = modelMatrix * vec4(modifiedPosition, 1.0);
  

	gl_Position = projectionMatrix * viewMatrix * worldPosition; 

  vPos = worldPosition.xyz;
  vColor = aColor;

  vNormal = normal;
  vNormal.zy = calcRotate2D(PI / 2.0) * vNormal.zy;
  vNormal = (localRotationMat * vec4(vNormal, 1.0)).xyz;

  float fogLinerPos = length(uEyePosition - modifiedPosition) * fogLinerDepth;
  vFogFactor = clamp((uFogEnd - fogLinerPos) / (uFogEnd - uFogStart), 0.0, 1.0);

  vShadowCoord = biasMatrix * shadowP * shadowV * worldPosition;
}