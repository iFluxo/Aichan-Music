# Aichan — Project Conventions

Conventions for anyone (human or AI) working in this repo. Follow them for all new code.

## Code style

- **No comments in code.**
- **User-defined constants and imported identifiers use PascalCase — never snake_case or SCREAMING_SNAKE_CASE.**
    - Examples: `MAX_LEVEL` → `MaxLevel`, `FISH_ITEMS` → `FishItems`, `SPIN_DELAY_MS` → `SpinDelayMs`, `ID_PATTERN` → `IdPattern`, `APP_COMMANDS_TTL` → `AppCommandsTtl`.
    - Acronyms are treated as words: `Id`, `Ai`, `Ms`, `Ttl`.
- **Do not rename external/library/API identifiers that require snake_case**, such as:
    - Seyfert option fields: `min_value`, `max_value`, `max_length`, `name_localizations`, `description_localizations`.
    - Discord payload fields: `allowed_mentions`, `replied_user`.
    - Database column names (e.g. `daily_exp`); the TypeScript property stays camelCase.
    - Package/module names such as `node:child_process`.
- Types/classes/enums stay PascalCase; functions, methods, variables and object properties stay camelCase.

## Localization

- Every user-facing string lives in `app/languages/<locale>.ts` (`en`, `id`). Keep both files in sync.
- Decorative emojis are centralized in `assets/config.ts` under `emoji`.
    - Commands read `ctx.config.emoji` (`client.config.emoji` where only a client exists).
    - Non-context code (language files, helpers) imports `{ emoji } from "#config"`.
    - Item-catalog emojis in `app/plugins/items.ts` are item data and stay there.

## Config

- `assets/config.ts` exports `bot`, `colors`, and `emoji`.

## Before finishing

- `bunx tsc --noEmit`
- `bunx @biomejs/biome check .` (use `--write` to apply formatting)
