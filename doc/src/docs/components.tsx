import {Divider, Typography, styled} from '@mui/material'
import {Light as SyntaxHighlighter} from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import {tomorrowNight} from 'react-syntax-highlighter/dist/esm/styles/hljs'
import {CSSProperties, useMemo} from 'react'

const BodyTextTypography = styled(Typography)(({theme}) => ({color: theme.palette.grey[300]}))

export function TitleText({children}: React.PropsWithChildren) {
  return (
    <>
      <Typography variant='h3' >{children}</Typography>
      <Divider sx={{mt: 2}}/>
    </>
  )
}

export function SubTitleText({children}: React.PropsWithChildren) {
  return <Typography variant='h4' sx={{mt: 4, mb: 2}}>{children}</Typography>
}

export function BodyText({children}: React.PropsWithChildren) {
  return (
    <BodyTextTypography variant='body1' sx={{mb: 4}}>
      {children}
    </BodyTextTypography>
  )
}

const useSyntaxHighlighter = () => useMemo(() => {
  SyntaxHighlighter.registerLanguage('js', js)
  SyntaxHighlighter.registerLanguage('bash', bash)
  return SyntaxHighlighter
}, [])

const syntaxHighlighterStyle: CSSProperties = {
  border      : '1px solid #555',
  borderRadius: '12px',
  padding     : '8px 16px 8px 16px'
}

export function Syntax({children, lang = 'js'}: {children: string, lang?: 'js' | 'bash'}) {
  const SyntaxHighlighter = useSyntaxHighlighter()
  return (
    <SyntaxHighlighter language={lang} style={tomorrowNight} customStyle={syntaxHighlighterStyle}>
      {children}
    </SyntaxHighlighter>
  )
}