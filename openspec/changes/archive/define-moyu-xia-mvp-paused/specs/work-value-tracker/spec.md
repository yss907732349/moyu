## ADDED Requirements

### Requirement: Salary and work schedule configuration
The system SHALL allow a user to configure monthly salary, work start time, work end time, lunch break, work system, and payday for work-value calculations.

#### Scenario: User saves work profile
- **WHEN** a user submits valid salary and work-time settings
- **THEN** the system persists the settings and uses them for homepage calculations

### Requirement: Real-time earned amount display
The system SHALL display a real-time earned amount for the current workday based on the user's stored settings and the current time.

#### Scenario: Amount increases during effective work time
- **WHEN** the user is inside configured effective work time
- **THEN** the displayed earned amount updates locally as time passes

#### Scenario: Amount excludes inactive periods
- **WHEN** the current time is outside work time, inside lunch break, or on a non-working day
- **THEN** the displayed earned amount does not increase for that inactive period

### Requirement: Countdown cards
The system SHALL show countdowns for next rest day, payday, and legal holidays on the homepage.

#### Scenario: Countdown values are shown
- **WHEN** the user opens the homepage
- **THEN** the system displays days or time remaining for rest day, payday, and the next configured holiday

### Requirement: Hide mode
The system SHALL provide a hide mode that masks sensitive work-value information and changes the homepage presentation to a safe visual state.

#### Scenario: User enables hide mode
- **WHEN** the user taps the hide control
- **THEN** the system masks the earned amount and displays the hidden-state visual treatment
