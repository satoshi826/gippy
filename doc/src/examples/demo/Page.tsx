// import {useEffect} from 'react'
import {ReactElement, useEffect, useRef, useState} from 'react'
import {Template} from '../Template'
import {Box} from '@mui/material'

const Wrapper = ({post, children}: {post : (any: object) => void, children : ReactElement}) => {
  const boxRef = useRef<HTMLDivElement>()
  const start = useRef<[x: number, y: number, t: number] | null>(null)
  const points = useRef<[x: number, y: number, t: number][] | null>(null)

  const [flag, setFlag] = useState<[x: number, y: number] | null>(null)

  const reset = () => {
    start.current = null
    points.current = null
  }

  const handleMouseDown : React.MouseEventHandler<HTMLDivElement> = (e) => {
    const {clientX, clientY} = e
    start.current ??= [clientX, clientY, Date.now()]
    points.current ??= [[0, 0, Date.now()]]
  }

  const handleMouseMove : React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!start.current || !boxRef.current || !points.current) return
    const {clientX, clientY} = e
    const [startX, startY] = start.current
    const shortSide = Math.min(boxRef.current.clientWidth, boxRef.current.clientHeight)
    const x = ((clientX - startX) / shortSide)
    const y = -((clientY - startY) / shortSide)
    post({state: {target: [x, y]}})
    points.current.unshift([x, y, Date.now()])
    if (points.current.length > 10) points.current.pop()
  }

  const handleMouseUp : React.MouseEventHandler<HTMLDivElement> = () => {
    if (!points.current || points.current.length < 10) return
    const latestPoints = points.current[0]
    const pastPoints = points.current[5]

    const diffX = latestPoints[0] - pastPoints[0]
    const diffY = latestPoints[1] - pastPoints[1]
    const diffT = latestPoints[2] - pastPoints[2]

    const velX = diffX / (0.01 * diffT)
    const velY = diffY / (0.01 * diffT)
    setFlag([velX, velY])
    console.log('mouseUp')
    reset()
  }

  const handleMouseLeave : React.MouseEventHandler<HTMLDivElement> = () => reset()

  const vel = useRef<[x: number, y: number] | null>(null)
  const frictionCoff = 0.02

  useEffect(() => {
    function tick() {
      vel.current ??= flag
      const [x, y] = vel.current!
      const norm = Math.sqrt(x * x + y * y)
      const frictionX = (frictionCoff * x) / norm
      const frictionY = (frictionCoff * y) / norm
      let nextX = x - frictionX
      let nextY = y - frictionY
      nextX = (Math.abs(nextX) < 0.01 || nextX * x < 0) ? 0 : nextX
      nextY = (Math.abs(nextY) < 0.01 || nextY * y < 0) ? 0 : nextY
      vel.current = (nextX === 0 && nextY === 0) ? null : [nextX, nextY]
      if(!vel.current) setFlag(null)
      console.log(vel.current)
    }
    if (flag || vel.current) {
      const id = setInterval(tick, 10)
      return () => clearInterval(id)
    }
  }, [flag])

  console.log(boxRef)

  return(
    <Box
      ref={boxRef}
      display='flex'
      width='100%'
      height='100%'
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Box>
  )
}

export default function Page({name}: {name: string}) {
  return <Template src={name} sendMouse={false} wrapper={Wrapper}/>
}

//----------------------------------------------------------------
