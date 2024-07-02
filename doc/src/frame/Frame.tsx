import {Stack} from '@mui/material'
import {atom} from 'jotai'
import {Header} from './Header/Header'
import {Sidebar} from './Sidebar/Sidebar'

export const sidebarOpenAtom = atom(true)
export const SIDEBAR_WIDTH = 200

export function Frame({children}: React.PropsWithChildren) {
  return (
    <Stack height='100dvh'>
      <Header/>
      <Stack direction='row' flexGrow={1}>
        <Sidebar/>
        {children}
      </Stack>
    </Stack>
  )
}

