import {useMemo} from 'react'
import {ThemeProvider, createTheme, CssBaseline} from '@mui/material'

export function ThemeRoot({children}: React.PropsWithChildren) {

  const theme = useMemo(() => createTheme({
    typography: {
      fontFamily       : 'Noto Sans JP',
      fontWeightRegular: 500,
      fontWeightMedium : 600,
      fontWeightBold   : 700
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536
      }
    },
    palette: {
      mode: 'dark'
    }
  }), [])

  return(
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      {children}
    </ThemeProvider>
  )
}