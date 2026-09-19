import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

function firstLines(summary, count = 2) {
  if (!summary) return []
  return String(summary)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*-\s+/, '').trim())
    .filter(Boolean)
    .slice(0, count)
}

/** Prose before the first markdown-style list item (`- …`). */
function bioFromSummary(summary) {
  if (!summary) return ''
  const prose = []
  for (const line of String(summary).split(/\r?\n/)) {
    if (/^\s*-\s+/.test(line)) break
    const trimmed = line.trim()
    if (trimmed) prose.push(trimmed)
  }
  return prose.join(' ').replace(/\s+/g, ' ').trim()
}

function yearFromDate(dateStr) {
  if (!dateStr) return ''
  const m = String(dateStr).match(/(20\d{2}|19\d{2})/)
  return m ? m[1] : String(dateStr)
}

function mapEntry(item, title, { noteFromDescription = false, includeUrl = false } = {}) {
  const lines = firstLines(item.summary, 2)
  const description = String(item.description ?? '').trim()
  const entry = {
    title,
    year: yearFromDate(item.startDate),
    note: noteFromDescription ? description : lines[0] || '',
    detail: noteFromDescription ? lines[0] || '' : lines[1] || '',
  }
  if (includeUrl) {
    entry.url = String(item.url ?? '').trim()
  }
  return entry
}

export function extractSiteContent(doc) {
  const basics = doc?.content?.basics ?? {}
  const bio = bioFromSummary(basics.summary) || basics.headline || ''

  const projects = (doc?.content?.projects ?? []).map((p) =>
    mapEntry(p, p.name ?? '', { noteFromDescription: true, includeUrl: true })
  )

  const workExperience = (doc?.content?.work ?? []).map((w) =>
    mapEntry(w, [w.position, w.name].filter(Boolean).join(' · '))
  )

  const skills = (doc?.content?.skills ?? []).map((s) => ({
    name: String(s.name ?? '').trim(),
    level: String(s.level ?? '').trim(),
    keywords: (s.keywords ?? []).map((k) => String(k).trim()).filter(Boolean),
  }))

  return {
    name: basics.name ?? '',
    headline: basics.headline ?? '',
    bio,
    projects,
    workExperience,
    skills,
    resumeUrl: 'resume.pdf',
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const yamlPath = path.join(root, 'resume', 'resume.yml')
  const outPath = path.join(root, 'src', 'data', 'site-content.json')
  const doc = parseYaml(fs.readFileSync(yamlPath, 'utf8'))
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(extractSiteContent(doc), null, 2) + '\n')
  console.log('Wrote', outPath)
}
