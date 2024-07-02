import {AppBar, Icon, IconButton, Typography, styled} from '@mui/material'
import {useSetAtom} from 'jotai'
import {sidebarOpenAtom} from '..'

export const HEADER_HEIGHT = 48

export function Header() {
  const setOpen = useSetAtom(sidebarOpenAtom)
  return (
    <StyledAppBar>
      <IconButton onClick={() => setOpen(prev => !prev)} color='inherit'>
        <Icon >menu</Icon>
      </IconButton>
      <Typography variant="h6" noWrap>
        Glaku
      </Typography>
    </StyledAppBar>
  )
}

const StyledAppBar = styled(AppBar)(({theme}) => ({
  height       : HEADER_HEIGHT,
  position     : 'static',
  display      : 'flex',
  padding      : theme.spacing(0.5, 1),
  gap          : theme.spacing(1),
  alignItems   : 'center',
  flexDirection: 'row',
  color        : 'white'
}))