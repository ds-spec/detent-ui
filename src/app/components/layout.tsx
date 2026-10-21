import { Exhibit } from '@/site/exhibit/Exhibit'

export default function ComponentsLayout({ children }: LayoutProps<'/components'>) {
  return <Exhibit>{children}</Exhibit>
}
