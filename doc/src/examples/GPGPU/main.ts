import {Core, GPGPU, Loop, Program, Renderer, ResizeArgs, calcAspectRatioVec, setHandler} from 'glaku'
import {random, range} from 'jittoku'

const PARTICLE_NUM = 500000
const PARTICLE_RANGE = range(PARTICLE_NUM)

export const main = (canvas: HTMLCanvasElement | OffscreenCanvas, pixelRatio: number) => {

  const core = new Core({canvas, pixelRatio, resizeListener: (fn) => setHandler('resize', fn)})
  const renderer = new Renderer(core, {backgroundColor: [0, 0, 0, 1]})

  const gpgpu = new GPGPU(core, {
    id            : 'particle',
    attributeTypes: {
      a_pos : 'vec3',
      a_vel : 'vec3',
      a_mass: 'float'
    },
    attributes: {
      a_pos : PARTICLE_RANGE.flatMap(() => [random(-.5, .5), random(-.5, .5), random(-.5, .5)]),
      a_vel : PARTICLE_RANGE.flatMap(() => [random(-.00001, .00001), random(-.00001, .00001), random(-.00001, .00001)]),
      a_mass: PARTICLE_RANGE.flatMap(() => random(5000, 50000))
    },
    uniformTypes: {
      u_origin     : 'vec2',
      u_aspectRatio: 'vec2',
      u_delta      : 'float',
      u_unix       : 'float'
    },
    vert: /* glsl */ `
      void main() {
      a_tf_pos = a_pos + (a_vel * u_delta);
      vec2 diff = (u_origin-a_pos.xy)*u_aspectRatio;
      float len = length(diff);
      vec3 acc  = (vec3(normalize(diff), 0.02*sin(u_unix/10.))) * (len > .2 ? 1. : 0.);
      a_tf_vel = (a_vel + (acc * u_delta * .1 / a_mass));
      a_tf_vel = a_tf_vel*.99;
      a_tf_mass = a_mass;
    }`
  }
  )

  const program = new Program(core, {
    id            : 'renderer',
    primitive     : 'POINTS',
    attributeTypes: gpgpu.attributeTypes,
    vert          : /* glsl */`
    out float mass;
    out float vel;
    void main() {
      mass = a_mass;
      vel = length(a_vel);
      gl_Position = vec4(a_pos, 1.0);
      gl_PointSize = 1.0;
    }`,
    frag: /* glsl */`
    vec3 hsl2rgb( in vec3 c ){
      vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
    }
    out vec4 fragColor;
    in float mass;
    in float vel;
    void main() {
      float h = 1.-mass/50000.;
      float s = 1.;
      float l = 1.-smoothstep(0.2, 1., 40.*vel+.5);
      vec3 rainbow = hsl2rgb(vec3(h,s,l));
      fragColor = vec4(rainbow,1.);
    }`
  })

  setHandler('resize', ({width, height}: ResizeArgs = {}) => {
    const ar = width && height ? calcAspectRatioVec(width, height) : [1, 1]
    gpgpu.setUniform({u_aspectRatio: ar})
  })

  setHandler('mouse', ({x, y}: {x: number, y: number} = {x: 0, y: 0}) => {
    gpgpu.setUniform({u_origin: [x, y]})
  })

  const animation = new Loop({callback: ({delta, elapsed}) => {
    renderer.clear()
    gpgpu.setUniform({u_delta: delta, u_unix: elapsed})
    gpgpu.run()
    renderer.render(gpgpu.vao, program)
  }})

  animation.start()
}

