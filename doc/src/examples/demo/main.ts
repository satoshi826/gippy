import {Camera, Loop, Model, Vao, box, setHandler, plane, RGBA32F, Core, Renderer} from 'glaku'
import {prepass} from './prepass'
import {shade} from './shading'
import {postEffect} from './postEffect'
import {getBlurPass} from './blur'
import {getBuildings} from './buildings'

export const SCALE = 0.2
export const MAX_HEIGHT = 120 * SCALE

//----------------------------------------------------------------

export const main = async(canvas: HTMLCanvasElement | OffscreenCanvas, pixelRatio: number) => {

  const [buildings, lightCubes] = getBuildings()
  const CUBE_NUM = buildings.length
  const LIGHT_CUBE_NUM = lightCubes.length

  const floor = new Model({
    scale   : [10000 * SCALE, 10000 * SCALE, 10000 * SCALE],
    position: [0, 0, 0],
    rotation: {axis: [1, 0, 0], angle: -Math.PI / 2}
  })

  console.log(buildings.length)

  const lightPos = lightCubes.flatMap(({position}) => position ?? [])

  const camera = new Camera({
    lookAt  : [0, -200 * SCALE, 0],
    position: [0, 200 * SCALE, 0],
    near    : 150 * SCALE,
    far     : 12000 * SCALE,
    fov     : 60
  })

  const core = new Core({
    canvas,
    pixelRatio,
    resizeListener: (fn) => setHandler('resize', fn),
    options       : ['DEPTH_TEST', 'CULL_FACE']
  })

  const preRenderer = new Renderer(core, {frameBuffer: [RGBA32F, RGBA32F, RGBA32F]})
  const shadeRenderer = new Renderer(core, {frameBuffer: [RGBA32F]})
  const renderer = new Renderer(core, {backgroundColor: [0.08, 0.14, 0.2, 1.0]})

  const planeVao = new Vao(core, {id: 'plane', ...plane()})

  const cubeVao = new Vao(core, {
    id                 : 'cube',
    ...box(),
    instancedAttributes: ['a_mMatrix'],
    maxInstance        : CUBE_NUM
  })

  const lightCubeVao = new Vao(core, {
    id                 : 'lightCube',
    ...box(),
    instancedAttributes: ['a_mMatrix'],
    maxInstance        : LIGHT_CUBE_NUM
  })

  const floorVao = new Vao(core, {
    id                 : 'plane',
    ...plane(),
    instancedAttributes: ['a_mMatrix'],
    maxInstance        : 1
  })

  const prepassProgram = prepass(core)
  cubeVao.setInstancedValues({a_mMatrix: buildings.flatMap(({matrix: {m}}) => m)})
  lightCubeVao.setInstancedValues({a_mMatrix: lightCubes.flatMap(({matrix: {m}}) => m)})
  floorVao.setInstancedValues({a_mMatrix: floor.matrix.m})

  const shadeProgram = shade(core, LIGHT_CUBE_NUM, preRenderer)
  shadeProgram.setUniform({u_lightPosition: lightPos})

  const blurPass = getBlurPass(core, shadeRenderer.renderTexture[0])
  const postEffectProgram = postEffect(core, shadeRenderer.renderTexture[0], blurPass)

  const animation = new Loop({callback: ({elapsed}) => {

    [preRenderer, shadeRenderer, renderer].forEach(r => r.clear())

    camera.position = [4000 * Math.cos(elapsed / 6000) * SCALE, 850 * SCALE, 4000 * Math.sin(elapsed / 6000) * SCALE]
    camera.update()

    // set Camera and view-projection-matrix
    prepassProgram.setUniform({u_vpMatrix: camera.matrix.vp})
    shadeProgram.setUniform({u_cameraPosition: camera.position})

    // render buildings
    prepassProgram.setUniform({u_material_type: 0})
    preRenderer.render(floorVao, prepassProgram)
    prepassProgram.setUniform({u_material_type: 1})
    preRenderer.render(cubeVao, prepassProgram)
    prepassProgram.setUniform({u_material_type: 2})
    preRenderer.render(lightCubeVao, prepassProgram)

    shadeRenderer.render(planeVao, shadeProgram)
    blurPass.render()

    renderer.render(planeVao, postEffectProgram)


  }, interval: 0})
  animation.start()

  setHandler('resize', ({width, height}: {width: number, height: number} = {width: 100, height: 100}) => {
    camera.aspect = width / height
  })

}

//----------------------------------------------------------------