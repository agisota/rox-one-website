require('dotenv').config({ path: `.env.${process.env.NODE_ENV}.local` })
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

module.exports = {
    flags: { DEV_SSR: false },
    siteMetadata: {
        title: 'ROX ONE',
        titleTemplate: '%s — ROX ONE',
        description:
            'Десктоп-терминал для работы с агентами и самыми мощными LLM: Anthropic, OpenAI, Google, GitHub Copilot. MCP, мультисессии, гибкие разрешения — в одном окне.',
        url: 'https://rox.one',
        image: '/og/default.png',
        twitterUsername: '@rox_one',
        siteUrl: 'https://rox.one',
    },
    trailingSlash: 'always',
    plugins: [
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-image',
        'gatsby-plugin-postcss',
        'gatsby-transformer-json',
        {
            resolve: 'gatsby-plugin-manifest',
            options: {
                name: 'ROX ONE — терминал для агентов',
                short_name: 'ROX ONE',
                start_url: '/',
                background_color: '#0A0A0B',
                theme_color: '#0A0A0B',
                display: 'minimal-ui',
                icon: 'static/icon.svg',
            },
        },
        { resolve: 'gatsby-plugin-sitemap', options: { excludes: [] } },
        { resolve: 'gatsby-plugin-react-svg', options: { rule: { include: /svgs/ } } },
        {
            resolve: 'gatsby-plugin-breakpoints',
            options: {
                queries: {
                    xs: '(max-width: 390px)',
                    sm: '(max-width: 767px)',
                    md: '(max-width: 1023px)',
                    lg: '(max-width: 1279px)',
                    xl: '(max-width: 1535px)',
                    '2xl': '(max-width: 2560px)',
                },
            },
        },
    ],
}
