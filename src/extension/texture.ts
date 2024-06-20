import {Core} from '..'

export const imageToTexture = (core: Core, image: TexImageSource) => {
  const {gl} = core
  const tex = core.gl.createTexture()!
  if (!tex) throw new Error('failed to create texture')
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return tex
}

export const arrayToTexture = (core: Core, width: number, height:number, array: Float32Array) => {
  const {gl} = core
  const tex = core.gl.createTexture()!
  if (!tex) throw new Error('failed to create texture')
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, array)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return tex
}