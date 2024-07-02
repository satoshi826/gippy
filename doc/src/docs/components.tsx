import {Divider, Typography, styled} from '@mui/material'
import {Light as SyntaxHighlighter} from 'react-syntax-highlighter'
import ts from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
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
  SyntaxHighlighter.registerLanguage('ts', ts)
  return SyntaxHighlighter
}, [])

const syntaxHighlighterStyle: CSSProperties = {
  border      : '1px solid #555',
  borderRadius: '12px',
  padding     : '8px 16px 8px 16px'
}

type SyntaxArg = {children: string, lang?: 'ts' | undefined, title?: string}
export function Syntax({children, lang, title}: SyntaxArg) {
  const SyntaxHighlighter = useSyntaxHighlighter()
  return (
    <SyntaxHighlighter language={lang} style={tomorrowNight} customStyle={syntaxHighlighterStyle}>
      {children}
    </SyntaxHighlighter>
  )
}