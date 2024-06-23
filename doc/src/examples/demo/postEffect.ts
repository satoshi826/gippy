import {Core, Program, TextureWithInfo, imageToTexture} from 'glaku'
import {BlurPass} from './blur'
import {range} from 'jittoku'

export const postEffect = (
  core: Core,
  rawTexture: TextureWithInfo,
  blurPass: BlurPass,
  depthTexture: TextureWithInfo,
  normalTexture: TextureWithInfo,
  noiseTexture: TextureWithInfo
) => {

  // const SSAOKernel = range(32).map()

  const noiseSize = 4
  const noise = new Float32Array(noiseSize * noiseSize * 3)
  for (let i = 0; i < noiseSize * noiseSize; i++) {
    noise[i * 3 + 0] = Math.random() * 2.0 - 1.0
    noise[i * 3 + 1] = Math.random() * 2.0 - 1.0
    noise[i * 3 + 2] = 0.0
  }
  // const noiseTextureData = imageToTexture(core, noise)

  const program = new Program(core, {
    id            : 'postEffect',
    attributeTypes: {
      a_position    : 'vec3',
      a_textureCoord: 'vec2'
    },
    uniformTypes: {
      u_near   : 'float',
      u_far    : 'float',
      u_pMatrix: 'mat4'

    },
    texture: {
      t_rawTexture   : rawTexture,
      t_blurTexture0 : blurPass.result0,
      t_blurTexture1 : blurPass.result1,
      t_blurTexture2 : blurPass.result2,
      t_depthTexture : depthTexture,
      t_normalTexture: normalTexture,
      t_noiseTexture : noiseTexture
    },
    vert: /* glsl */ `
        out vec2 v_uv;
        void main() {
          v_uv  = a_textureCoord;
          gl_Position = vec4(a_position, 1.0);
        }`,
    frag: /* glsl */`
        in vec2 v_uv;
        out vec4 o_color;

        float convertToLinearDepth(float d, float near, float far){
          return (2.0 * near) / (far + near - d * (far - near));
        }

        float getViewZ(float d, float near, float far) {
          return (near*far) / ((far-near)*d-far);
        }

        vec3 getViewPosition(vec2 screenPosition, float depth, float viewZ) {
          float clipW = u_pMatrix[2][3] * viewZ + u_pMatrix[3][3];
          vec4 clipPosition = vec4((vec3(screenPosition, depth) - 0.5)*2.0, 1.0);
          clipPosition *= clipW;
          return (u_pMatrix * clipPosition).xyz;
        }

        float computeOcclusion(vec3 fragPos, vec3 normal) {
          vec3 randomVec = texture(t_noiseTexture, v_uv * vec2(1.0)).xyz * 2.0 - 1.0;
          vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
          vec3 biTangent = cross(normal, tangent);
          mat3 TBN = mat3(tangent, biTangent, normal);

          float occlusion = 0.0;
          for (int i = 0; i < 64; ++i) {
            vec3 sampleVec = TBN * vec3(1.0);
            sampleVec = fragPos + sampleVec * 0.1; // sample scaling

            vec4 offset = vec4(sampleVec, 1.0);
            offset = u_pMatrix * offset;
            offset.xyz /= offset.w;
            offset.xyz = offset.xyz * 0.5 + 0.5; // transform to [0,1] range

            float sampleDepth = texture(t_depthTexture, offset.xy).r;
            float rangeCheck = smoothstep(0.0, 1.0, 0.1 / abs(fragPos.z - sampleDepth));
            occlusion += (sampleDepth >= sampleVec.z ? 1.0 : 0.0) * rangeCheck;
          }
          return 1.0 - (occlusion / 64.0);
        }

        void main() {

          vec3 raw = texture(t_rawTexture, v_uv).rgb;
          vec3 blur0 = texture(t_blurTexture0, v_uv).rgb;
          vec3 blur1 = texture(t_blurTexture1, v_uv).rgb;
          vec3 blur2 = texture(t_blurTexture2, v_uv).rgb;
          float depth = texture(t_depthTexture, v_uv).x;
          vec3 normal = texture(t_normalTexture, v_uv).rgb;

          float occlusion = 0.0;

          vec3 toneMapRaw = raw / (1.0 + raw);
          float depthLinear = convertToLinearDepth(depth, u_near, u_far);
          vec3 blur = 1.0 * blur0 + 0.5 * blur1 +  0.5 * blur2;

          float viewZ = getViewZ(depth, u_near, u_far);
          vec3 viewPosition = getViewPosition(v_uv, depth, viewZ);

          vec3 bloom = 0.03 * (blur);
          vec3 toneMapBloom = 5.0 * bloom / (1.0 + bloom);
          vec3 result = 1.0 * (toneMapRaw + toneMapBloom);
          vec3 resultFog = (1.3 - depthLinear) * result +  (3.0 * depthLinear) * toneMapBloom;

          o_color = vec4(resultFog, 1.0);
        }`
  })
  return program
}