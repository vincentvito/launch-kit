import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createDemoSnapshot } from '@/lib/launch-kit/demo'
import { renderPressPackHtml } from '@/lib/launch-kit/exporters'

describe('launch kit exporters', () => {
  it('escapes user and model content in press pack HTML', () => {
    const project = createDemoSnapshot()
    project.name = '<script>alert("name")</script>'
    project.sourceUrl = 'https://example.com/?q=<img src=x onerror=alert(1)>'
    project.kit.mediaKit.founderCompanyBio = '<script>alert("bio")</script>'
    project.kit.mediaKit.keyVisualsChecklist = ['<img src=x onerror=alert(1)>']

    const html = renderPressPackHtml(project)

    expect(html).not.toContain('<script>alert("name")</script>')
    expect(html).not.toContain('<script>alert("bio")</script>')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;')
    expect(html).toContain('&lt;script&gt;alert(&quot;bio&quot;)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('serves saved press packs as private attachment downloads', () => {
    const source = readFileSync('app/api/launch-kit/projects/[id]/press-pack/route.ts', 'utf8')

    expect(source).toContain("'content-type': 'text/html; charset=utf-8'")
    expect(source).toContain("'content-disposition': `attachment; filename=\"${filename}\"`")
    expect(source).toContain("'cache-control': 'private, no-store'")
  })
})
