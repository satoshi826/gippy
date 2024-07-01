import {List, ListItem, ListItemButton, ListItemText, Stack} from '@mui/material'
import {Tabs} from './Tabs'
import {Link, useLocation, useRoute} from 'wouter'
import {Page, PageType, pageTypes, pages} from '../../pages'
import {sidebarOpenAtom} from '..'
import {useSetAtom} from 'jotai'
import {aToO} from 'jittoku'
import {useIsXs} from '../../theme/hooks'

const items = aToO(pageTypes, (v) => [v, pages.filter(({type}) => type === v)])

export function SidebarContent() {
  const [, setLocation] = useLocation()
  const [, params] = useRoute('/:name')
  const currentPage = params?.name

  const currentTab: PageType = items.examples.find(({name}) => name === currentPage) ? 'examples' : 'docs'
  const handleChangeTab = (value: PageType) => {
    if(value === currentTab) return
    setLocation(`/${items[value][0].name}`)
  }

  return (
    <Stack>
      <Tabs value={currentTab} options={pageTypes} onChange={handleChangeTab}/>
      <SidebarList items={items[currentTab]} currentPage={currentPage ?? ''}/>
    </Stack>
  )
}

function SidebarList({items, currentPage}: {items: Page[], currentPage: string}) {
  const setSidebarOpen = useSetAtom(sidebarOpenAtom)
  const isXs = useIsXs()
  const handleClick = () => setSidebarOpen(false)
  return (
    <List >
      {items.map(({name}) => {
        const isCurrentPage = currentPage === name
        return (
          <ListItem
            key={name}
            component={Link}
            to={name}
            sx={({palette : {text, primary}}) => ({
              color      : isCurrentPage ? primary.main : text.primary,
              borderRight: isCurrentPage ? `2px solid ${primary.main}` : undefined
            })}
            dense
            disablePadding
            onClick={isXs ? handleClick : undefined}
          >
            <ListItemButton>
              <ListItemText >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </ListItemText>
            </ListItemButton>
          </ListItem>
        )
      })}
    </List>
  )
}
