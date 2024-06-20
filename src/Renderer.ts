import {partition} from 'jittoku'
import {AttributeName, Core, TextureName, TextureType, UniformName} from '.'
import {Program} from './Program'
import {Vao} from './Vao'
import {ColorArray, WebGLConstants, ResizeArgs} from './types'

export type TextureWithInfo = (WebGLTexture & {
  internalFormat: WebGLConstants, format: WebGLConstants, type: WebGLConstants
})

export class Renderer {
  static idCounter = 0
  id: number
  core: Core
  pixelRatio: number
  width: number
  height: number
  resizeQueue: ResizeArgs | null
  backgroundColor: ColorArray
  isCanvas: boolean
  frameBuffer: WebGLFramebuffer | null
  depthRenderBuffer: WebGLRenderbuffer | null
  renderTexture: TextureWithInfo[]
  depthTexture: TextureWithInfo | null
  drawBuffers: number[]
  screenFit: boolean

  constructor(core: Core, {height, width, backgroundColor, frameBuffer, pixelRatio, screenFit = true}: {
    height?: number, width?: number, backgroundColor?: ColorArray, frameBuffer?: TextureType[], pixelRatio?: number, screenFit?: boolean
  } = {}) {
    this.id = Renderer.idCounter++
    this.core = core
    this.pixelRatio = this.core.pixelRatio * (pixelRatio ?? 1)
    this.width = width ?? core.canvasWidth
    this.height = height ?? core.canvasHeight
    this.resizeQueue = null
    this.backgroundColor = backgroundColor ?? [0, 0, 0, 1]
    this.isCanvas = !frameBuffer
    this.frameBuffer = null
    this.depthRenderBuffer = null
    this.renderTexture = []
    this.depthTexture = null
    this.drawBuffers = [this.core.gl.BACK]
    this.screenFit = screenFit

    if (frameBuffer) this.#setFrameBuffer(frameBuffer)
    if (screenFit) this.core.resizeListener?.((args) => this.resizeQueue = args)
    this.resize()
  }

  resize({width = this.width, height = this.height, pixelRatio = this.pixelRatio}: ResizeArgs = {}) {
    const gl = this.core.gl
    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio
    gl.viewport(0, 0, width * pixelRatio, height * pixelRatio)
    if(this.isCanvas) {
      gl.canvas.width = width * pixelRatio
      gl.canvas.height = height * pixelRatio
    }else {
      if(!this.depthTexture) gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRenderBuffer)
      this.renderTexture.forEach((renderTexture) => {
        this.#bindTexture(renderTexture)
        if(!this.depthTexture) gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT32F, width * pixelRatio, height * pixelRatio)
      })
      if (this.depthTexture) this.#bindTexture(this.depthTexture)
      gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    }
    this.resizeQueue = null
  }

  clear() {
    this.core.useRenderer(this)
    this.core.gl.clearColor(...this.backgroundColor)
    this.core.gl.clearDepth(1.0)
    this.core.gl.clear(this.core.gl.COLOR_BUFFER_BIT | this.core.gl.DEPTH_BUFFER_BIT)
  }

  #beforeRender<U extends UniformName, T extends TextureName, K extends AttributeName>(
    vao: Vao<K>,
    program: Program<U, T>
  ) {
    if (this.resizeQueue) this.resize(this.resizeQueue)
    if (!this.core.vao[vao.id]) vao.setVao()
    vao.updateInstancedVbo()
    this.core.useVao(vao.id)
    this.core.useRenderer(this)
    this.core.useProgram(program.id)
    this.core.setUniforms(program.uniforms)
    if (program.texture.length) program.texture.forEach((tex) => this.core.useTexture(tex))
  }

  render<U extends UniformName, T extends TextureName, K extends AttributeName>(vao: Vao<K>, program: Program<U, T>) {
    this.#beforeRender(vao, program)
    if (vao.instancedCount) {
      this.core.renderInstanced(program.primitive, !!vao?.index, vao.instancedCount)
      return
    }
    this.core.render(program.primitive, !!vao?.index)
  }

  #setFrameBuffer(textures: TextureType[]) {
    const gl = this.core.gl

    this.frameBuffer = gl.createFramebuffer()
    if (!this.frameBuffer) throw new Error('Could not create frameBuffer')
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)

    const [colorTextures, [depthTexture]] = partition(textures, (([, format]) => format !== 'DEPTH_COMPONENT'))
    colorTextures.forEach(([internalFormat, format, type, filter, wrap], i) => {
      const attachment = gl.COLOR_ATTACHMENT0 + i
      this.renderTexture[i] = this.#createTexture(attachment, this.width, this.height, internalFormat, format, type, filter, wrap)
      this.drawBuffers[i] = attachment
    })

    if (depthTexture) {
      const [internalFormat, format, type, filter, wrap] = depthTexture
      this.depthTexture = this.#createTexture(this.core.gl.DEPTH_ATTACHMENT, this.width, this.height, internalFormat, format, type, filter, wrap)
    } else {
      this.depthRenderBuffer = this.core.gl.createRenderbuffer()
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRenderBuffer)
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height)
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthRenderBuffer)
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  #bindTexture(texture : TextureWithInfo) {
    const {internalFormat, format, type} = texture
    const gl = this.core.gl
    const {width, height, pixelRatio} = this
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl[internalFormat], width * pixelRatio, height * pixelRatio, 0, gl[format], gl[type], null)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  #createTexture(attachment: number, ...[width, height, internalFormat, format, type, filter, wrap]: Parameters<Core['createTexture']>) {
    const texture = this.core.createTexture(width, height, internalFormat, format, type, filter, wrap) as TextureWithInfo
    if (!texture) throw new Error('Could create depth texture')
    this.core.gl.framebufferTexture2D(this.core.gl.FRAMEBUFFER, attachment, this.core.gl.TEXTURE_2D, texture, 0)
    texture.internalFormat = internalFormat
    texture.format = format
    texture.type = type
    return texture
  }

}