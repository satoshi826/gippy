
type Attribute = {
  a_position: number[],
  a_normal: number[],
  a_textureCoord: number[],
}

export type Shape = {
  attributes: Attribute,
  index: number[],
}

export const plane = (): Shape => {
  return {
    attributes: {
      a_position: [
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
      ],
      a_normal: [
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0
      ],
      a_textureCoord: [
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
      ]
    },
    index: [
      2, 1, 0,
      1, 2, 3
    ]
  }
}

export const box = (): Shape => {
  return {
    attributes: {
      a_position: [
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, // v0-v1-v2-v3 front
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, // v0-v3-v4-v5 right
        1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1, // v0-v5-v6-v1 top
        -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, // v1-v6-v7-v2 left
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, // v7-v4-v3-v2 bottom
        1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1], // v4-v7-v6-v5 back
      a_normal: [
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, // v0-v1-v2-v3 front
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v3-v4-v5 right
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v5-v6-v1 top
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, // v1-v6-v7-v2 left
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // v7-v4-v3-v2 bottom
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], // v4-v7-v6-v5 back
      a_textureCoord: [
        1, 1, 0, 1, 0, 0, 1, 0, // v0-v1-v2-v3 front
        0, 1, 0, 0, 1, 0, 1, 1, // v0-v3-v4-v5 right
        1, 0, 1, 1, 0, 1, 0, 0, // v0-v5-v6-v1 top
        1, 1, 0, 1, 0, 0, 1, 0, // v1-v6-v7-v2 left
        0, 0, 1, 0, 1, 1, 0, 1, // v7-v4-v3-v2 bottom
        0, 0, 1, 0, 1, 1, 0, 1] // v4-v7-v6-v5 back
    },
    index: [0, 1, 2, 0, 2, 3, // front
      4, 5, 6, 4, 6, 7, // right
      8, 9, 10, 8, 10, 11, // top
      12, 13, 14, 12, 14, 15, // left
      16, 17, 18, 16, 18, 19, // bottom
      20, 21, 22, 20, 22, 23] // back
  }
}

export const sphere = (row: number, column: number, rad: number): Shape => {
  const pos = [], nor = [], idx = [], st = []
  let i, ii, r
  for(i = 0; i <= row; i++) {
    r = Math.PI / row * i
    const ry = Math.cos(r)
    const rr = Math.sin(r)
    for(ii = 0; ii <= column; ii++) {
      const tr = Math.PI * 2 / column * ii
      const tx = rr * rad * Math.cos(tr)
      const ty = ry * rad
      const tz = rr * rad * Math.sin(tr)
      const rx = rr * Math.cos(tr)
      const rz = rr * Math.sin(tr)
      pos.push(tx, ty, tz)
      nor.push(rx, ry, rz)
      st.push(1 - 1 / column * ii, 1 / row * i)
    }
  }
  r = 0
  for(i = 0; i < row; i++) {
    for(ii = 0; ii < column; ii++) {
      r = (column + 1) * i + ii
      idx.push(r, r + 1, r + column + 2)
      idx.push(r, r + column + 2, r + column + 1)
    }
  }
  return {
    attributes: {
      a_position    : pos,
      a_normal      : nor,
      a_textureCoord: st
    },
    index: idx
  }
}