import {oForEach, keys, times, isNullish, firstEntry, oReduce} from 'jittoku'
import {ProgramId, RendererId, UniformName, Uniforms, VaoId, WebGLConstants, ResizeArgs, AttributeName, AttributeType, PrimitiveTypes, TextureName} from './types'
import {TextureFilter, TextureWrap, defaultExtensions, strideMap, uniMethod} from './constants'

export class Core {
  gl: WebGL2RenderingContext
  canvasWidth: number
  canvasHeight: number
  pixelRatio: number
  program: Record<ProgramId, WebGLProgram> = {}
  vao: Record<VaoId, WebGLVertexArrayObject & {count?: number}> = {}
  uniLoc: Record<ProgramId, Record<UniformName | TextureName, WebGLUniformLocation>> = {}
  attLoc: Record<AttributeName, number> = {}
  stride: Record<AttributeName, number | number[]> = {}
  texture: Record<string, {data: WebGLTexture, number: number}> = {}
  currentProgram: ProgramId | null = null
  currentVao: VaoId | null = null
  currentRenderer: RendererId | null = null
  uniMethod = uniMethod
  resizeListener: null | (((handler: (arg: ResizeArgs) => void) => void)) = null

  constructor({canvas, pixelRatio = 1, resizeListener, options, extensions = defaultExtensions}:
    {
      canvas: HTMLCanvasElement | OffscreenCanvas,
      pixelRatio?: number,
      resizeListener?: (((handler: (arg: ResizeArgs) => void) => void)),
      options?: WebGLConstants[]
      extensions?: string[]
    }
  ) {
    this.gl = canvas.getContext('webgl2', {antialias: true})!
    this.canvasWidth = this.gl.canvas.width
    this.canvasHeight = this.gl.canvas.height
    this.pixelRatio = pixelRatio
    this.enable(options)
    extensions?.forEach(e => this.gl.getExtension(e))
    if (resizeListener) this.resizeListener = resizeListener
  }

  #compile(txt: string, type: 'VERTEX' | 'FRAGMENT') {
    const shader = this.gl.createShader(this.gl[`${type}_SHADER`])
    if (!shader) throw new Error('createShader failed')
    this.gl.shaderSource(shader, txt)
    this.gl.compileShader(shader)
    if(this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) return shader
    const log = this.gl.getShaderInfoLog(shader)
    console.error(txt)
    throw new Error(log ?? 'compile error')
  }

  #link(vert: WebGLShader, frag: WebGLShader, transformFeedback?: string[]) {
    const program = this.gl.createProgram()
    if (!program) throw new Error('createProgram failed')
    this.gl.attachShader(program, vert)
    this.gl.attachShader(program, frag)
    if (transformFeedback) this.gl.transformFeedbackVaryings(program, transformFeedback, this.gl.SEPARATE_ATTRIBS)
    this.gl.linkProgram(program)
    if(this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) return program
    const log = this.gl.getShaderInfoLog(program)
    console.error(vert)
    console.error(frag)
    throw new Error(log ?? 'link error')
  }

  enable(options?: WebGLConstants[]) {
    options?.forEach(o => this.gl.enable(this.gl[o]))
  }

  disable(options?: WebGLConstants[]) {
    options?.forEach(o => this.gl.disable(this.gl[o]))
  }

  setProgram(id: ProgramId, vText: string, fText: string, transformFeedback?: string[]) {
    const shaderV = this.#compile(vText, 'VERTEX')
    const shaderF = this.#compile(fText, 'FRAGMENT')
    const prg = this.#link(shaderV, shaderF, transformFeedback)
    this.program[id] = prg
  }

  useProgram(id: ProgramId) {
    if (id !== this.currentProgram) {
      this.gl.useProgram(this.program[id])
      this.currentProgram = id
    }
  }

  setAttLoc(attributeTypes: Record<AttributeName, AttributeType>) {
    oForEach(attributeTypes, ([name, type]) => {
      if (isNullish(this.attLoc[name])) {
        this.stride[name] = strideMap[type]
        const nextLoc = oReduce(this.attLoc, (res, [name, loc]) => {
          const locDiff = Array.isArray(this.stride[name]) ? (this.stride[name] as number[])[0] : 1
          return res <= loc ? loc + locDiff : res
        }, 0)
        this.attLoc[name] = nextLoc
      }
    })
  }

  createVbo(data: Float32Array, usage: number = this.gl.STATIC_DRAW) {
    const vbo = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage)
    return vbo
  }

  setVao({id, index, attributes}: {id: VaoId, index?: number[], attributes: Record<AttributeName, number[]>}) {
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)
    oForEach(attributes, ([k, v]) => {
      if (v === undefined || !this.stride[k]) return
      this.createVbo(new Float32Array(v))
      this.enableAttribute(k as AttributeName)
    })
    if(index) {
      const ibo = this.gl.createBuffer()
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo)
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), this.gl.STATIC_DRAW)
    }
    this.gl.bindVertexArray(null)
    if (!vao) throw new Error('createVertexArray failed')
    this.vao[id] = vao
    if(index) {
      this.vao[id].count = index.length
    } else{
      const [attName, values] = firstEntry(attributes)
      const stride = this.getStrideSize(attName)
      this.vao[id].count = values.length / stride
    }
  }

  enableAttribute(att: AttributeName) {
    const stride = this.stride[att]
    if (!stride) throw new Error(`failed to get attribute stride "${att}". Before set Vao, create a target program`)
    const isUnitAtt = typeof stride === 'number'

    const attLoc = this.attLoc[att]
    if (isUnitAtt) {
      this.gl.enableVertexAttribArray(attLoc)
      this.gl.vertexAttribPointer(attLoc, stride, this.gl.FLOAT, false, 0, 0)

    }else{
      const [row, col] = stride
      for (let i = 0; i < row; i++) {
        this.gl.enableVertexAttribArray(attLoc + i)
        this.gl.vertexAttribPointer(attLoc + i, col, this.gl.FLOAT, false, row * col * 4, i * col * 4)
      }
    }
  }

  getStrideSize(att: AttributeName) {
    const stride = this.stride[att]
    const isUnitAtt = typeof stride === 'number'
    return isUnitAtt ? stride : stride[0] * stride[1]
  }

  createInstancedVbo(id: VaoId, att: AttributeName, array: Float32Array) {
    this.useVao(id)
    const stride = this.stride[att]
    const attLoc = this.attLoc[att]
    const isUnitAtt = typeof stride === 'number'
    const vbo = this.createVbo(array, this.gl.DYNAMIC_DRAW)
    if (isUnitAtt) {
      this.gl.vertexAttribDivisor(attLoc, 1)
    }else{
      const [row] = stride
      times(row, (i) => this.gl.vertexAttribDivisor(attLoc + i, 1))
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    if (!vbo) throw new Error('createInstancedVbo failed')
    return vbo
  }

  updateVbo(vaoId: VaoId, att: AttributeName, array: Float32Array, vbo: WebGLBuffer) {
    this.useVao(vaoId)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, array)
    this.enableAttribute(att)
  }

  useVao(vaoId: VaoId) {
    if (vaoId !== this.currentVao) {
      this.gl.bindVertexArray(this.vao[vaoId])
      this.currentVao = vaoId
    }
  }

  setUniLoc(id: ProgramId, uniforms: (UniformName | TextureName) []) {
    this.uniLoc[id] = {}
    uniforms.forEach(uni => {
      const uniLoc = this.gl.getUniformLocation(this.program[id], uni)
      if (!isNullish(uniLoc)) this.uniLoc[id][uni] = uniLoc
    })
  }

  setUniforms(uniforms: Uniforms) {
    oForEach(uniforms, ([k, {type, value, dirty}]) => {
      if(value === null || !dirty) return
      const [method, isMat, isArray] = this.uniMethod[type]
      if (isMat) this.gl[method](this.uniLoc[this.currentProgram!][k], false, value as number[])
      else if (isArray) this.gl[method](this.uniLoc[this.currentProgram!][k], value as number[])
      else this.gl[method](this.uniLoc[this.currentProgram!][k], value as number)
      uniforms[k].dirty = false
    })
  }

  render(primitive: PrimitiveTypes, drawElements: boolean) {
    if (drawElements) this.gl.drawElements(this.gl[primitive], this.vao[this.currentVao!].count!, this.gl.UNSIGNED_SHORT, 0)
    else this.gl.drawArrays(this.gl[primitive], 0, this.vao[this.currentVao!].count!)
  }

  renderInstanced(primitive: PrimitiveTypes, drawElements: boolean, count: number) {
    if (drawElements) this.gl.drawElementsInstanced(this.gl[primitive], this.vao[this.currentVao!].count!, this.gl.UNSIGNED_SHORT, 0, count)
    else this.gl.drawArraysInstanced(this.gl[primitive], 0, this.vao[this.currentVao!].count!, count)
  }

  useRenderer({id, pixelRatio, width, height, frameBuffer, drawBuffers}:
    {id: RendererId, pixelRatio: number, width: number, height: number, frameBuffer: WebGLFramebuffer | null, drawBuffers: number[]}) {
    if (id !== this.currentRenderer) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer)
      this.gl.drawBuffers(drawBuffers)
      this.gl.viewport(0, 0, width * pixelRatio, height * pixelRatio)
      this.currentRenderer = id
    }
  }

  // Todo: 汎用化
  createTexture(
    width: number,
    height: number,
    internalFormat: WebGLConstants,
    format: WebGLConstants,
    type: WebGLConstants,
    filter: TextureFilter,
    wrap: TextureWrap
  ) {
    const texture = this.gl.createTexture()
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[internalFormat], width / 2, height / 2, 0, this.gl[format], this.gl[type], null)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl[filter])
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl[filter])
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl[wrap])
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl[wrap])
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    return texture
  }

  setTexture(key: TextureName, data: WebGLTexture) {
    if(this.texture[key]) {
      this.texture[key] = {...this.texture[key], data}
      return this.texture[key].number
    }
    const textureNum = keys(this.texture).length
    this.texture[key] = {data, number: textureNum}
    return textureNum
  }

  useTexture(key: TextureName) {
    const {data, number} = this.texture[key]
    if (data) {
      const attr = `TEXTURE${number}` as WebGLConstants
      this.gl.activeTexture(this.gl[attr])
      this.gl.bindTexture(this.gl.TEXTURE_2D, data)
    }
  }

}

