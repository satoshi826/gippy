import {Core, Program, RGBA16F, Renderer, TextureWithInfo, Vao, plane} from 'glaku'

export type BlurPass = ReturnType<typeof getBlurPass>

export const getBlurPass = (core: Core, targetTex : TextureWithInfo) => {

  const basePixelRatio = core.pixelRatio
  const pixelRatios = basePixelRatio < 1.5 ? [1, 0.5, 0.25] : [0.5, 0.25, 0.125]

  const renderers = pixelRatios.map(pixelRatio => [
    new Renderer(core, {frameBuffer: [RGBA16F], pixelRatio}),
    new Renderer(core, {frameBuffer: [RGBA16F], pixelRatio})
  ])

  const blurProgram = blurEffect(core, targetTex)
  const planeVao = new Vao(core, {
    id: 'blurPlane',
    ...plane()
  })


  return {
    render: () => {
      renderers.forEach((renderer, index) => {
        renderer[0].clear()
        renderer[1].clear()
        const preRenderer = index === 0 ? null : renderers[index - 1]
        const baseTex = preRenderer?.[1].renderTexture[0] ?? targetTex
        const invPixelRatio = (preRenderer?.[0].pixelRatio ?? basePixelRatio) / renderer[0].pixelRatio
        blurProgram.setUniform({u_invPixelRatio: invPixelRatio})
        blurProgram.setUniform({u_isHorizontal: 1})
        blurProgram.setTexture({t_preBlurTexture: baseTex})
        renderer[0].render(planeVao, blurProgram)

        blurProgram.setUniform({u_invPixelRatio: 1})
        blurProgram.setUniform({u_isHorizontal: 0})
        blurProgram.setTexture({t_preBlurTexture: renderer[0].renderTexture[0]})
        renderer[1].render(planeVao, blurProgram)
      })
    },
    result0: renderers[0][1].renderTexture[0],
    result1: renderers[1][1].renderTexture[0],
    result2: renderers[2][1].renderTexture[0]
  }
}

export const blurEffect = (core: Core, texture: TextureWithInfo) => new Program(core, {
  id            : 'blurEffect',
  attributeTypes: {
    a_position    : 'vec3',
    a_textureCoord: 'vec2'
  },
  uniformTypes: {
    u_isHorizontal : 'bool',
    u_invPixelRatio: 'int'
  },
  texture: {
    t_preBlurTexture: texture
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

        const float[5] weights = float[](0.2270270, 0.1945945, 0.1216216, 0.0540540, 0.0162162);

        ivec2 clampCoord(ivec2 coord, ivec2 size) {
          return max(min(coord, size - 1), 0);
        }

        void main() {
          int sampleStep = 2 * u_invPixelRatio;

          ivec2 coord =  u_invPixelRatio * ivec2(gl_FragCoord.xy);
          ivec2 size = textureSize(t_preBlurTexture, 0);
          vec3 sum = weights[0] * texelFetch(t_preBlurTexture, coord, 0).rgb;

          ivec2 offsetUnit = u_isHorizontal ? ivec2(1, 0) : ivec2(0, 1);
          ivec2 offset;

          offset = offsetUnit * sampleStep * 1;

          sum += weights[1] * texelFetch(t_preBlurTexture, clampCoord(coord + offset, size), 0).rgb;
          sum += weights[1] * texelFetch(t_preBlurTexture, clampCoord(coord - offset, size), 0).rgb;

          offset = offsetUnit * sampleStep * 2;
          sum += weights[2] * texelFetch(t_preBlurTexture, clampCoord(coord + offset, size), 0).rgb;
          sum += weights[2] * texelFetch(t_preBlurTexture, clampCoord(coord - offset, size), 0).rgb;

          offset = offsetUnit * sampleStep * 3;
          sum += weights[3] * texelFetch(t_preBlurTexture, clampCoord(coord + offset, size), 0).rgb;
          sum += weights[3] * texelFetch(t_preBlurTexture, clampCoord(coord - offset, size), 0).rgb;

          offset = offsetUnit * sampleStep * 4;
          sum += weights[4] * texelFetch(t_preBlurTexture, clampCoord(coord + offset, size), 0).rgb;
          sum += weights[4] * texelFetch(t_preBlurTexture, clampCoord(coord - offset, size), 0).rgb;

          o_color = vec4(sum, 1.0);
        }`
})
