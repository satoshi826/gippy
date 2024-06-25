import {setState} from 'glaku'

export const srcRecord = {
  helloTriangle: () => import('./examples/helloTriangle/main'),
  attributes   : () => import('./examples/attributes/main'),
  uniforms     : () => import('./examples/uniforms/main'),
  animation    : () => import('./examples/animation/main'),
  resize       : () => import('./examples/resize/main'),
  texture      : () => import('./examples/texture/main'),
  frameBuffer  : () => import('./examples/frameBuffer/main'),
  '3d'         : () => import('./examples/3d/main'),
  instancing   : () => import('./examples/instancing/main'),
  gpgpu        : () => import('./examples/gpgpu/main'),
  demo         : () => import('./examples/demo/main')
} as const

type SrcType = keyof typeof srcRecord

console.log('starting worker')

let canvas: OffscreenCanvas | null = null
let pr: number = 1

onmessage = async({data}) => {
  const {canvas : offscreenCanvas, pixelRatio, src, state} = data
  if (offscreenCanvas) canvas = offscreenCanvas as OffscreenCanvas
  if (pixelRatio) pr = pixelRatio
  if (src) {
    const {main} = await srcRecord[src as SrcType]()
    main(canvas!, pr)
  }
  if (state) setState(state)
}

export default {}
