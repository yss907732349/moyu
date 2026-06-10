## ADDED Requirements

### Requirement: Dark ninja RPG visual direction
The mini program SHALL use a dark ninja RPG pixel visual system with deep backgrounds, bordered cards, gold/purple/blue accents, and pixel character assets.

#### Scenario: Page uses visual tokens
- **WHEN** a primary page is rendered
- **THEN** the page uses the configured dark background, card, border, text, and accent color tokens

### Requirement: Reusable UI components
The mini program SHALL provide reusable components for cards, buttons, badges, level bars, currency displays, countdowns, post cards, achievement badges, feature entries, and character sprites.

#### Scenario: Feature entry is rendered
- **WHEN** a feature entry appears on profile or home
- **THEN** the system renders it using the shared feature-entry component and status styling

### Requirement: Pixel art asset categories
The system SHALL organize art assets by characters, scenes, icons, badges, banners, comics, and locked-state visuals.

#### Scenario: Character state changes
- **WHEN** a user changes faction or toggles hide mode
- **THEN** the system can select the matching character or state asset from the defined asset categories

### Requirement: Text readability
The visual system SHALL preserve readable text contrast and sizing on supported mobile viewports.

#### Scenario: Page displays dense cards
- **WHEN** a page displays dense RPG-style cards
- **THEN** text remains readable and does not overlap adjacent content
