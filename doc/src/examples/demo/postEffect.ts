import {Core, Program, TextureWithInfo} from 'glaku'
import {BlurPass} from './blur'

export const postEffect = (
  core: Core,
  rawTexture: TextureWithInfo,
  blurPass: BlurPass,
  depthTexture: TextureWithInfo,
  normalTexture: TextureWithInfo
) => {
  const program = new Program(core, {
    id            : 'postEffect',
    attributeTypes: {
      a_position    : 'vec3',
      a_textureCoord: 'vec2'
    },
    uniformTypes: {
      u_near: 'float',
      u_far : 'float'
    },
    texture: {
      t_rawTexture   : rawTexture,
      t_blurTexture0 : blurPass.result0,
      t_blurTexture1 : blurPass.result1,
      t_blurTexture2 : blurPass.result2,
      t_depthTexture : depthTexture,
      t_normalTexture: normalTexture
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

        void main() {

          vec3 raw = texture(t_rawTexture, v_uv).rgb;
          vec3 blur0 = texture(t_blurTexture0, v_uv).rgb;
          vec3 blur1 = texture(t_blurTexture1, v_uv).rgb;
          vec3 blur2 = texture(t_blurTexture2, v_uv).rgb;
          float depth = texture(t_depthTexture, v_uv).x;

          vec3 toneMapRaw = raw / (1.0 + raw);
          float depthLinear = convertToLinearDepth(depth, u_near, u_far);
          vec3 blur = 1.0 * blur0 + 0.75 * blur1 +  0.25 * blur2;

          vec3 bloom = 0.02 * (blur);
          vec3 toneMapBloom = 6.0 * bloom / (1.0 + bloom);
          vec3 result = 1.0 * (toneMapRaw + toneMapBloom);
          vec3 resultFog = (1.5 - depthLinear) * result +  (3.5 * depthLinear) * toneMapBloom;

          o_color = vec4(resultFog, 1.0);
        }`
  })
  return program
}