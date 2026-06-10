## ADDED Requirements

### Requirement: Comic episode listing
The system SHALL provide a comic page that lists published comic episodes and IP content.

#### Scenario: User opens comic page
- **WHEN** the user opens the comic tab
- **THEN** the system displays published episodes and IP content available to that user

### Requirement: Unlockable content
The system SHALL support unlock conditions for comic episodes, world-view entries, character pages, and monster pages.

#### Scenario: Content is locked
- **WHEN** a user does not meet the configured unlock condition
- **THEN** the system displays the content as locked and shows the unlock requirement

### Requirement: Comic content management
The system SHALL allow admins to configure title, cover, episode order, content assets, publish status, and unlock conditions.

#### Scenario: Admin publishes episode
- **WHEN** an admin publishes a comic episode with valid assets
- **THEN** the episode becomes available according to its publish and unlock settings
