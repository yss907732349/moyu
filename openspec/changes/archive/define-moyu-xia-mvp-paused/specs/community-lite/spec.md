## ADDED Requirements

### Requirement: Community sections
The system SHALL provide recommended, faction, hot, and boss-rant community sections.

#### Scenario: User browses community
- **WHEN** the user opens the community page
- **THEN** the system displays available sections and a feed for the selected section

### Requirement: Post creation
The system SHALL allow logged-in users to create posts with text, optional images, and a target section.

#### Scenario: User submits post
- **WHEN** the user submits a valid post
- **THEN** the system creates the post in a moderation status before public display

### Requirement: Faction posting rule
The system SHALL restrict posting in a faction section to users whose selected faction matches that section.

#### Scenario: Non-matching faction attempts to post
- **WHEN** a user tries to post in a faction section that does not match their profile faction
- **THEN** the system rejects the post attempt and explains the restriction

### Requirement: Interaction actions
The system SHALL support likes, comments, favorites, and reports for published posts.

#### Scenario: User likes a post
- **WHEN** a logged-in user likes a published post
- **THEN** the system records the like and updates the visible like count

### Requirement: Moderation lifecycle
The system SHALL maintain community content states including pending, published, rejected, deleted, and hidden.

#### Scenario: Moderator rejects content
- **WHEN** an admin rejects pending content
- **THEN** the system prevents that content from appearing in public feeds
