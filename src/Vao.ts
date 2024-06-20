import {aToO, oForEach} from 'jittoku'
import {AttributeName, Core} from '.'
import {VaoId} from './types'

export class Vao<T extends AttributeName = 'a_'> {
  static idCounter = 0
  id: VaoId
  core: Core
  attributes: Record<AttributeName, number[]>
  index?: number[]
  maxInstance: number
  instancedAttributes: Record<T, {array: Float32Array | null, vbo: WebGLBuffer | null, dirty: boolean}>
  instancedCount: null | number

  constructor(core: Core, {id, attributes, index, instancedAttributes, maxInstance}:
      {id?: VaoId, attributes: Record<AttributeName, number[]>, index?: number[], instancedAttributes?: T[], maxInstance?: number}
  ) {
    this.core = core
    this.id = id ?? String(Vao.idCounter++)
    this.attributes = attributes
    this.index = index

    this.maxInstance = maxInstance ?? 1000
    this.instancedAttributes = aToO(instancedAttributes ?? [], (att) => [att, {array: null, vbo: null, dirty: false}])
    this.instancedCount = null
  }

  setVao() {
    this.core.setVao({
      id        : this.id,
      index     : this.index,
      attributes: this.attributes
    })
  }

  setInstancedValues(instancedValue: Record<T, number[]>) {
    oForEach(instancedValue, (([att, value]) => {
      const strideSize = this.core.getStrideSize(att)
      this.instancedAttributes![att].array ??= new Float32Array(this.maxInstance * strideSize)
      this.instancedCount = value.length / strideSize
      for (let i = 0; i < value.length; i++) {
        this.instancedAttributes![att].array![i] = value[i]
        this.instancedAttributes![att].dirty = true
      }
    }))
  }

  updateInstancedVbo() {
    this.instancedAttributes && oForEach(this.instancedAttributes, ([att, o]) => {
      o.vbo ??= this.core.createInstancedVbo(this.id, att, o.array!)
      if (o.dirty) {
        this.core.updateVbo(this.id, att, o.array!, o.vbo)
        o.dirty = false
      }
    })
  }
}

