import { TemplateExhibit } from '@/site/templates/TemplateViewer'

export default function TemplatesLayout({ children }: LayoutProps<'/templates'>) {
  return <TemplateExhibit>{children}</TemplateExhibit>
}
