import {Stack as MUIStack, styled} from '@mui/material'
import {atom} from 'jotai'
import {Header} from './Header/Header'
import {Sidebar} from './Sidebar/Sidebar'

export const sidebarOpenAtom = atom(true)
export const SIDEBAR_WIDTH = 200

export function Frame({children}: React.PropsWithChildren) {
  return (
    <Stack >
      <Header/>
      <Stack direction='row' >
        <Sidebar/>
        {children}
      </Stack>
    </Stack>
  )
}

const Stack = styled(MUIStack)({height: '100%'})