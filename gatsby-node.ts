import type { GatsbyNode } from 'gatsby'
import * as fs from 'fs'
import * as path from 'path'

const REPO = 'agisota/rox-one-terminal'
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=10`
const RELEASE_CACHE = path.join(__dirname, '.cache/rox-release.json')
const RELEASES_CACHE = path.join(__dirname, '.cache/rox-releases.json')

interface ReleaseSnapshot {
    tag_name: string
    name: string
    published_at: string
    arm64_dmg_url: string
    arm64_dmg_size: number
    arm64_zip_url: string
    arm64_zip_size: number
}

interface ReleaseEntry {
    tag_name: string
    name: string
    published_at: string
    html_url: string
    body: string
}

const FALLBACK: ReleaseSnapshot = {
    tag_name: 'v0.9.2',
    name: 'ROX ONE Terminal 0.9.2',
    published_at: '2026-05-13T18:42:09Z',
    arm64_dmg_url: `https://github.com/${REPO}/releases/latest/download/ROX-ONE-arm64.dmg`,
    arm64_dmg_size: 320120298,
    arm64_zip_url: `https://github.com/${REPO}/releases/latest/download/ROX-ONE-arm64.zip`,
    arm64_zip_size: 309366025,
}

/**
 * Strip GitHub-flavored markdown to plain text, then truncate.
 * Why inline: introducing a markdown lib for a couple of release-note excerpts
 * is more dep weight than it's worth. The output is decorative, not canonical
 * — full bodies live on the GitHub release page (linked from each entry).
 */
function stripMarkdown(s: string, limit = 320): string {
    if (!s) return ''
    const cleaned = s
        // code fences and inline code
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        // images and links → keep the label only
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        // bold / italic markers
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // headings and list markers
        .replace(/^#+\s+/gm, '')
        .replace(/^[*+-]\s+/gm, '· ')
        // html escapes left behind
        .replace(/<[^>]+>/g, '')
        // collapse whitespace
        .replace(/\s+/g, ' ')
        .trim()
    return cleaned.length > limit ? cleaned.slice(0, limit).trimEnd() + '…' : cleaned
}

async function fetchJson(url: string): Promise<any | null> {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'rox-one-website-build' } })
        return res.ok ? await res.json() : null
    } catch {
        return null
    }
}

export const onPreBootstrap: GatsbyNode['onPreBootstrap'] = async () => {
    fs.mkdirSync(path.dirname(RELEASE_CACHE), { recursive: true })

    // Latest release snapshot — for download links and version display.
    const release = await fetchJson(LATEST_API)
    if (release) {
        const dmg = release.assets?.find((a: any) => a.name === 'ROX-ONE-arm64.dmg')
        const zip = release.assets?.find((a: any) => a.name === 'ROX-ONE-arm64.zip')
        const snapshot: ReleaseSnapshot = {
            tag_name: release.tag_name,
            name: release.name,
            published_at: release.published_at,
            arm64_dmg_url: dmg?.browser_download_url ?? FALLBACK.arm64_dmg_url,
            arm64_dmg_size: dmg?.size ?? FALLBACK.arm64_dmg_size,
            arm64_zip_url: zip?.browser_download_url ?? FALLBACK.arm64_zip_url,
            arm64_zip_size: zip?.size ?? FALLBACK.arm64_zip_size,
        }
        fs.writeFileSync(RELEASE_CACHE, JSON.stringify(snapshot, null, 2))
    }

    // Recent releases list — for the /changelog page.
    const releases = await fetchJson(RELEASES_API)
    if (Array.isArray(releases)) {
        const list: ReleaseEntry[] = releases.map((r: any) => ({
            tag_name: r.tag_name,
            name: r.name || r.tag_name,
            published_at: r.published_at,
            html_url: r.html_url,
            body: stripMarkdown(r.body || ''),
        }))
        fs.writeFileSync(RELEASES_CACHE, JSON.stringify(list, null, 2))
    }
}

export const sourceNodes: GatsbyNode['sourceNodes'] = async ({
    actions,
    createNodeId,
    createContentDigest,
}) => {
    // Latest release singleton (used by the splash).
    let latest: ReleaseSnapshot
    try {
        latest = JSON.parse(fs.readFileSync(RELEASE_CACHE, 'utf8'))
    } catch {
        latest = FALLBACK
    }
    actions.createNode({
        ...latest,
        id: createNodeId('rox-release-latest'),
        internal: { type: 'RoxRelease', contentDigest: createContentDigest(latest) },
    })

    // Releases list nodes (used by /changelog).
    let list: ReleaseEntry[] = []
    try {
        list = JSON.parse(fs.readFileSync(RELEASES_CACHE, 'utf8'))
    } catch {
        list = [
            {
                tag_name: latest.tag_name,
                name: latest.name,
                published_at: latest.published_at,
                html_url: `https://github.com/${REPO}/releases/tag/${latest.tag_name}`,
                body: '',
            },
        ]
    }
    list.forEach((r, i) => {
        actions.createNode({
            ...r,
            order: i,
            id: createNodeId(`rox-release-entry-${r.tag_name}`),
            internal: {
                type: 'RoxReleaseEntry',
                contentDigest: createContentDigest({ ...r, order: i }),
            },
        })
    })
}
