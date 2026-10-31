import { BlockExhibit } from '@/site/blocks/BlockViewer'

export default function BlocksLayout({ children }: LayoutProps<'/blocks'>) {
  return <BlockExhibit>{children}</BlockExhibit>
}
