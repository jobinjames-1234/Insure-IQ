# Project Development Methodology

## 1. Purpose

This document defines the development methodology that must be followed throughout the entire project.

The project must be developed as a collection of **complete, end-to-end user workflows and business capabilities**, rather than developing the frontend, backend, API, business logic, and database as separate stages.

The primary objective is to ensure that every implemented capability is a real, usable part of the software and that no database data, UI functionality, API, or business logic exists without a legitimate connection to the rest of the system.

---

## 2. Core Development Principle

The project must be developed **vertically**, one complete functionality/workflow at a time.

For every functionality, development must cover all relevant layers together:

```
User/System Action
        ↓
Frontend
        ↓
API Request
        ↓
Authentication
        ↓
Authorization
        ↓
Business Logic
        ↓
Database Operation
        ↓
API Response
        ↓
Frontend State Update
        ↓
User-Visible Result
```

A functionality is not considered complete merely because one or more of these layers have been implemented.

The complete workflow must work from the user's action through persistence and back to the user interface.

---

## 3. No Seed Data / No Artificial Database Population

There must be **no seed data during project development**.

Business data must not be inserted into the database merely to make the frontend appear populated.

The following are prohibited for normal development:

* Seed scripts containing business records
* Fixture data
* Fake users / profiles / appointments / orders / applications / transactions
* Manually inserted business records
* SQL scripts used to populate the application with demonstration data
* Startup code that automatically creates fake business records
* Hardcoded frontend data representing database records
* Mock data used as a substitute for unfinished application functionality

The database should be allowed to remain empty when no legitimate user or system workflow has created data.

An empty database is a valid application state.

The frontend must correctly handle empty states rather than relying on artificial records.

---

## 4. Legitimate Data Creation

Every persistent business record must have a legitimate creation path.

```
User/System Event
        ↓
Frontend Interaction
        ↓
API Request
        ↓
Authentication
        ↓
Authorization
        ↓
Validation
        ↓
Business Logic
        ↓
Database Mutation
        ↓
API Response
        ↓
Frontend Update
```

Example:

```
User submits registration form
        ↓
Registration API
        ↓
Backend validation
        ↓
User creation logic
        ↓
Database INSERT
        ↓
User returned to frontend
        ↓
User can log in
```

---

## 5. No Orphaned Data

Whenever a database entity or record is introduced, determine:

1. Who creates it?
2. Under what workflow is it created?
3. Who can read it?
4. Where can it be viewed?
5. Who can update it?
6. Where can it be updated?
7. Who can delete, cancel, approve, reject, assign, or otherwise change it?
8. What happens to related records when its state changes?
9. Which user types are allowed to interact with it?
10. How does the frontend expose the relevant operations?

A database table existing by itself does not mean the corresponding functionality is implemented.

---

## 6. No Frontend-Only Functionality

A frontend page must not pretend that functionality exists when the underlying system does not support it.

A dashboard must not display counts or records unless those values come from legitimate application data retrieved through the API.

When no data exists, the frontend must display an appropriate empty state.

---

## 7. No Backend-Only Functionality

An API endpoint must not be considered a completed feature simply because it exists and returns a response.

The endpoint must be connected to:

```
Frontend → API → Business Logic → Database
```

and the resulting state must be observable through the appropriate application workflow.

---

## 8. No Database-First Development

The reasoning must be:

```
Requirement → User/System Workflow → Required Data → Domain Model
           → Business Rules → API → Frontend
```

The database exists to persist the application's domain state. It must not become a substitute for unfinished application logic.

---

## 9. Vertical-Slice Development

A vertical slice is a complete piece of functionality crossing all necessary application layers.

Example structure:

```
User Type 1
    │
    ├── Registration
    │     ├── Frontend
    │     ├── API
    │     ├── Business Logic
    │     ├── Database
    │     └── End-to-End Verification
    │
    ├── Login
    │     ├── Frontend
    │     ├── API
    │     ├── Authentication
    │     ├── Database
    │     └── End-to-End Verification
    │
    └── Feature X
          ├── Frontend
          ├── API
          ├── Business Logic
          ├── Database
          └── End-to-End Verification
```

---

## 10. Six User Types

The project contains six user types. Development must proceed **one user type at a time**.

```
User Type 1 → Complete required workflows → Verify
           ↓
User Type 2 → Complete required workflows → Verify
           ↓
           ...
           ↓
User Type 6
```

User types must not be invented or arbitrarily combined. They must be derived from the project documentation, domain model, and authorization rules.

---

## 11. Development Within a User Type

General structure (exact sequence from actual requirements):

```
User Type
    ↓
Registration / Account Creation
    ↓
Login
    ↓
Initial User Experience
    ↓
Profile / Account Operations
    ↓
Primary Business Workflows
    ↓
Supporting Workflows
    ↓
Related Data Operations
    ↓
Logout
```

---

## 12. Every Feature Must Be End-to-End

**Creation:**
```
Create → Validate → Persist → Retrieve → Display
```

**Update:**
```
Retrieve → Display → Edit → Validate → Update → Persist → Retrieve Again → Display Updated State
```

**Deletion:**
```
Select Record → Authorization → Delete/Deactivate → Database State Changes → API Response → Frontend Update
```

**Approval / Rejection:**
```
User Action → Authorization → Business Rule Validation → State Transition → Database Update → Related Users See New State
```

---

## 13. Database Changes Must Have a Source

For every important database change, it must be possible to answer:

```
Who or what caused this change?
        ↓
Which workflow caused it?
        ↓
Which API handled it?
        ↓
Which business rule permitted it?
        ↓
Which database operation occurred?
        ↓
Where can the resulting state be viewed?
```

Rule: **No unexplained database mutation.**

---

## 14. Top-to-Bottom Traceability

Forward direction:

```
Requirement → User Action → UI Component → Frontend State → API Request
           → Route → Authentication → Authorization → Validation
           → Business Logic → Domain Operation → Database
```

Reverse direction:

```
Database State → Business Domain → API Response → Frontend State → UI → User
```

Both directions must remain consistent.

---

## 15. Cross-User Workflows

When a workflow involves more than one user type, the complete system workflow must be implemented. Do not implement one side with mock data while the other side uses the real database.

```
User Type A creates a record
        ↓
Database
        ↓
User Type B sees the record and acts
        ↓
Database state changes
        ↓
User Type A sees the updated state
```

---

## 16. Empty Database Must Be Supported

* Empty lists must render correctly.
* Dashboards must handle zero records.
* Search and filters must handle no results.
* Related data that does not yet exist must be handled gracefully.
* The UI must not crash because a table contains zero rows.
* The system must not create fake records merely to prevent empty states.

---

## 17. Testing Philosophy

Use actual application workflows, not direct database inserts.

Instead of inserting a test user into the database directly, test:

```
Open application → Register through UI → Login
               → Open profile → Edit → Save → Reload → Verify persisted data
```

For a business workflow:

```
Perform action through application
        ↓
Verify API response
        ↓
Verify database state
        ↓
Reload/retrieve through application
        ↓
Verify user-visible result
```

---

## 18. Definition of Done — Feature

A feature is complete only when **all** of the following are true:

- [ ] The intended user can reach it
- [ ] Authentication is correctly handled
- [ ] Authorization is enforced
- [ ] Frontend functionality exists
- [ ] API functionality exists
- [ ] Backend / business logic exists
- [ ] Required database operations exist
- [ ] Validation exists
- [ ] Error handling exists
- [ ] Real data can be created through the software
- [ ] Real data can be retrieved through the software
- [ ] Required state changes persist
- [ ] The resulting state is visible through the appropriate frontend
- [ ] Relevant cross-user effects work
- [ ] Empty states work
- [ ] The complete workflow has been tested

---

## 19. Definition of Done — User Type

A user type is complete when its required lifecycle can be performed using the real application:

```
Entry → Authentication → Authorization → Dashboard / Initial Experience
     → Permitted Workflows → Data Creation → Data Retrieval
     → Data Modification → Required State Transitions
     → Related User Workflows → Account Operations → Logout
```

Only include operations actually required by that user type.

---

## 20. Development Discipline — Questions to Ask at Every Stage

| Layer | Question |
|---|---|
| Frontend | What real backend data does this display? |
| API | Which user action or system workflow calls this? |
| Business Logic | What domain rule requires this operation? |
| Database | Which legitimate workflow creates or changes this data? |
| Data | Which user can reach and manage this data? |
| Workflow | Can the user actually complete the entire operation from the software? |
| Completion | Can I start with an empty database and create this state through the application itself? |

If the answer to the last question is **no**, the feature is not yet complete.

---

## 21. Overall Development Model

```
                PROJECT
                   │
          ┌────────┴────────┐
          │                 │
     USER TYPE 1        USER TYPE 2
          │                 │
          ▼                 ▼
     WORKFLOW A        WORKFLOW A
          │                 │
          ▼                 ▼
     WORKFLOW B        WORKFLOW B
          │                 │
          ▼                 ▼
        ...               ...
```

Each workflow is implemented vertically across all layers.

---

## 22. Fundamental Rule

> **Never build data, APIs, business logic, frontend functionality, or database functionality in isolation when they represent the same business capability. Build the complete workflow across all required layers together.**

> **Never create persistent business data merely so that the software has something to display. Business data must originate from legitimate application or system workflows.**

The goal is not to make the software *look complete*. The goal is to make the software **actually complete**.

---

## 23. Final Development Flow

```
UNDERSTAND REQUIREMENT
        ↓
IDENTIFY USER / SYSTEM WORKFLOW
        ↓
DEFINE COMPLETE DATA LIFECYCLE
        ↓
DESIGN REQUIRED DOMAIN / BUSINESS RULES
        ↓
IMPLEMENT DATABASE SUPPORT
        ↓
IMPLEMENT BUSINESS LOGIC
        ↓
IMPLEMENT API
        ↓
IMPLEMENT FRONTEND
        ↓
CONNECT ALL LAYERS
        ↓
TEST FROM REAL USER ACTION
        ↓
VERIFY DATABASE STATE
        ↓
VERIFY API RESPONSE
        ↓
VERIFY FRONTEND RESULT
        ↓
VERIFY RELATED USER WORKFLOWS
        ↓
MARK WORKFLOW COMPLETE
        ↓
MOVE TO NEXT WORKFLOW
        ↓
COMPLETE USER TYPE
        ↓
MOVE TO NEXT USER TYPE
        ↓
COMPLETE ALL SIX USER TYPES
```

This methodology must be followed throughout the project unless a specific project requirement explicitly requires a different approach.
