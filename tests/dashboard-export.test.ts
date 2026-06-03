import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('dashboard export flows', () => {
  it('downloads press packs through blobs instead of opening attachment routes in a new tab', () => {
    const source = readFileSync('app/dashboard/dashboard-client.tsx', 'utf8')

    expect(source).toContain('fetch(`/api/launch-kit/projects/${projectId}/press-pack`)')
    expect(source).toContain('-press-pack.html')
    expect(source).not.toContain('window.open(`/api/launch-kit/projects/${projectId}/press-pack`')
    expect(source).not.toContain("window.open(url, '_blank'")
  })

  it('attaches temporary download anchors to the DOM before clicking them', () => {
    const source = readFileSync('app/dashboard/dashboard-utils.ts', 'utf8')

    expect(source).toContain('document.body.appendChild(anchor)')
    expect(source).toContain('anchor.click()')
    expect(source).toContain('document.body.removeChild(anchor)')
    expect(source).toContain('URL.revokeObjectURL(url)')
  })
})
