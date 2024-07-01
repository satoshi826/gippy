import {oMap} from 'jittoku'
import {srcRecord} from './worker'

export type PageType = 'docs' | 'examples'

export type Page = {
  type: PageType,
  name: string,
}

export const pageTypes: PageType[] = ['docs', 'examples']

export const pages: Page[] = [
  {
    type: 'docs',
    name: 'introduction'
  },
  ...oMap(srcRecord, (([name]) => ({
    type: 'examples',
    name
  } as const)))
]