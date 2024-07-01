import {Container, Stack, Typography} from '@mui/material'
import {BodyText, SubTitleText, Syntax, TitleText} from '../components'

export default function Page() {
  return (
    <Stack flexDirection='row' justifyContent='center' flexGrow={1}>
      <Container sx={{mx: 1, my: 2}}>
        <TitleText >Introduction</TitleText>
        <SubTitleText >Overview</SubTitleText>
        <BodyText >
          Glaku はシンプルかつミニマムなwebGLライブラリで、ピュアなwebGLが持つパワーを引き出すことを目的にしています。Enjoy WebGL !
        </BodyText>
        <SubTitleText>Installation</SubTitleText>
        <Syntax lang='bash'>
          npm i glaku
        </Syntax>
        <SubTitleText>Quick Start</SubTitleText>
        <Typography variant='h5' sx={{mt: 4, mb: 2}}>Vanilla</Typography>
      </Container>
    </Stack>

  )
}