/**
 * RSS feed — replaces the onPostBuild generator from the Gatsby version.
 * Built on @astrojs/rss; same shape (RSS 2.0), same source data, less
 * code. Emitted at build time as a static /feed.xml.
 */
import type { APIRoute } from 'astro'
import rss from '@astrojs/rss'
import { getReleaseSummary } from '../lib/release'

export const prerender = true

export const GET: APIRoute = async (context) => {
    const { releases } = await getReleaseSummary()
    return rss({
        title: 'ROX.ONE — releases',
        description: 'Release notes for ROX.ONE Terminal.',
        site: context.site?.toString() ?? 'https://rox.one',
        items: releases.map((r) => ({
            title: r.name || r.tag,
            link: r.htmlUrl,
            pubDate: r.publishedAt ? new Date(r.publishedAt) : new Date(0),
            description: r.bodyText,
            categories: r.tag ? [r.tag] : [],
        })),
        customData: '<language>en-us</language>',
    })
}
