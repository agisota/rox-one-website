# rox.one

Сайт-визитка [ROX.ONE](https://rox.one) — agent-native терминал для работы с самыми мощными LLM.

Один экран. Одна кнопка. Цинематическая атмосфера, дышащий wordmark, время-зависимая палитра.

## Стек

- **Gatsby 4** — статика, build-time release fetch с GitHub API
- **React 18** + **TypeScript**
- **Tailwind CSS** — кастомные токены, без preset-палитр
- **Geist Sans Variable** — wordmark (Vercel font)
- **Cloudflare Pages** + Worker `rox-one-router` — хостинг и маршрутизация

## Локально

```bash
pnpm install
pnpm start         # http://localhost:8001
pnpm build         # production → public/
pnpm clean         # gatsby clean
pnpm typecheck     # tsc --noEmit
```

Требуется Node 22.x.

## Архитектура

### Living wordmark

`src/pages/index.tsx` крутит один `requestAnimationFrame` loop, который обновляет 6 CSS-переменных (`--w-0`…`--w-5`) каждый кадр. Каждый span литеры читает свою переменную через `font-variation-settings: "wght" var(--w-N)`. Geist Variable интерполирует вес плавно — это GPU-friendly, без layout.

Три рычага оживляют wordmark:

1. **Synchronized breath** — все буквы дышат одной волной (период 7.5с, амплитуда ±38 weight units). Лёгкий per-letter phase lead (0.18с) добавляет органики.
2. **Wave pulse** — каждые 14 секунд через wordmark пробегает волна (+60 weight + brightness glow), 2 секунды на проход.
3. **Daylight cycle** — `new Date().getHours()` читается раз в минуту. День / закат / ночь меняют foreground цвет, brightness, и speed multiplier (ночью буквы дышат в 1.35× медленнее). Переходы — 60-секундные linear tween'ы.

`prefers-reduced-motion` гасит wave и в 2.5× замедляет breath.

### Атмосфера

10 layered surfaces в `src/styles/global.css`:

| # | Слой | Роль |
|---|---|---|
| 1 | `atmo-base` | 5-stop вертикальный градиент `#0E1219` → `#02040A` |
| 2 | `atmo-key-warm` | Gold key light сверху, медленное `key-breathe` (22с) |
| 3 | `atmo-key-cool` | Cool fill из верхнего-левого |
| 4 | `atmo-bloom` | Ambient над wordmark |
| 5 | `atmo-shadow` | Implied ground shadow под wordmark |
| 6 | `atmo-aurora` | Teal trace в правом-верхнем, `aurora-drift` (34с) |
| 7 | `atmo-iris` | Violet pool снизу-слева |
| 8 | `atmo-ember` | Wine pool снизу-справа |
| 9 | `atmo-vignette` | Тихий edge fall-off |
| 10 | `atmo-grain` | SVG `feTurbulence` через `mix-blend: overlay`, 2.4% opacity |

### Build-time release fetch

`gatsby-node.ts` в `onPreBootstrap` запрашивает `api.github.com/repos/agisota/rox-one-terminal/releases/latest`, кэширует ответ в `.cache/rox-release.json` и через `sourceNodes` отдаёт его как GraphQL-node `RoxRelease`. Fallback захардкожен на случай GitHub rate-limit.

«Вечная» ссылка на свежий arm64-DMG:
```
https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg
```

## Деплой

```bash
pnpm build
pnpm dlx wrangler@latest pages deploy public \
  --project-name=rox-one \
  --branch=production
```

Worker `rox-one-router` на zone `rox.one` маршрутизирует:
- `/api/`, `/login`, `/workspace/*`, `/session/`, `/settings`, … → `app.rox.one` (продукт)
- всё остальное → `rox-one.pages.dev` (этот сайт)

## Лицензии

Код этого сайта — MIT. Само приложение **ROX ONE** — отдельный проект на Apache 2.0:
<https://github.com/agisota/rox-one-terminal>.

Скелет (Gatsby setup, `bin/start`, базовые конфиги) изначально был форкнут из MIT-лицензированного `PostHog/posthog.com`. Их копирайт-нотис сохранён в `LICENSE`. Контент, дизайн и логика — переписаны полностью.
