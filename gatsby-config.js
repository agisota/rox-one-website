require('dotenv').config({ path: `.env.${process.env.NODE_ENV}.local` })
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const fs = require('fs')
const path = require('path')

// Pull the release tag and star count baked by the previous build's
// onPreBootstrap (or fall back to literals if no cache exists yet). This way
// JSON-LD, meta tags, and any siteMetadata consumer get build-time values.
let buildTimeVersion = 'v0.9.2'
try {
    const cache = JSON.parse(
        fs.readFileSync(path.join(__dirname, '.cache', 'rox-release.json'), 'utf8'),
    )
    if (cache.tag_name) buildTimeVersion = cache.tag_name
} catch {
    /* first build — fall back to literal */
}

let buildTimeStars = 0
try {
    const repo = JSON.parse(
        fs.readFileSync(path.join(__dirname, '.cache', 'rox-repo.json'), 'utf8'),
    )
    if (typeof repo.stars === 'number') buildTimeStars = repo.stars
} catch {
    /* first build — no star count yet */
}

module.exports = {
    flags: { DEV_SSR: false },
    siteMetadata: {
        title: 'ROX.ONE',
        titleTemplate: '%s — ROX.ONE',
        description:
            'Agent-native terminal for the most powerful LLMs. Anthropic, OpenAI, Google, GitHub Copilot — your keys, your machine.',
        url: 'https://rox.one',
        image: '/og/default.png',
        twitterUsername: '@rox_one',
        siteUrl: 'https://rox.one',
        version: buildTimeVersion,
        stars: buildTimeStars,
    },
    trailingSlash: 'always',
    plugins: [
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-postcss',
        {
            resolve: 'gatsby-plugin-sitemap',
            options: { excludes: [] },
        },
        {
            resolve: 'gatsby-plugin-react-svg',
            options: { rule: { include: /svgs/ } },
        },
    ],
}
