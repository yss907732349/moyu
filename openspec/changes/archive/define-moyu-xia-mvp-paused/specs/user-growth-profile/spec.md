## ADDED Requirements

### Requirement: WeChat user identity
The system SHALL support WeChat mini program login and associate each user with a persistent application profile.

#### Scenario: First login creates profile
- **WHEN** a new WeChat user logs in successfully
- **THEN** the system creates an application profile linked to that user's WeChat identity

### Requirement: Faction selection
The system SHALL allow a user to choose one faction from `键影隐者`, `水遁隐者`, `策天隐者`, and `游侠隐者`.

#### Scenario: User chooses faction
- **WHEN** a user selects a faction during onboarding or profile setup
- **THEN** the system stores the faction and uses it in profile, badges, and community identity

### Requirement: Growth assets
The system SHALL track level, experience, title, hidden coin, energy, check-in streak, and achievement progress for each user.

#### Scenario: User views profile
- **WHEN** the user opens the profile page
- **THEN** the system displays their faction, level, experience progress, title, hidden coin, energy, check-in streak, and achievements

### Requirement: Daily check-in reward
The system SHALL allow a user to check in once per day and receive configured rewards.

#### Scenario: First check-in of day
- **WHEN** the user checks in and has not checked in that day
- **THEN** the system grants configured hidden coin and experience rewards and updates the streak

#### Scenario: Duplicate check-in
- **WHEN** the user attempts to check in again on the same day
- **THEN** the system does not grant duplicate rewards
