import {AttributeName, AttributeType, Core, PrimitiveTypes, TextureName} from '.'
import {keys, oMapO, oForEach, oReduce, PartialRecord} from 'jittoku'
import {ProgramId, UniformName, UniformType} from './types'

export type AttributeTypes = Record<AttributeName, AttributeType>

type UniformTypeWithArray = UniformType | `${UniformType}[${number}]`

export const testKeyword = (target: string, key: string) => new RegExp(`[-=+*/(\\s,]${key}[-=+*/).,;\\s\\[]`).test(target)

export class Program<T extends UniformName, K extends TextureName> {
  core: Core
  id: ProgramId
  vert: string
  frag: string
  uniforms: Record<T | K, {type: UniformTypeWithArray, value: null | number | number [], dirty: boolean}>
  texture: K[]
  primitive: PrimitiveTypes
  constructor(core: Core, {
    id, attributeTypes, uniformTypes = {} as Record<T, UniformTypeWithArray>,
    frag, vert, texture = {} as Record<K, WebGLTexture>, primitive = 'TRIANGLES'
  }:
    {
      id: ProgramId, attributeTypes: AttributeTypes, uniformTypes?: Record<T, UniformTypeWithArray>,
      frag: string, vert: string, texture?: Record<K, WebGLTexture>, primitive?: PrimitiveTypes
    }) {
    this.core = core
    this.id = id
    this.vert = vert
    this.frag = frag
    this.uniforms = oMapO(uniformTypes, ([key, type]) =>
      [key, {type: type.replace(/\[\d+\]$/, ''), value: null, dirty: false}]) as Record<T | K, {type: UniformTypeWithArray, value: null, dirty: false}>
    this.texture = []
    this.primitive = primitive

    this.core.setAttLoc(attributeTypes)
    const parsed = this.#parseShader({vert, frag, attributeTypes, uniformTypes, texture})

    if(texture) this.setTexture(texture)

    if (!core.program[this.id]) {
      this.core.setProgram(this.id, parsed.vert, parsed.frag)
      this.core.setUniLoc(this.id, keys(this.uniforms))
    }
  }

  setUniform(uniformValues: PartialRecord<T, number | number[]>) {
    oForEach(uniformValues as Record<T, number | number[]>, ([k, v]) => {
      this.uniforms[k].value = v
      this.uniforms[k].dirty = true
    })
  }

  setTexture(texture: Record<K, WebGLTexture>) {
    oForEach(texture, (([name, data], i) => {
      const textureNum = this.core.setTexture(name, data)
      this.uniforms[name] = {type: 'int', value: textureNum, dirty: true}
      this.texture[i] = name
    }))
  }

  #parseShader({vert, frag, attributeTypes, uniformTypes, texture}: {
    vert: string, frag: string,
    attributeTypes: AttributeTypes, uniformTypes: Record<T, UniformTypeWithArray>, texture: Record<K, WebGLTexture>
  }) {
    const uniformKeys = new Set(keys(uniformTypes))
    const textureKeys = new Set(keys(texture))
    const testVert = (key: T) => testKeyword(vert, key)
    const testFrag = (key: T | K) => testKeyword(frag, key)
    const parseUniformArray = (name: T, type: UniformTypeWithArray) => {
      const match = type.match(/([a-zA-Z0-9]+)(\[\d+\])/)
      return (match?.[0] ? [name + match[2], match[1]] : [name, type]) as [T, UniformTypeWithArray]
    }

    let fullVert = oReduce(uniformTypes,
      (result, [name, type]) => {
        [name, type] = parseUniformArray(name, type)
        const res = testVert(name)
        if (res) uniformKeys.delete(name)
        return result + (res ? `uniform ${type} ${name};\n` : '')
      },
      '#version 300 es\n'
    )
    fullVert = oReduce(attributeTypes,
      (result, [name, type]) =>
        result +
      `layout(location = ${this.core.attLoc[name]}) in ${type} ${name};\n`, fullVert) + this.vert

    let fullFrag = oReduce(uniformTypes,
      (result, [name, type]) => {
        const [nameArray, typeArray] = parseUniformArray(name, type)
        const res = testFrag(name)
        if (res) uniformKeys.delete(name)
        return result + (res ? `uniform ${typeArray} ${nameArray};\n` : '')
      },
      '#version 300 es\nprecision highp float;\n'
    )
    fullFrag = oReduce(texture,
      (result, [name]) => {
        const res = testFrag(name)
        if (res) textureKeys.delete(name)
        return result + (res ? `uniform sampler2D ${name};\n` : '')
      },
      fullFrag
    ) + this.frag

    if(uniformKeys.size) console.warn(`--- programId: ${this.id} --- unused uniform keys : ${ [...uniformKeys.values()].join(', ')}`)
    return {vert: fullVert, frag: fullFrag}
  }

}
