# IndiaNikah AI Content Hub Architecture

## High Level Architecture

                +-------------------------+
                |     Admin Dashboard     |
                +-----------+-------------+
                            |
                            |
                     REST API Calls
                            |
                            ▼
                +-------------------------+
                |      Backend API        |
                |  (Node.js + Express)    |
                +-----------+-------------+
                            |
        +-------------------+----------------------+
        |                   |                      |
        ▼                   ▼                      ▼
+----------------+   +---------------+    +----------------+
| Content Engine |   |   AI Engine   |    | Publishing     |
|                |   |               |    | Engine         |
+----------------+   +---------------+    +----------------+
        |                   |                      |
        +-------------------+----------------------+
                            |
                            ▼
                  +----------------------+
                  |     Approval Queue   |
                  +----------+-----------+
                             |
                      Approve / Reject
                             |
                             ▼
                    Social Media Platforms

------------------------------------------------------------

Production Database
        |
(Read Only User)
        |
        ▼
Content Engine

------------------------------------------------------------

Scheduler

Runs every day

↓

Reads new content

↓

Generates drafts

↓

Stores drafts

↓

Waits for approval

↓

Publishes after approval


## Architecture Rules

### Rule 1

Never write directly to the IndiaNikah production database.

---

### Rule 2

All production data is accessed using a read-only database user.

---

### Rule 3

Every social media post requires administrator approval.

---

### Rule 4

No personal information shall ever be included in generated content.

---

### Rule 5

AI-generated content must always cite or be based on trusted IndiaNikah content where applicable.

---

### Rule 6

Every action shall be logged.

---

### Rule 7

The application must continue functioning even if one social platform is unavailable.

---

### Rule 8

The scheduler shall never publish automatically without approval.
