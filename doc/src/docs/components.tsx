import {Typography, styled} from '@mui/material'


const BodyTextTypography = styled(Typography)(({theme}) => ({color: theme.palette.grey[300]}))

export function BodyText({children}: React.PropsWithChildren) {
  return (
    <BodyTextTypography variant='body1' sx={{mb: 4}}>
      {children}
    </BodyTextTypography>
  )

}