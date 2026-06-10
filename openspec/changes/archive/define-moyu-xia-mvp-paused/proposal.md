## Why

`摸鱼侠` needs a clear MVP contract before implementation so the product can validate its strongest daily-use loop first: turning work time into visible value, countdowns, and RPG-style identity. The concept already has a broad world view, community, comics, growth, and monetization plan; this change narrows that plan into a buildable first version while preserving extension points for locked and future features.

## What Changes

- Define `摸鱼侠` as a WeChat mini program with a dark ninja RPG visual direction, using `隐者大陆` as the world view and `隐者` as the user identity.
- Introduce a homepage tool loop for real-time earned amount, workday countdowns, payday countdowns, holiday reminders, salary/time settings, and hide mode.
- Introduce WeChat user onboarding, faction selection, profile, level, title, hidden coin, energy, and daily check-in basics.
- Introduce daily content modules including `隐者日报` and configurable `隐者补给` commercial entries.
- Introduce a lightweight community model with faction areas, posts, comments, likes, reports, moderation status, and lower-risk structured interactions.
- Introduce comics/IP content as unlockable and configurable content rather than a heavy first-release dependency.
- Introduce a feature registry so unavailable modules can appear as locked or coming-soon entries with stable keys, routes, unlock rules, and future API locations.
- Define the admin scope for users, content, community moderation, growth configuration, activities, commercial entries, and analytics.
- Exclude full season ranking, complex mini games, title shop, skin shop, and complete long-form comic operations from the first MVP implementation, while keeping placeholders and data contracts for later expansion.

## Capabilities

### New Capabilities

- `work-value-tracker`: Real-time earned amount, salary/time configuration, workday rules, countdowns, holiday reminders, and hide mode.
- `user-growth-profile`: WeChat login, user profile, faction selection, level, experience, titles, hidden coins, energy, check-in, and achievements.
- `daily-content-feed`: Daily report, AI-assisted content draft workflow, office survival tips, quote/hot topic blocks, and configurable supply/CPS entries.
- `community-lite`: Lightweight community posting, faction areas, comments, likes, favorites, reports, and moderation lifecycle.
- `comic-ip-content`: Comic episode listing, world-view content, character/monster pages, and unlockable IP content.
- `feature-registry`: Stable configuration for enabled, locked, and coming-soon features across the app.
- `admin-operations`: Admin management for users, content, moderation, growth rules, activities, commercial placements, and analytics.
- `visual-system`: Dark ninja RPG pixel UI rules, reusable component system, art asset categories, and locked-state presentation.

### Modified Capabilities

- None.

## Impact

- Affects the future mini program frontend page structure: home, community, comics, and profile tabs.
- Requires backend APIs for user identity, profile settings, work-value configuration, content, community, growth, feature configuration, and admin operations.
- Requires database tables for users, work profiles, daily activity, growth assets, content, posts, comments, reports, comics, feature flags, and admin-managed configuration.
- Requires external integrations for WeChat login, WeChat content security, optional AI content generation, file/object storage, and future CPS/ad providers.
- Requires a design asset pipeline for pixel characters, faction icons, badges, scene banners, comic covers, and RPG-style UI icons.
