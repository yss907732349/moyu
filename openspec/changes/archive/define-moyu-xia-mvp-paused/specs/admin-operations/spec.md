## ADDED Requirements

### Requirement: User administration
The admin system SHALL allow authorized admins to view users, profile state, faction, growth data, and moderation restrictions.

#### Scenario: Admin views user
- **WHEN** an authorized admin opens a user record
- **THEN** the system displays that user's profile, growth, faction, and restriction state

### Requirement: Content administration
The admin system SHALL allow authorized admins to manage daily reports, supply entries, banners, comics, and IP content.

#### Scenario: Admin publishes content
- **WHEN** an authorized admin publishes valid content
- **THEN** the system makes the content available according to its configured status and timing

### Requirement: Community moderation
The admin system SHALL allow authorized admins to review posts, comments, reports, and moderation decisions.

#### Scenario: Admin handles report
- **WHEN** an admin resolves a content report
- **THEN** the system stores the decision and updates the affected content state if needed

### Requirement: Growth and feature configuration
The admin system SHALL allow authorized admins to configure levels, rewards, tasks, achievements, feature entries, and unlock rules.

#### Scenario: Admin updates reward rule
- **WHEN** an admin changes a reward configuration
- **THEN** future reward grants use the updated configuration

### Requirement: Analytics dashboard
The admin system SHALL provide operational metrics including daily active users, check-ins, content views, posts, moderation volume, and commercial entry clicks.

#### Scenario: Admin views dashboard
- **WHEN** an authorized admin opens analytics
- **THEN** the system displays current operational metrics
