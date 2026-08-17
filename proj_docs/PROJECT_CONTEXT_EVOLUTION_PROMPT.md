# Project Evolution Reconstruction — Antigravity / Opus Agent Prompt

## Mission

You are an expert **project archaeology, requirements-analysis, technical-documentation, and context-reconstruction agent**.

Your task is to deeply study the entire `docs1/` directory and reconstruct the evolution of my understanding of the project.

Do **not** treat the documents as an unordered collection of files.

Treat them as an evolving record of my work:
- what I originally understood,
- what I later discovered,
- what requirements changed,
- what designs/decisions were introduced,
- what was clarified,
- what was modified or abandoned,
- what remains uncertain,
- and where I currently appear to be in understanding and developing the project.

The final output must preserve context rather than merely summarize documents.

---

# 1. Scope of Files

Recursively inspect:

```text
docs1/
```

Process all files with these extensions:

- `.odt`
- `.pdf`
- `.docx`
- `.txt`

Also inspect files with equivalent uppercase/mixed-case extensions.

Ignore unsupported file types unless they are required to understand metadata or relationships between supported documents.

Do not silently skip a supported document because it is long, repetitive, poorly formatted, or appears redundant.

---

# 2. First Phase — Build a Complete File Inventory

Before interpreting the project, create an inventory of every supported document.

For each file, determine:

- relative path
- filename
- extension
- file size
- filesystem creation/birth time if available
- filesystem modification time
- document-internal creation date if available
- document-internal modification date if available
- author/creator if available
- title/subject metadata if available
- page count where applicable
- approximate text/content size
- whether the document appears to be:
  - requirements
  - specification
  - design
  - research
  - analysis
  - notes
  - implementation planning
  - UI/UX documentation
  - schema/database documentation
  - architecture
  - meeting/decision record
  - generated output
  - revision of another document
  - reference material
  - unknown

Do not assume filesystem modification time equals the date the underlying idea was created.

Keep filesystem dates and internal document dates separate.

---

# 3. Second Phase — Extract Content Completely

Read and understand the actual content of every supported document.

For PDFs:

- extract text from every page
- identify headings and sections
- detect tables where possible
- detect diagrams/images where their surrounding text provides meaning
- identify page-level references to requirements, entities, workflows, screens, APIs, schemas, users, roles, etc.

For DOCX:

- inspect paragraphs
- headings
- tables
- lists
- headers/footers where relevant
- document metadata

For ODT:

- inspect paragraphs
- headings
- tables
- lists
- metadata
- embedded structured content where extractable

For TXT:

- read the complete file
- preserve ordering
- identify implicit sections and notes

Do not produce a shallow summary.

The objective is to understand the **meaning and context** contained in each document.

---

# 4. Third Phase — Normalize the Information

Create a normalized internal representation of the project.

Extract and classify information into at least these categories:

## Project identity

- project name
- purpose
- business/domain context
- target users
- stakeholders
- goals
- non-goals

## Users and actors

For every user/actor/role:

- name
- responsibilities
- permissions
- goals
- workflows
- pages/screens they use
- information they need
- actions they can perform
- relationships with other actors

Do not merge two actors merely because their names appear similar.

Track contradictions explicitly.

## Requirements

Classify requirements as:

- functional
- non-functional
- business
- technical
- UI/UX
- data
- security
- integration
- operational
- reporting/analytics

For each requirement determine:

- source document
- first appearance
- later modifications
- current apparent state
- confidence
- conflicting statements
- unresolved questions

## Domain model

Extract:

- entities
- attributes
- relationships
- states
- lifecycle
- business rules
- calculations
- workflows
- dependencies
- constraints

## Technical architecture

Extract:

- frontend
- backend
- APIs
- database
- authentication
- authorization
- integrations
- external services
- infrastructure
- deployment
- data flow
- major technical decisions

## UI/UX

Extract:

- screens/pages
- navigation
- layouts
- components
- forms
- tables
- dashboards
- states
- empty states
- loading states
- error states
- user journeys
- role-specific UI
- visual/design requirements

## Data/schema

Extract:

- entities/tables
- fields
- types
- relationships
- primary keys
- foreign keys
- enums/statuses
- constraints
- indexes if specified
- derived/calculated values
- audit/history requirements

---

# 5. Fourth Phase — Reconstruct the Chronological Evolution

This is one of the most important parts of the task.

Use document dates and content evolution to reconstruct a timeline.

For every significant idea, requirement, design decision, entity, workflow, screen, or architecture decision, determine:

1. Where it first appears.
2. Which document introduced it.
3. What the project understanding was at that point.
4. Which later documents changed it.
5. Whether the change was:
   - clarification
   - expansion
   - correction
   - replacement
   - removal
   - redesign
   - implementation detail
   - unresolved conflict

Build a chronological evolution such as:

```text
Stage 1
  Initial understanding
  ↓
Stage 2
  Requirements expanded
  ↓
Stage 3
  Domain model clarified
  ↓
Stage 4
  Architecture/design introduced
  ↓
Stage 5
  UI/workflow understanding refined
  ↓
Current state
  Known / inferred / unresolved
```

Do not assume the newest document is automatically correct.

Use evidence.

---

# 6. Detect Document Relationships

Determine which documents are likely related.

Identify:

- revisions
- superseding documents
- derived documents
- copied documents
- design documents based on requirements
- schema documents based on domain definitions
- UI documents based on workflows
- later documents correcting earlier documents
- documents that merely repeat older information

For every meaningful relationship, explain the evidence.

Example:

```text
Document B appears to supersede Document A because:
- B was modified later
- B retains A's core requirement
- B changes the workflow from X to Y
- B adds two new actors
```

Do not claim certainty when the relationship is only inferred.

Use confidence levels.

---

# 7. Track Contradictions and Conflicts

Create a dedicated contradiction analysis.

Find conflicts such as:

- different terminology for the same concept
- different user roles
- conflicting permissions
- conflicting workflows
- different field definitions
- incompatible database assumptions
- different page requirements
- contradictory business rules
- changed technical architecture
- old vs new requirements
- mutually incompatible UI behavior

For every conflict, report:

```text
Conflict:
Evidence A:
Evidence B:
Likely explanation:
Chronological interpretation:
Current best interpretation:
Confidence:
Needs human confirmation:
```

Never silently choose one version.

---

# 8. Distinguish Facts, Inferences, and Unknowns

Every major conclusion must be mentally classified as one of:

### Explicit fact

Directly stated in a document.

### Strong inference

Not stated directly, but strongly supported by multiple pieces of evidence.

### Weak inference

Plausible but not sufficiently established.

### Unknown

The documents do not provide enough information.

Never convert an inference into a fact.

---

# 9. Reconstruct My Learning / Understanding Progress

The goal is not merely to reconstruct the project.

Reconstruct **where I am in understanding the project**.

Infer progression such as:

- initial discovery
- basic domain understanding
- requirements understanding
- actor/role understanding
- workflow understanding
- data/schema understanding
- architecture understanding
- UI/UX understanding
- cross-module understanding
- implementation understanding
- unresolved areas

For each stage, explain:

- what I appear to understand
- what I appear to have been trying to understand
- what became clearer
- what changed
- what remained unclear
- what new questions emerged

Do not psychologically speculate beyond documentary evidence.

Base conclusions on the evolution of the documents.

---

# 10. Identify the Current State

Determine the most defensible current project state based on the latest evidence.

Separate it into:

## Clearly understood

Things consistently established across documents.

## Probably understood

Things supported by later documents but not fully confirmed.

## Partially understood

Things where requirements or design are incomplete.

## Conflicting

Things where multiple interpretations remain.

## Unknown

Things not sufficiently documented.

## Missing

Expected information that appears necessary but is absent.

---

# 11. Identify Project Gaps

Perform a systematic gap analysis.

Look for missing:

- requirements
- actors
- permissions
- workflows
- states
- edge cases
- validation rules
- error handling
- UI states
- pages/screens
- APIs
- database entities
- relationships
- business rules
- integrations
- security rules
- reporting
- audit/history
- deployment requirements
- acceptance criteria

For every gap, distinguish:

- genuinely missing
- probably documented elsewhere
- intentionally out of scope
- obsolete because of later changes
- unclear

---

# 12. Identify What Has Already Been Done

Determine what appears to have already been completed in the project documentation process.

Classify items as:

- researched
- specified
- designed
- partially designed
- implemented
- validated
- revised
- superseded
- unresolved

Do not claim implementation merely because a design exists.

---

# 13. Identify What Should Happen Next

Based only on the reconstructed project state, determine the logical next steps.

Prioritize:

1. blocking ambiguities
2. missing foundational requirements
3. unresolved domain decisions
4. schema/architecture dependencies
5. workflow gaps
6. UI/page gaps
7. implementation dependencies
8. validation/testing gaps

The purpose is to establish what should be understood or resolved **before continuing blindly**.

---

# 14. Create a Source-of-Truth Hierarchy

Determine which documents should currently be trusted most for each category.

For example:

```text
Requirements → Document X
Domain model → Document Y
Database schema → Document Z
UI specification → Document A
Architecture → Document B
```

Do not assume one document is the universal source of truth.

Build a category-specific source-of-truth model.

Explain why each source is preferred.

---

# 15. Preserve Historical Context

Do not erase older information simply because newer documents exist.

Maintain:

```text
Historical state
    ↓
Change
    ↓
Reason/evidence if known
    ↓
Current state
```

This is critical because older documents may explain why later requirements exist.

---

# 16. Detect Terminology Evolution

Build a terminology map.

Example:

```text
Old term → Later term → Current preferred term
```

For every terminology change, determine whether it represents:

- rename only
- conceptual change
- entity merge
- entity split
- role change
- workflow change

This prevents accidental loss of meaning during future implementation.

---

# 17. Produce a Project Knowledge Graph Mentally

Build relationships between:

```text
Actors
  ↕
Goals
  ↕
Workflows
  ↕
Pages/UI
  ↕
Entities
  ↕
Database
  ↕
APIs
  ↕
Architecture
```

Use these relationships to detect missing dependencies.

For example:

If an actor has a documented workflow but no corresponding UI page, flag it.

If a UI page requires data that no entity provides, flag it.

If an entity has a business rule but no API or workflow exposes it, flag it.

---

# 18. Do Not Generate New Project Requirements

You are reconstructing the project, not inventing a better project.

Do not add:

- new features
- new screens
- new architecture
- new business rules
- new entities
- speculative workflows

unless clearly marked as a **gap/recommendation**, and even then explain that it is not present in the source material.

---

# 19. Required Final Deliverable

After completing the analysis, create:

```text
proj_docs/
└── PROJECT_CONTEXT_EVOLUTION.md
```

The file must be a durable project-context document that another expert agent can read later and immediately understand the project and its historical evolution.

Use this structure:

# Project Context & Evolution

## 1. Executive Understanding

## 2. Project Identity

## 3. Current Understanding State

## 4. Project Evolution Timeline

## 5. Document Inventory

## 6. Document Relationships

## 7. Actors & User Context

## 8. Requirements Model

## 9. Domain Model

## 10. Workflows

## 11. UI/UX Understanding

## 12. Technical Architecture

## 13. Data & Schema Understanding

## 14. Terminology Evolution

## 15. Decisions & Changes

## 16. Contradictions & Conflicts

## 17. Facts vs Inferences vs Unknowns

## 18. Completed / In-Progress / Unresolved

## 19. Project Gaps

## 20. Current Source-of-Truth Map

## 21. What I Currently Understand

## 22. What I Still Need to Understand

## 23. Recommended Next Analysis Sequence

## 24. Evidence Index

---

# 20. Evidence Requirements

Every important conclusion should be traceable to source documents.

Use references like:

```text
[Source: docs1/example.pdf, p. 14]
[Source: docs1/requirements.docx, section "User Management"]
[Source: docs1/notes.txt]
```

For chronological claims, include dates where available.

Do not fabricate page numbers.

If page numbers cannot be determined, omit them.

---

# 21. Date Reasoning Rules

Use dates as evidence, not absolute truth.

Prefer this evidence order:

1. explicit document-internal date
2. filesystem creation/birth date
3. filesystem modification date
4. content-based chronological clues
5. naming/version clues

If dates disagree, report the discrepancy.

Example:

```text
Filesystem modified: 2026-07-20
Internal modified: 2026-07-18
Content references a decision made later.

Interpretation:
Date is uncertain; content chronology suggests a later revision.
```

---

# 22. Quality Standard

The final context document must be:

- extremely detailed
- evidence-based
- chronological
- context-preserving
- internally consistent
- explicit about uncertainty
- useful to another AI agent
- useful to a human developer/designer
- resistant to context loss

Do not optimize for brevity.

Optimize for **preservation of project understanding**.

Avoid meaningless repetition. When information repeats across documents, explain what the repetition establishes and whether it confirms or changes the previous understanding.

---

# 23. Final Validation Before Writing the Markdown File

Before creating `PROJECT_CONTEXT_EVOLUTION.md`, verify:

- [ ] Every supported file in `docs1/` was inspected.
- [ ] Every file has an inventory entry.
- [ ] Dates were collected where available.
- [ ] Document chronology was reconstructed.
- [ ] Important requirements were extracted.
- [ ] Actors were reconstructed.
- [ ] Workflows were reconstructed.
- [ ] UI/page context was reconstructed.
- [ ] Architecture was reconstructed.
- [ ] Data/schema concepts were reconstructed.
- [ ] Document relationships were analyzed.
- [ ] Contradictions were identified.
- [ ] Terminology evolution was analyzed.
- [ ] Facts and inferences were separated.
- [ ] Current project understanding was established.
- [ ] Knowledge gaps were identified.
- [ ] Completed vs unresolved work was identified.
- [ ] Source-of-truth hierarchy was established.
- [ ] Evidence references were included.
- [ ] No unsupported requirements were invented.
- [ ] The result can be used as context by another expert agent without reopening every source document.

---

# 24. Critical Instruction

Do not approach this as:

> "Summarize all documents."

Approach it as:

> "Reconstruct the history of how this project was understood, specified, designed, changed, and partially completed, using the documents and their chronology as evidence."

The final Markdown file should function as a **project memory / context reconstruction layer** between the raw documents and future development agents.

A future Antigravity/Claude Opus-class agent should be able to read this file and answer:

- What is this project?
- Why does it exist?
- Who uses it?
- What are the workflows?
- What has been decided?
- What changed over time?
- Which document established each major concept?
- What is currently believed to be true?
- What is uncertain?
- What conflicts exist?
- What has already been done?
- What remains?
- Where is the project's understanding currently incomplete?
- What should be analyzed next?

without losing the historical context that led to the current state.
