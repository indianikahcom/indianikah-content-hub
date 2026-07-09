# Functional Requirements

## FR-001 Read-only Database

The system shall connect to the IndiaNikah production database using a read-only database user.

Acceptance Criteria

- SELECT only
- No INSERT
- No UPDATE
- No DELETE

---

## FR-002 Profile Insight Engine

The system shall generate anonymized insights from profile data.

Acceptance Criteria

- Never expose profile names
- Never expose email addresses
- Never expose phone numbers
- Only aggregated statistics

---

## FR-003 Marriage Content

The system shall generate marriage guidance posts.

Acceptance Criteria

- Based on IndiaNikah guidelines
- AI-assisted captions
- Human approval required

---

## FR-004 Islamic Content

The system shall generate Islamic reminders and educational content.

Acceptance Criteria

- Authentic sources only
- Positive tone
- Family-oriented
- Human approval required

---

## FR-005 Books

The system shall recommend books from IndiaNikah.

---

## FR-006 Videos

The system shall recommend videos from IndiaNikah.

---

## FR-007 News

The system shall recommend news articles from IndiaNikah.

---

## FR-008 Manual Approval

Every generated post shall require administrator approval before publishing.

---

## FR-009 Publishing

The system shall publish approved posts to supported social media platforms.

---

## FR-010 Analytics

The system shall record publishing history and engagement statistics.

---


## FR-011 – Manual Content Creation

The system shall allow administrators to create, edit, preview, save as draft, schedule, and publish manual posts to one or more supported social media platforms
