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
