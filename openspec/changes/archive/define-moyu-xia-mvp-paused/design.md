## Context

`摸鱼侠` is planned as a WeChat mini program for young office workers. Its first release must validate a daily-use loop before investing heavily in community, comics, games, and seasons. The product direction is dark ninja RPG with pixel characters, RPG panels, faction identity, and workday utility.

There is no existing application code in this repository yet. This design establishes the target architecture, module boundaries, data ownership, visual system, and staged implementation plan for the MVP.

## Goals / Non-Goals

**Goals:**

- Deliver a WeChat mini program MVP with four tabs: home, community, comics, and profile.
- Make the home page the strongest retention surface through real-time earned amount, countdowns, salary/work-time settings, and hide mode.
- Provide basic user identity, faction selection, level, experience, hidden coin, energy, check-in, and locked feature presentation.
- Support daily content, lightweight community, unlockable comics, and admin-managed configuration.
- Keep future features visible through a feature registry without requiring complete implementations.
- Define an art and component system that can reproduce the dark ninja RPG UI direction consistently.

**Non-Goals:**

- Full season rankings, complex mini games, complete comic production workflow, title/skin shop, and advanced social graph are not first-release requirements.
- Real-time chat, private messages, and live presence are not included in the MVP.
- Automated AI publishing without human review is not included.
- Native app, H5 web, and desktop clients are not included.

## Decisions

### Decision: Use a configuration-driven feature registry

Unavailable modules such as `魔王挑战`, `小游戏`, `赛季排行`, and future shops SHALL be represented by stable feature keys, display metadata, unlock conditions, and status values.

Rationale: The UI can expose future goals and route placeholders without hardcoding one-off locked states. It also lets admin operations update labels, icons, ordering, and availability.

Alternatives considered:

- Hide unavailable features completely. This reduces implementation work but weakens RPG progression and gives users no reason to level up.
- Hardcode locked entries in each page. This is faster initially but becomes brittle when adding later activities.

### Decision: Calculate real-time earned amount on the client using server-stored settings

The backend SHALL store salary, work schedule, lunch break, payday, and work-system settings. The mini program SHALL calculate the visible real-time amount locally from the current time and settings.

Rationale: Per-second server updates are unnecessary, expensive, and fragile. The backend only needs to persist settings and optional daily summaries.

Alternatives considered:

- Server-calculated per-second values. This centralizes logic but creates avoidable load and latency.
- Store only local settings. This is simpler but loses cross-device continuity and admin/debug visibility.

### Decision: Treat community as moderated lightweight UGC

Community content SHALL use a moderation lifecycle before public display. The MVP SHOULD favor structured interactions such as daily topics, faction areas, and short posts before complex social features.

Rationale: WeChat mini programs have content compliance risk. A moderation lifecycle allows launch with safer operations while preserving a path to richer UGC later.

Alternatives considered:

- Fully open forum from day one. This may increase activity but raises cold-start and compliance risk.
- No community in MVP. This lowers risk but misses the identity and belonging loop.

### Decision: Use admin-reviewed AI content drafts

AI-generated daily reports, yellow-page copy, or survival tips SHALL enter the system as drafts that require admin review before publishing.

Rationale: This preserves content velocity while limiting compliance, hallucination, and brand-tone risk.

Alternatives considered:

- Manual-only publishing. Safer but slower and more expensive to operate.
- Fully automated publishing. Faster but too risky for a public WeChat product.

### Decision: Build UI as reusable RPG components plus image assets

The mini program SHALL implement text, buttons, cards, stats, lists, and states as native components. Pixel art SHALL be image assets used for characters, scene banners, badges, icons, and comics.

Rationale: Making entire screens as images blocks dynamic data, accessibility, and responsive layout. A component system keeps the UI maintainable while preserving the target look.

Alternatives considered:

- Fully image-based UI. It can match mockups quickly but is not maintainable.
- Pure generic mini program UI. It is easy to build but loses differentiation.

## Risks / Trade-offs

- [Risk] Dark RPG visuals reduce text readability on small screens -> Mitigation: constrain color tokens, contrast, font sizes, spacing, and card density in the visual system.
- [Risk] Community content causes compliance issues -> Mitigation: require WeChat content security, keyword checks, AI review option, manual review, reports, and status lifecycle.
- [Risk] Feature scope expands before MVP validation -> Mitigation: classify features as enabled, locked, or coming-soon and implement only the first-release contract.
- [Risk] AI-generated content quality or safety is inconsistent -> Mitigation: generate drafts only, require admin approval, and keep manual override.
- [Risk] Pixel art consistency drifts over time -> Mitigation: define asset categories, sizes, palette direction, and character state naming before bulk generation.
- [Risk] Salary and work-time data are sensitive -> Mitigation: keep fields minimal, avoid public exposure, and provide hide mode plus privacy-conscious defaults.

## Migration Plan

1. Create the mini program, backend, database, and admin projects from an empty baseline.
2. Implement shared domain models and feature registry first so locked entries and navigation are stable.
3. Implement homepage work-value settings and client-side calculation.
4. Add user profile, faction selection, and growth basics.
5. Add daily content and admin publishing workflow.
6. Add community lite with moderation.
7. Add comic/IP listing and unlock rules.
8. Add commercial supply entries after core daily flow is usable.

Rollback strategy for the MVP is feature-level: disable risky or incomplete modules through the feature registry and admin configuration while keeping the app shell available.

## Open Questions

- Confirm final public app name: `摸鱼侠` as app name and `隐者大陆` as world view is the current recommendation.
- Confirm first implementation stack: recommended default is `uni-app + NestJS + MySQL + Vue3 admin`, but this can be revisited before coding.
- Confirm whether salary configuration should support pre-tax, post-tax, or simple monthly salary only in MVP.
- Confirm which legal holiday data source will be used for mainland China holiday adjustments.
