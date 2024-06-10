import {Model} from 'glaku'
import {range, random} from 'jittoku'
import {MAX_HEIGHT, SCALE} from './main'

export const getBuildings = () => {

  const CUBE_NUM_OF_SIDE = 100
  const CUBE_MARGIN = 100 * SCALE
  const AREA_SIZE = CUBE_NUM_OF_SIDE * CUBE_MARGIN

  const rangeCube = range(CUBE_NUM_OF_SIDE)

  const cubeType = rangeCube.reduce((acc, n) => {
    rangeCube.forEach((m) => {
      const x = n * CUBE_MARGIN - AREA_SIZE / 2
      const y = m * CUBE_MARGIN - AREA_SIZE / 2
      // const r = Math.sqrt(x * x + y * y)
      if (random(0, 10) > 7) acc[`${x}_${y}`] = true
      // if (r < 3000 * SCALE && random(0, 10) > 6) acc[`${x}_${y}`] = true
      // else if (r > 4000 * SCALE && random(0, 10) > 3) acc[`${x}_${y}`] = false
    })
    return acc
  }
  , {} as Record<string, boolean>)


  const smallScale = () => [
    random(8 * SCALE, 30 * SCALE),
    random(4 * SCALE, 50 * SCALE),
    random(8 * SCALE, 30 * SCALE)
  ]

  return rangeCube.flatMap((n) =>
    rangeCube.flatMap((m) => {
      const x = n * CUBE_MARGIN - AREA_SIZE / 2
      const y = m * CUBE_MARGIN - AREA_SIZE / 2

      if (n % 10 === 0 || m % 10 === 0)return []

      const isBig = random(0, 10) > 9.9
      const isSmall = cubeType![`${x}_${y}`] === true
      const isVoid = cubeType![`${x}_${y}`] === false
      if (isVoid) return []
      const zScale = random(8 * SCALE, isBig ? (Math.abs(x) + Math.abs(y)) / 8 : MAX_HEIGHT)
      if (isSmall) {
        const scales = range(4).map(smallScale)
        return [
          new Model({
            position: [x, scales[0][1], y],
            scale   : scales[0]
          }),
          new Model({
            position: [x + CUBE_MARGIN / 2, scales[1][1], y],
            scale   : scales[1]
          }),
          new Model({
            position: [x, scales[2][1], y + CUBE_MARGIN / 2],
            scale   : scales[3]
          }),
          new Model({
            position: [x + CUBE_MARGIN / 2, scales[3][2], y + CUBE_MARGIN / 2],
            scale   : scales[3]
          })
        ]
      }
      return new Model({
        position: [x, zScale, y],
        scale   : [
          random(20 * SCALE, isBig ? 160 * SCALE : 40 * SCALE),
          zScale,
          random(20 * SCALE, isBig ? 160 * SCALE : 40 * SCALE)
        ]
      })
    })
  )


}