# Database Schema & Entity Relationship Design

Database: **MongoDB**  
ORM: **Mongoose Schema Engine**

---

## 1. Entity Relationship Overview

```mermaid
erDiagram
    USER ||--o{ ATTEMPT : "submits"
    USER ||--o{ PROCTOR_LOG : "triggers"
    TEST ||--o{ QUESTION : "contains"
    TEST ||--o{ ATTEMPT : "evaluated in"
    QUESTION ||--o{ QUESTION_BANK : "stored in"
    USER ||--o{ SELF_TEST : "generates"

    USER {
        ObjectId _id
        string name
        string email
        string erpNumber
        string password
        string role
        string status
    }

    TEST {
        ObjectId _id
        string title
        string description
        number durationMinutes
        number passingMarks
        boolean isEnabled
        Array questions
    }

    QUESTION {
        ObjectId _id
        string text
        string type
        Array options
        number correctOption
        Array codingTestCases
    }

    ATTEMPT {
        ObjectId _id
        ObjectId userId
        ObjectId testId
        number score
        string status
        Array answers
        Date submittedAt
    }
```

---

## 2. Collection Schema Specifications

### `users` Collection
Stores candidate accounts and administrative user credentials.
- **Indexes**: `email` (Unique), `erpNumber` (Sparse Unique), `status` + `role`.

### `tests` Collection
Stores placement assessment containers and attached question references.
- **Indexes**: `isEnabled`, `createdAt`.

### `questions` Collection
Stores MCQ and Coding question definitions with test cases.
- **Indexes**: `category`, `difficulty`, `type`.

### `attempts` Collection
Stores completed and ongoing candidate test attempts.
- **Indexes**: `userId` + `testId` (Compound Index), `score` (Descending for Leaderboards).

### `proctorlogs` Collection
Records candidate proctoring violations during live attempts.
- **Indexes**: `attemptId`, `userId`.

---

## 3. Future Collections (Phase 3 - 6)
- **`payments`**: Transaction IDs, amounts, gateway signatures, status.
- **`resumereviews`**: ATS scores, extracted keywords, recommendations.
- **`mockinterviews`**: Audio/video transcripts, speech metrics, score cards.
