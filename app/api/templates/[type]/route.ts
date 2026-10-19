import { buildTemplate, TEMPLATE_FILES, type TemplateType } from '@/lib/excel-templates'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params

  if (!(type in TEMPLATE_FILES)) {
    return Response.json({ error: 'Шаблон не найден' }, { status: 404 })
  }

  const templateType = type as TemplateType
  const buffer = await buildTemplate(templateType)
  const fileName = TEMPLATE_FILES[templateType]

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'no-store',
    },
  })
}
