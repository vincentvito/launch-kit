import { afterEach, describe, expect, it, vi } from 'vitest'
import { readGuestProjects, writeGuestProjects } from '@/app/dashboard/dashboard-utils'

describe('dashboard guest project storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not crash when browser storage cannot be read', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('storage unavailable')
        },
      },
    })

    expect(readGuestProjects()).toEqual([])
  })

  it('skips corrupt guest project entries and normalizes malformed saved snapshots', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => JSON.stringify([
          null,
          'bad',
          {
            id: 7,
            name: 42,
            sourceUrl: ['bad'],
            language: {},
            brief: {
              productName: ' Restored App ',
              targetUsers: [' founders ', 3],
            },
            kit: {
              mediaKit: {
                keyVisualsChecklist: [6, ' screenshot '],
              },
            },
            createdAt: 123,
            updatedAt: ' 2026-01-01T00:00:00.000Z ',
          },
          {
            id: 'saved_1',
            name: ' Saved launch ',
            sourceUrl: ' https://example.com ',
            language: 'es',
            brief: {},
            kit: {
              growthAssets: {
                xOutreach: {
                  variants: [{ message: ' what I learned launching this ' }],
                },
              },
            },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ]),
      },
    })

    const projects = readGuestProjects()

    expect(projects).toHaveLength(2)
    expect(projects[0]).toMatchObject({
      id: 'guest-project-3',
      name: 'Untitled project',
      sourceUrl: '',
      language: 'en',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(projects[0]?.brief).toMatchObject({
      productName: 'Restored App',
      targetUsers: ['founders'],
    })
    expect(projects[0]?.kit.mediaKit.keyVisualsChecklist).toEqual(['screenshot'])
    expect(projects[1]).toMatchObject({
      id: 'saved_1',
      name: 'Saved launch',
      sourceUrl: 'https://example.com',
      language: 'es',
    })
    expect(projects[1]?.kit.growthAssets.xOutreach.variants[0]?.message).toBe(
      'what I learned launching this',
    )
  })

  it('does not crash when browser storage cannot be written', () => {
    vi.stubGlobal('window', {
      localStorage: {
        setItem: () => {
          throw new Error('quota exceeded')
        },
      },
    })

    expect(() => writeGuestProjects([])).not.toThrow()
  })
})
