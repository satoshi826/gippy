import {Camera, Loop, Model, Vao, box, setHandler, plane, Core, Renderer, DEPTH, RGBA16F, sphere} from 'glaku'
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
    scale   : [7000 * SCALE, 7000 * SCALE, 1],
    position: [0, 0, 0],
    rotation: {axis: [1, 0, 0], angle: -Math.PI / 2}
  })

  const sky = new Model({
    scale   : [8000 * SCALE, 8000 * SCALE, 8000 * SCALE],
    position: [0, 0, 0]
  })

  const lightPos = lightCubes.flatMap(({position}) => position ?? [])

  const cameraR = 5500
  let cameraAngleH = Math.PI / 4
  let cameraAngleV = Math.PI / 12

  const calcCameraPosition = () => {
    const v = cameraR * Math.sin(cameraAngleV) * SCALE
    const h = cameraR * Math.cos(cameraAngleV) * SCALE
    return [h * Math.cos(cameraAngleH), v, h * Math.sin(cameraAngleH)]
  }

  const camera = new Camera({
    lookAt  : [0, 50, 0],
    position: calcCameraPosition(),
    near    : 10 * SCALE,
    far     : 12000 * SCALE,
    fov     : 60
  })

  const core = new Core({
    canvas,
    pixelRatio,
    resizeListener: (fn) => setHandler('resize', fn),
    options       : ['DEPTH_TEST', 'CULL_FACE']
  })

  const preRenderer = new Renderer(core, {frameBuffer: [RGBA16F, RGBA16F, RGBA16F, DEPTH]})
  const shadeRenderer = new Renderer(core, {frameBuffer: [RGBA16F]})
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

  const skyVao = new Vao(core, {
    id                 : 'sphere',
    ...sphere(20, 20, 1.0),
    instancedAttributes: ['a_mMatrix'],
    maxInstance        : 1
  })

  const prepassProgram = prepass(core)
  cubeVao.setInstancedValues({a_mMatrix: buildings.flatMap(({matrix: {m}}) => m)})
  lightCubeVao.setInstancedValues({a_mMatrix: lightCubes.flatMap(({matrix: {m}}) => m)})
  floorVao.setInstancedValues({a_mMatrix: floor.matrix.m})
  skyVao.setInstancedValues({a_mMatrix: sky.matrix.m})

  const shadeProgram = shade(core, LIGHT_CUBE_NUM, preRenderer)
  shadeProgram.setUniform({u_lightPosition: lightPos})

  const blurPass = getBlurPass(core, shadeRenderer.renderTexture[0])
  const postEffectProgram = postEffect(core,
    shadeRenderer.renderTexture[0], blurPass, preRenderer.depthTexture!, preRenderer.renderTexture[1]
  )

  postEffectProgram.setUniform({
    u_near: camera.near,
    u_far : camera.far
  })

  const animation = new Loop({callback: ({elapsed}) => {

    [preRenderer, shadeRenderer, renderer].forEach(r => r.clear())

    // camera.position = [4000 * Math.cos(elapsed / 6000) * SCALE, 850 * SCALE, 4000 * Math.sin(elapsed / 6000) * SCALE]
    camera.update()

    // set Camera and view-projection-matrix
    prepassProgram.setUniform({u_vpMatrix: camera.matrix.vp})
    shadeProgram.setUniform({u_cameraPosition: camera.position})

    // render buildings
    prepassProgram.setUniform({u_material_type: 0})
    preRenderer.render(floorVao, prepassProgram)

    prepassProgram.setUniform({u_material_type: 1})
    core.gl.frontFace(core.gl.CW)
    preRenderer.render(skyVao, prepassProgram)
    core.gl.frontFace(core.gl.CCW)

    prepassProgram.setUniform({u_material_type: 2})
    preRenderer.render(cubeVao, prepassProgram)

    prepassProgram.setUniform({u_material_type: 3})
    preRenderer.render(lightCubeVao, prepassProgram)

    shadeRenderer.render(planeVao, shadeProgram)
    blurPass.render()

    renderer.render(planeVao, postEffectProgram)
  }, interval: 0})
  animation.start()

  setHandler('resize', ({width, height}: {width: number, height: number} = {width: 100, height: 100}) => {
    camera.aspect = width / height
  })

  setHandler('target', ([x, y]) => {
    cameraAngleH += 0.5 * x
    cameraAngleV -= 0.4 * y
    camera.position = calcCameraPosition()
    camera.update()
  })

}

//----------------------------------------------------------------