import {useMemo} from 'react'
import {ThemeProvider, createTheme, CssBaseline, useTheme} from '@mui/material'

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
      <ScrollStyle/>
      {children}
    </ThemeProvider>
  )
}

function ScrollStyle() {
  const {palette} = useTheme()
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      ::-webkit-scrollbar-track{
        background: ${palette.grey[900]};
      }
      ::-webkit-scrollbar-thumb{
        background: ${palette.grey[700]};
        border-radius: 4px;
      }
      ::-webkit-scrollbar{
        transition : all .6s;
        height: 8px;
        width: 8px;
      }
    `
    }}>
    </style>
  )
}