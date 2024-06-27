import {ReactElement, useEffect, useRef, useState} from 'react'
import {Template} from '../Template'
import {Box} from '@mui/material'

const Wrapper = ({post, children}: { post: (any: object) => void, children: ReactElement }) => {
  const boxRef = useRef<HTMLDivElement>(null)
  const start = useRef<[x: number, y: number, t: number] | null>(null)
  const points = useRef<[x: number, y: number, t: number][] | null>(null)
  const vel = useRef<[x: number, y: number] | null>(null)
  const lastTimestamp = useRef(performance.now())

  const [initVel, setInitVel] = useState<[x: number, y: number] | null>(null)

  const reset = () => {
    start.current = null
    points.current = null
    vel.current = null
  }

  const tapStart = (clientX: number, clientY: number) => {
    if (vel.current) {
      reset()
      setInitVel(null)
    }
    start.current ??= [clientX, clientY, Date.now()]
    points.current ??= [[0, 0, Date.now()]]
  }

  const drag = (clientX: number, clientY: number) => {
    if (!start.current || !boxRef.current || !points.current) return
    const [startX, startY] = start.current
    const shortSide = Math.min(boxRef.current.clientWidth, boxRef.current.clientHeight)
    const x = ((clientX - startX) / shortSide)
    const y = -((clientY - startY) / shortSide)
    points.current.unshift([x, y, Date.now()])
    const dx = x - points.current[1][0]
    const dy = y - points.current[1][1]
    post({state: {target: [dx, dy]}})
    if (points.current.length > 4) points.current.pop()
  }

  const tapEnd = () => {
    if (!points.current || points.current.length < 4) {
      reset()
      return
    }
    const latestPoints = points.current[0]
    const pastPoints = points.current[3]

    const diffX = latestPoints[0] - pastPoints[0]
    const diffY = latestPoints[1] - pastPoints[1]
    const diffT = latestPoints[2] - pastPoints[2]

    const velX = 0.05 * diffX / (0.01 * diffT)
    const velY = 0.05 * diffY / (0.01 * diffT)
    setInitVel([velX, velY])
    reset()
  }

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = ({clientX, clientY}) => tapStart(clientX, clientY)
  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = ({changedTouches, touches}) => {
    if (touches.length > 1) return
    const touch = changedTouches[0]
    const {clientX, clientY} = touch
    tapStart(clientX, clientY)
  }

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = ({clientX, clientY}) => drag(clientX, clientY)
  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = ({changedTouches, touches}) => {
    if (touches.length > 1) return
    const touch = changedTouches[0]
    const {clientX, clientY} = touch
    drag(clientX, clientY)
  }

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = ({deltaY}) => {
    console.log(deltaY)
  }

  const handleMouseUp: React.MouseEventHandler<HTMLDivElement> = tapEnd
  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = tapEnd
  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => reset()

  const frictionCoff = 0.0005

  useEffect(() => {
    let animationFrameId: number

    function tick() {
      const currentTimestamp = performance.now()
      const deltaTime = (currentTimestamp - lastTimestamp.current) / 1000 // convert ms to s
      lastTimestamp.current = currentTimestamp

      vel.current ??= initVel
      if (!vel.current) return
      const [x, y] = vel.current
      const norm = Math.sqrt(x * x + y * y)
      const frictionX = (frictionCoff * x * deltaTime) / norm
      const frictionY = (frictionCoff * y * deltaTime) / norm
      let nextX = x - frictionX
      let nextY = y - frictionY
      nextX = (Math.abs(nextX) < 0.0001 || nextX * x < 0) ? 0 : nextX
      nextY = (Math.abs(nextY) < 0.0001 || nextY * y < 0) ? 0 : nextY
      vel.current = (nextX === 0 && nextY === 0) ? null : [nextX, nextY]
      if (!vel.current) {
        setInitVel(null)
        return
      }
      post({state: {target: [nextX, nextY]}})
      animationFrameId = requestAnimationFrame(tick)
    }

    if (initVel || vel.current) {
      lastTimestamp.current = performance.now() // 初回実行前に初期化
      animationFrameId = requestAnimationFrame(tick)
    }

    return () => cancelAnimationFrame(animationFrameId)
  }, [initVel, frictionCoff, post])

  return (
    <Box
      ref={boxRef}
      display='flex'
      width='100%'
      height='100%'
      sx={{touchAction: 'none', cursor: 'pointer', userSelect: 'none'}}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {children}
    </Box>
  )
}

export default function Page({name}: { name: string }) {
  return <Template src={name} sendMouse={false} wrapper={Wrapper} />
}