## ADDED Requirements

### Requirement: Daily report display
The system SHALL display a daily report containing online-flavor data, hot topic summary, work survival tip, quote, and optional knowledge block.

#### Scenario: User opens daily report
- **WHEN** the user opens the daily report module
- **THEN** the system displays the currently published daily report content

### Requirement: Admin-reviewed AI drafts
The system SHALL support AI-assisted draft generation for daily content and require admin publishing before users can see it.

#### Scenario: AI draft is generated
- **WHEN** an admin requests AI-assisted daily content generation
- **THEN** the system creates a draft that is not visible to users until approved and published

### Requirement: Supply entry configuration
The system SHALL display configurable `隐者补给` entries such as food, drink, ride, membership, or commerce links.

#### Scenario: Published supply entries appear
- **WHEN** an admin publishes active supply entries
- **THEN** the homepage displays those entries according to configured placement and ordering

### Requirement: Content publishing lifecycle
The system SHALL support draft, scheduled, published, and archived states for daily content.

#### Scenario: Scheduled content reaches publish time
- **WHEN** scheduled content reaches its configured publish time
- **THEN** the system makes it available as the current daily content
