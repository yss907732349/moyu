## ADDED Requirements

### Requirement: Feature status registry
The system SHALL define feature entries with stable key, title, icon, status, route, display order, and optional unlock condition.

#### Scenario: App loads feature entries
- **WHEN** the mini program requests feature configuration
- **THEN** the system returns enabled, locked, and coming-soon entries with stable keys and display metadata

### Requirement: Locked feature behavior
The system SHALL show locked features in the UI with disabled styling and a clear unlock requirement.

#### Scenario: User taps locked feature
- **WHEN** a user taps a locked feature
- **THEN** the system displays the configured unlock condition instead of navigating to unavailable functionality

### Requirement: Coming-soon feature behavior
The system SHALL show coming-soon features as visible placeholders without active business functionality.

#### Scenario: User taps coming-soon feature
- **WHEN** a user taps a coming-soon feature
- **THEN** the system displays the configured coming-soon message
