import {Container, Divider, Stack, Typography} from '@mui/material'
import {BodyText} from '../components'
import SyntaxHighlighter from 'react-syntax-highlighter'
import {tomorrowNight} from 'react-syntax-highlighter/dist/esm/styles/hljs'

export default function Page() {
  const codeString = '(num) => num + 1'
  return (
    <Stack flexDirection='row' justifyContent='center' flexGrow={1}>
      <Container sx={{mx: 1, my: 2}}>
        <Typography variant='h3' >Introduction</Typography>
        <Divider sx={{my: 1}}/>
        <Typography variant='h4' sx={{mb: 1}}>Overview</Typography>
        <BodyText >
          Glaku はシンプルかつミニマムなwebGLライブラリで、ピュアなwebGLが持つパワーを引き出すことを目的にしています。Enjoy WebGL !
        </BodyText>
        <Typography variant='h4' sx={{mt: 4}}>Installation</Typography>
        <SyntaxHighlighter language="typescript" style={tomorrowNight}>
          {codeString}
        </SyntaxHighlighter>
      </Container>
    </Stack>

  )
}