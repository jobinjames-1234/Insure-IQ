# InsureIQ — Agent Development Rules

## 1. Authoritative Methodology

Before making any implementation, modification, refactor, deletion, migration, or architectural decision, read:

`development methodology.md`

This file is the authoritative development methodology for this project.

Do not silently ignore, bypass, weaken, reinterpret, or replace its rules.

---

## 2. Conflict Rule

If the user's requested implementation conflicts with `development methodology.md`:

1. STOP before implementing the conflicting part.
2. Clearly explain which methodology rule conflicts with the request.
3. Explain what would be violated.
4. Ask the user whether they intentionally want to change the methodology.
5. Do not silently override the methodology.

A normal implementation request is NOT permission to bypass the methodology.

---

## 3. Development Philosophy

InsureIQ must be developed as complete vertical slices.

Do not build isolated:

- frontend functionality
- backend endpoints
- database structures
- business logic
- mock data
- dashboards
- UI demonstrations

when they represent the same business capability.

A capability is complete only when the real workflow works end-to-end:

User/System Action
→ Frontend
→ API
→ Authentication
→ Authorization
→ Validation
→ Business Logic
→ Database
→ API Response
→ Frontend State
→ User-Visible Result

---

## 4. No Artificial Business Data

Never create business data merely to make the application look populated.

Do not use:

- seed business data
- fake users
- fake customers
- fake policies
- fake claims
- fake appointments
- fake transactions
- fixture business records
- hardcoded database-like frontend objects
- mock data as a substitute for unfinished functionality
- startup code that creates fake business records
- manual database insertion as a substitute for a real application workflow

An empty database is a valid state.

The application must handle empty states correctly.

---

## 5. Every Data Entity Needs a Real Lifecycle

Before introducing a persistent entity, establish:

- Who creates it?
- How is it created?
- Who can view it?
- Where can it be viewed?
- Who can edit it?
- Where can it be edited?
- Who can delete/deactivate it?
- What state transitions are possible?
- Which user types interact with it?
- How does the frontend expose these operations?

Never create an orphaned database entity.

---

## 6. Real Application Testing

Testing must use the actual application workflow.

Do not consider direct database insertion sufficient proof of functionality.

The preferred verification flow is:

Application UI
→ API
→ Business Logic
→ Database
→ API Response
→ UI
→ Persistent Result

Features should be tested starting from a valid empty database whenever practical.

---

## 7. Six User Types

The project has six user types.

Develop them one at a time.

Do not invent additional user types or arbitrarily combine them.

Complete the required workflows of one user type before moving to the next, according to `development methodology.md`.

---

## 8. White-Label Local Development

During local development, use exactly these hostnames:

http://abc.localhost:5173
http://globallife.localhost:5173
http://console.localhost:5173
http://insureiq.localhost:5173

Do not replace this methodology with arbitrary ports, path-based tenant simulation, or hardcoded frontend tenant switching unless explicitly required by the project.

The local hostname model is intended to simulate the production white-label domain architecture.

---

## 9. Before Declaring a Feature Complete

Verify:

- The intended user can reach it.
- Authentication works.
- Authorization works.
- Validation works.
- Frontend works.
- API works.
- Business logic works.
- Database operations work.
- Real data can be created.
- Real data can be retrieved.
- Real data can be modified where required.
- Required state transitions work.
- Resulting state persists.
- Resulting state is visible in the application.
- Cross-user effects work where applicable.
- Empty states work.
- The complete workflow has been tested.

Never declare a feature complete merely because the UI exists or an API returns successfully.

---

## 10. Before Every Implementation

First determine:

1. What requirement is being implemented?
2. Which user/system workflow does it belong to?
3. What is the complete data lifecycle?
4. Which user types are involved?
5. What business rules apply?
6. What database changes are actually required?
7. Which API operations are required?
8. Which frontend operations are required?
9. How will the user create/read/update/delete/change the resulting data?
10. How will the complete workflow be tested?

Then implement the vertical slice.

---

## 11. Core Rule

The goal is not to make InsureIQ look complete.

The goal is to make InsureIQ actually complete.

When in doubt, follow `development methodology.md`.
