import {AttributeType, UniformMethod, WebGLConstants} from '.'

export const uniMethod = {
  bool : ['uniform1i', false, false],
  int  : ['uniform1i', false, false],
  float: ['uniform1f', false, false],
  vec2 : ['uniform2fv', false, true],
  vec3 : ['uniform3fv', false, true],
  vec4 : ['uniform4fv', false, true],
  mat2 : ['uniformMatrix2fv', true, false],
  mat3 : ['uniformMatrix3fv', true, false],
  mat4 : ['uniformMatrix4fv', true, false],
  ivec2: ['uniform2iv', false, true],
  ivec3: ['uniform3iv', false, true],
  ivec4: ['uniform4iv', false, true]
} as const satisfies Record<string, [UniformMethod, isMat: boolean, isArray: boolean]>

export const strideMap = {
  float: 1,
  vec2 : 2,
  vec3 : 3,
  vec4 : 4,
  mat2 : [2, 2],
  mat3 : [3, 3],
  mat4 : [4, 4]
} as const satisfies Record<AttributeType, number | number[]>

export type TextureFilter = 'NEAREST' | 'LINEAR' | 'NEAREST_MIPMAP_NEAREST' | 'NEAREST_MIPMAP_LINEAR' | 'LINEAR_MIPMAP_NEAREST' | 'LINEAR_MIPMAP_LINEAR'
export type TextureWrap = 'REPEAT' | 'MIRRORED_REPEAT' | 'CLAMP_TO_EDGE'

export type TextureType = [WebGLConstants, WebGLConstants, WebGLConstants, TextureFilter, TextureWrap]

export const RGBA8 : TextureType = ['RGBA', 'RGBA', 'UNSIGNED_BYTE', 'LINEAR', 'REPEAT']
export const RGBA16F: TextureType = ['RGBA16F', 'RGBA', 'HALF_FLOAT', 'LINEAR', 'REPEAT']
export const RGBA32F: TextureType = ['RGBA32F', 'RGBA', 'FLOAT', 'LINEAR', 'REPEAT']
export const DEPTH: TextureType = ['DEPTH_COMPONENT32F', 'DEPTH_COMPONENT', 'FLOAT', 'NEAREST', 'REPEAT']

export const defaultExtensions : string[] = [
  'EXT_color_buffer_float',
  'EXT_float_blend',
  'OES_texture_half_float',
  'OES_texture_half_float_linear',
  'OES_texture_float',
  'OES_texture_float_linear',
  'WEBGL_color_buffer_float',
  'WEBGL_depth_texture',
  'MOZ_WEBGL_depth_texture',
  'WEBKIT_WEBGL_depth_texture',
  'WEBGL_multisampled_render_to_texture',
  'WEBGL_draw_buffers'
]