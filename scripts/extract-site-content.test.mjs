import { describe, it, expect } from 'vitest'
import { extractSiteContent } from './extract-site-content.mjs'

describe('extractSiteContent', () => {
  it('maps basics, projects, and work experience into site content', () => {
    const input = {
      content: {
        basics: {
          name: 'Rei Ramirez',
          headline: 'Software Engineer',
          summary:
            'Clear systems and durable interfaces.\nMore detail for bio.\n\n- Bullet ignored for bio.',
        },
        education: [
          {
            institution: 'Example U',
            degree: 'Bachelor',
            area: 'CS',
            startDate: 'Sep 1, 2016',
          },
        ],
        projects: [
          {
            name: 'Project Alpha',
            url: 'https://example.com/alpha',
            startDate: 'Jan 1, 2025',
            description: 'A project management tool for multi-team platforms.',
            summary: 'Internal tooling for a multi-team platform.\nFaster releases without sacrificing review quality.',
          },
        ],
        work: [
          {
            name: 'Acme',
            position: 'Engineer',
            startDate: 'Mar 1, 2024',
            summary: 'Shipped APIs.\nPartners moved faster.',
          },
        ],
        skills: [
          {
            name: 'Languages',
            level: 'Expert',
            keywords: ['Python', 'Java'],
          },
          {
            name: 'DevOps',
            level: 'Advanced',
            keywords: ['CI/CD'],
          },
        ],
      },
    }
    const out = extractSiteContent(input)
    expect(out.name).toBe('Rei Ramirez')
    expect(out.headline).toBe('Software Engineer')
    expect(out.bio).toBe('Clear systems and durable interfaces. More detail for bio.')
    expect(out.projects).toEqual([
      {
        title: 'Project Alpha',
        year: '2025',
        note: 'A project management tool for multi-team platforms.',
        detail: 'Internal tooling for a multi-team platform.',
        url: 'https://example.com/alpha',
      },
    ])
    expect(out.workExperience).toEqual([
      {
        title: 'Engineer · Acme',
        year: '2024',
        note: 'Shipped APIs.',
        detail: 'Partners moved faster.',
      },
    ])
    expect(out.skills).toEqual([
      { name: 'Languages', level: 'Expert', keywords: ['Python', 'Java'] },
      { name: 'DevOps', level: 'Advanced', keywords: ['CI/CD'] },
    ])
    expect(out.resumeUrl).toBe('resume.pdf')
  })

  it('omits project url when missing', () => {
    const input = {
      content: {
        basics: { name: 'Rei Ramirez', summary: 'Builder.' },
        projects: [{ name: 'No Link', startDate: '2025', summary: 'Local only.' }],
      },
    }
    expect(extractSiteContent(input).projects[0].url).toBe('')
  })

  it('returns empty arrays when projects, work, or skills missing', () => {
    const input = {
      content: {
        basics: { name: 'Rei Ramirez', summary: 'Builder.' },
      },
    }
    const out = extractSiteContent(input)
    expect(out.projects).toEqual([])
    expect(out.workExperience).toEqual([])
    expect(out.skills).toEqual([])
  })
})
