import {Matrix, Vector, create, lookAt, multiply, perspective, rotate, translate, scale as mScale, identity} from './matrix'

export class Camera {
  matrix: {
    v: Matrix
    p: Matrix
    vp: Matrix
  }
  position: Vector
  lookAt: Vector
  up: Vector
  fov: number
  near: number
  far: number
  aspect: number
  constructor({
    position = [0, 0, 10],
    lookAt = [0, 0, 0],
    up = [0, 1, 0],
    fov = 60,
    near = 0.1,
    far = 100,
    aspect = 1
  }: {
    position?: Vector
    lookAt?: Vector
    up?: Vector
    fov?: number
    near?: number
    far?: number
    aspect?: number
  }) {
    this.matrix = {
      v : create(),
      p : create(),
      vp: create()
    }
    this.position = position
    this.lookAt = lookAt
    this.up = up
    this.fov = fov
    this.near = near
    this.far = far
    this.aspect = aspect
    this.update()
  }

  update() {
    lookAt(this.position, this.lookAt, this.up, this.matrix.v)
    perspective(this.fov, this.aspect, this.near, this.far, this.matrix.p)
    multiply(this.matrix.p, this.matrix.v, this.matrix.vp)
  }
}

//----------------------------------------------------------------

type Rotation = {
  angle: number
  axis: Vector
}

export class Model {
  matrix: {
    m: Matrix,
  }
  position?: Vector
  rotation: Rotation
  scale?: Vector
  constructor({position, rotation = {angle: 0, axis: [0, 1, 0]}, scale}: {position?: Vector, rotation?: Rotation, scale?: Vector}) {
    this.matrix = {
      m: create()
    }
    this.position = position
    this.rotation = rotation
    this.scale = scale
    this.update()
  }

  update() {
    const {position, rotation: {angle, axis}, scale} = this
    identity(this.matrix.m)
    if (position) translate(this.matrix.m, position, this.matrix.m)
    if (angle) rotate(this.matrix.m, angle, axis, this.matrix.m)
    if (scale) mScale(this.matrix.m, scale, this.matrix.m)
  }
}
