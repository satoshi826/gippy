import {Container, Stack, Typography} from '@mui/material'
import {BodyText, SubTitleText, Syntax, TitleText} from '../components'
import {HEADER_HEIGHT} from '../../frame/Header/Header'

export default function Page() {
  return (
    <Stack flexDirection='row' justifyContent='center' flexGrow={1} maxHeight={`calc(100dvh - ${HEADER_HEIGHT}px)`} overflow='auto'>
      <Container sx={{px: 1, py: 2}} maxWidth="md">
        <TitleText >Introduction</TitleText>
        <SubTitleText >Overview</SubTitleText>
        <BodyText >
          Glaku はシンプルかつミニマムなwebGLライブラリで、ピュアなwebGLが持つパワーを引き出すことを目的にしています。Enjoy WebGL !
        </BodyText>
        <SubTitleText>Installation</SubTitleText>
        <Syntax lang={undefined}>
          npm i glaku
        </Syntax>
        <SubTitleText>Quick Start</SubTitleText>
        <Typography variant='h5' sx={{mt: 4, mb: 2}}>Vanilla</Typography>
        <Syntax lang='ts'>
          {quickStartTs}
        </Syntax>
      </Container>
    </Stack>
  )
}

const quickStartTs =
`import { Core, Vao, Program, Renderer } from "glaku";

const canvas = document.getElementById("c");
const core = new Core({ canvas });
const renderer = new Renderer(core);
const vao = new Vao(core, {
  id: "triangle",
  attributes: { a_position: [0, 1, 1, -1, -1, -1] },
});
const program = new Program(core, {
  id: "hello",
  attributeTypes: { a_position: "vec2" },
  vert: /* glsl */ \`
      void main() {
        gl_Position = vec4(a_position, 1.0, 1.0);
      }\`,
  frag: /* glsl */ \`
      out vec4 o_color;
      void main() {
        o_color = vec4(0.4, 0.4, 1.0, 1.0);
      }\`,
});
renderer.render(vao, program);
`