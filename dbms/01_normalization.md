# Sketchpad -- Database Normalization Project (1NF, 2NF, 3NF & BCNF)

**Course:** Database Management Systems (DBMS)\
**Case Study Platform:** Sketchpad (Collaborative Online Design &
Whiteboard Platform)\
**Document:** Academic Project Documentation & Schema Analysis

------------------------------------------------------------------------

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Project Objective](#2-project-objective)
3.  [Database Overview](#3-database-overview)
4.  [Functional Dependencies](#4-functional-dependencies)
5.  [First Normal Form (1NF)](#5-first-normal-form-1nf)
6.  [Second Normal Form (2NF)](#6-second-normal-form-2nf)
7.  [Third Normal Form (3NF)](#7-third-normal-form-3nf)
8.  [Boyce-Codd Normal Form (BCNF)](#8-boyce-codd-normal-form-bcnf)
9.  [Final Conclusion](#9-final-conclusion)

------------------------------------------------------------------------

## 1. Introduction

A **Database Management System (DBMS)** is specialized software designed
to define, store, manipulate, retrieve, and manage data systematically.
A well-designed relational database helps maintain data integrity,
reduce unnecessary duplication, and support reliable access to
information.

### Sketchpad: Case Study Overview

**Sketchpad** is a collaborative online design and whiteboard platform.
It allows users to create and manage design rooms and work together on
visual content. The Prisma schema supplied for this project contains
these capabilities:

-   Users can register and maintain account information.
-   Users can authenticate through stored credentials and linked
    authentication-provider accounts.
-   Users can create posts associated with their accounts.
-   Users can create design rooms and act as their owners.
-   Users can have room invitations associated with their accounts.
-   Authentication sessions and verification tokens can be stored and
    managed.

A collaborative application needs a database structure that keeps user,
room, invitation, and authentication information organized. If the same
user or room details are repeatedly stored in multiple records, updates
can become inconsistent and unnecessary duplication can occur. Database
normalization provides a systematic way to evaluate this structure.

This document analyses only the models and constraints explicitly
present in the supplied Prisma schema.

------------------------------------------------------------------------

## 2. Project Objective

The objective of this project is to apply **Database Normalization
Theory** to the Sketchpad database schema. Specifically, this
documentation demonstrates:

1.  How the attributes satisfy **First Normal Form (1NF)** by storing
    individual scalar values rather than repeating groups or
    multi-valued fields.
2.  How the relations are evaluated for **Second Normal Form (2NF)** by
    checking for partial functional dependencies.
3.  How the schema is evaluated for **Third Normal Form (3NF)** by
    checking for transitive dependencies between non-key attributes.
4.  How the relations are evaluated against **Boyce-Codd Normal Form
    (BCNF)** by checking whether every determinant is a superkey.

### Why Normalization Matters for Sketchpad

-   **Reducing Redundancy:** User details are stored in `User` and
    referenced by related records through identifiers.
-   **Preventing Update Anomalies:** A user's email or name can be
    updated in one user record instead of changing copies in every
    related room or post record.
-   **Preventing Insertion Anomalies:** A user, room, or authentication
    account can be stored independently of whether the user has created
    a post.
-   **Preventing Deletion Anomalies:** Removing a post does not require
    deleting the user who created it. Room information is represented
    separately from invitation records.
-   **Maintaining Referential Integrity:** Foreign-key relations connect
    posts, rooms, invitations, accounts, and sessions to their related
    records.

------------------------------------------------------------------------

## 3. Database Overview

The supplied Prisma schema contains **seven relational models**:

1.  `User`
2.  `Account`
3.  `Session`
4.  `VerificationToken`
5.  `Post`
6.  `Room`
7.  `RoomInvite`

The following diagram summarizes the relationships declared in the
schema:

``` text
                         ┌───────────────┐
                         │     User      │
                         └───────────────┘
                           │   │   │   │
              ┌────────────┘   │   │   └─────────────┐
              │                │   │                 │
              ▼                ▼   ▼                 ▼
        ┌───────────┐    ┌─────────┐ ┌─────────┐ ┌────────────┐
        │  Account  │    │ Session │ │  Post   │ │ RoomInvite │
        └───────────┘    └─────────┘ └─────────┘ └────────────┘
                                                   ▲       │
                                                   │       │
                                                   │       ▼
                                             ┌───────────────┐
                                             │     Room      │
                                             └───────────────┘
                                                   ▲
                                                   │
                                                Owner
                                                   │
                                                  User

        VerificationToken is a separate model and has no
        relation declared to User in the supplied schema.
```

### Table 1: `User`

Stores the main profile and identity information for registered users.

-   `id` **(Primary Key):** Unique identifier generated using `cuid()`.
-   `name`: Optional display name.
-   `email` **(Unique):** Unique email address.
-   `emailVerified`: Optional email-verification timestamp.
-   `image`: Optional profile image value.
-   `password`: Stored password value. The schema does not specify
    whether it is hashed; password hashing should be handled by the
    application.
-   `accounts`: Relation to linked authentication-provider accounts.
-   `sessions`: Relation to login sessions.
-   `posts`: Relation to posts created by the user.
-   `ownedRooms`: Relation to rooms owned by the user.
-   `roomInvites`: Relation to invitations associated with the user.

### Table 2: `Account`

Stores external authentication-provider account details associated with
a user.

-   `id` **(Primary Key):** Unique identifier.
-   `userId` **(Foreign Key):** References `User(id)`.
-   `type`: Authentication account type.
-   `provider`: Authentication provider name.
-   `providerAccountId`: Account identifier supplied by the provider.
-   `refresh_token`: Optional refresh token.
-   `access_token`: Optional access token.
-   `expires_at`: Optional token expiration timestamp.
-   `token_type`: Optional token type.
-   `scope`: Optional authorization scope.
-   `id_token`: Optional identity token.
-   `session_state`: Optional session state.
-   `refresh_token_expires_in`: Optional refresh-token expiration
    duration.
-   **Unique Constraint:** `(provider, providerAccountId)` uniquely
    identifies a provider account.

### Table 3: `Session`

Stores authentication sessions.

-   `id` **(Primary Key):** Unique session-record identifier.
-   `sessionToken` **(Unique):** Unique token identifying a session.
-   `userId` **(Foreign Key):** References `User(id)`.
-   `expires`: Session expiration date and time.

### Table 4: `VerificationToken`

Stores tokens used for verification-related workflows.

-   `identifier`: Identifier associated with the verification request.
-   `token` **(Unique):** Unique verification token.
-   `expires`: Token expiration date and time.
-   **Unique Constraint:** `(identifier, token)` is also declared as a
    composite unique constraint.
-   **Key Note:** The supplied model does not declare a separate `id`
    primary key.

### Table 5: `Post`

Stores posts created by users.

-   `id` **(Primary Key):** Auto-incrementing unique identifier.
-   `name`: Name of the post.
-   `createdAt`: Creation timestamp.
-   `updatedAt`: Automatically updated modification timestamp.
-   `createdById` **(Foreign Key):** References `User(id)`.
-   `createdBy`: Relation to the user who created the post.
-   **Index:** An index is declared on `name`.

### Table 6: `Room`

Stores design or collaboration rooms.

-   `id` **(Primary Key):** Unique identifier generated using `cuid()`.
-   `ownerId` **(Foreign Key):** References `User(id)`.
-   `owner`: Relation to the user who owns the room.
-   `createdAt`: Room creation timestamp.
-   `title`: Room title, defaulting to `"Untitled"`.
-   `roomInvites`: Relation to invitations associated with the room.

### Table 7: `RoomInvite`

Stores invitation records connecting users with rooms.

-   `id` **(Primary Key):** Unique invitation identifier.
-   `roomId` **(Foreign Key):** References `Room(id)`.
-   `userId` **(Foreign Key):** References `User(id)`.

**Important schema observation:** `RoomInvite` does not declare a
composite unique constraint on `(roomId, userId)`. Therefore, the
current schema does not prevent multiple invitation records for the same
user-room pair.

------------------------------------------------------------------------

## 4. Functional Dependencies

A **Functional Dependency (FD)** is a relationship between attributes in
a relation. For attribute sets X and Y, **X → Y** means that the value
of X uniquely determines the value of Y.

The dependencies below are derived from the primary keys and unique
constraints declared in the supplied Prisma schema.

### Functional Dependencies in Sketchpad Tables

#### 1. `User`

-   `id → name, email, emailVerified, image, password`
-   `email → id, name, emailVerified, image, password`
-   **Candidate Keys:** `{id}`, `{email}`
-   **Primary Key:** `id`

#### 2. `Account`

-   `id → userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, refresh_token_expires_in`
-   `(provider, providerAccountId) → id, userId, type, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, refresh_token_expires_in`
-   **Candidate Keys:** `{id}`, `{provider, providerAccountId}`
-   **Primary Key:** `id`
-   **Foreign Key:** `userId` references `User(id)`.

#### 3. `Session`

-   `id → sessionToken, userId, expires`
-   `sessionToken → id, userId, expires`
-   **Candidate Keys:** `{id}`, `{sessionToken}`
-   **Primary Key:** `id`
-   **Foreign Key:** `userId` references `User(id)`.

#### 4. `VerificationToken`

-   `token → identifier, expires`
-   `(identifier, token) → expires`
-   **Candidate Keys:** `{token}` and the declared unique pair
    `{identifier, token}`. Since `token` is itself unique, it is
    sufficient to identify a row.
-   **Key Note:** No separate primary-key field is declared.

#### 5. `Post`

-   `id → name, createdAt, updatedAt, createdById`
-   **Candidate Key:** `{id}`
-   **Primary Key:** `id`
-   **Foreign Key:** `createdById` references `User(id)`.

#### 6. `Room`

-   `id → ownerId, createdAt, title`
-   **Candidate Key:** `{id}`
-   **Primary Key:** `id`
-   **Foreign Key:** `ownerId` references `User(id)`.

#### 7. `RoomInvite`

-   `id → roomId, userId`
-   **Candidate Key:** `{id}`
-   **Primary Key:** `id`
-   **Foreign Keys:** `roomId` references `Room(id)` and `userId`
    references `User(id)`.

------------------------------------------------------------------------

## 5. First Normal Form (1NF)

### 5.1 Definition & Rules of 1NF

A relation R is in **First Normal Form (1NF)** if and only if:

1.  Every attribute value is atomic (indivisible) within the relational
    model.
2.  There are no repeating groups or multi-valued lists stored in a
    single field.
3.  Each column contains values from a consistent attribute domain.
4.  Each row can be uniquely identified by a key.

### 5.2 Explanation Using Sketchpad

Consider a hypothetical early design in which all information about a
user's collaboration rooms is stored in one record:

``` text
User_Room_Record (
    user_id,
    user_name,
    email,
    room_details
)
```

If `room_details` stores several room names in one field, such as
`"Design Board, Team Whiteboard, Project Draft"`, the field contains
multiple values rather than one atomic value. This violates 1NF.

The supplied Prisma schema avoids this repeating group by storing users,
rooms, and invitations in separate models.

### 5.3 Before-Normalization Table (Violates 1NF)

#### Table: `User_Room_Record`

  user_id   user_name   email               room_details (Violates 1NF)
  --------- ----------- ------------------- --------------------------------
  U101      Aarav       aarav@example.com   Design Board, Team Whiteboard
  U102      Priya       priya@example.com   Marketing Canvas
  U103      Rohan       rohan@example.com   Project Draft, Team Whiteboard

#### Operational Problems

-   Searching for one room inside a comma-separated field requires
    string searching rather than a direct relational lookup.
-   It is difficult to create a foreign-key relationship for each room
    stored inside the field.
-   Counting a user's rooms requires parsing the field.
-   Updating or deleting one room may require modifying a combined
    string.

------------------------------------------------------------------------

### 5.4 After-Normalization Tables (1NF Compliant)

To achieve 1NF, each room and invitation is represented as a separate
row in its corresponding relation.

#### Table 1: `User`

  id \[PK\]   name    email
  ----------- ------- -------------------
  U101        Aarav   aarav@example.com
  U102        Priya   priya@example.com
  U103        Rohan   rohan@example.com

#### Table 2: `Room`

  id \[PK\]   ownerId \[FK\]   title
  ----------- ---------------- ------------------
  R101        U101             Design Board
  R102        U101             Team Whiteboard
  R103        U102             Marketing Canvas
  R104        U103             Project Draft

#### Table 3: `RoomInvite`

  id \[PK\]   roomId \[FK\]   userId \[FK\]
  ----------- --------------- ---------------
  I101        R101            U102
  I102        R102            U103
  I103        R103            U101
  I104        R104            U102

*The values above are illustrative examples, not actual database
records.*

### 5.5 Step-by-Step Explanation

1.  **Identify Multi-Valued Attributes:** Find fields such as
    `room_details` that contain several values in one cell.
2.  **Separate Independent Entities:** Store users, rooms, and
    invitations in their own relations.
3.  **Create Atomic Rows:** Store one room per `Room` row and one
    invitation per `RoomInvite` row.
4.  **Establish Keys and Relationships:** Use primary keys to identify
    records and foreign keys to connect related records.

### 5.6 Result

The supplied schema follows the 1NF structure because its models use
individual scalar attributes and represent related records through
separate relations. It does not store a list of rooms or invitations
inside a single relational field.

------------------------------------------------------------------------

## 6. Second Normal Form (2NF)

### 6.1 Definition & Rules of 2NF

A relation R is in **Second Normal Form (2NF)** if and only if:

1.  It is already in **First Normal Form (1NF)**.
2.  No non-prime attribute is partially functionally dependent on any
    candidate key. Every non-key attribute must depend on the whole
    candidate key.

### 6.2 Understanding Partial Functional Dependency

A **Partial Dependency** occurs when a relation has a composite
candidate key, such as `(A, B)`, and a non-key attribute depends on only
one part of that key.

For example:

-   `(user_id, room_id) → invitation_status`
-   `user_id → user_name`

Here, `user_name` depends only on `user_id`, not on the complete
composite key. This is a partial dependency.

> **Key DBMS Rule:** A relation whose candidate keys are all single
> attributes cannot have a partial dependency on those keys, because a
> single attribute has no proper subset.

### 6.3 Example Using a Sketchpad Room-Invitation Relationship

Suppose an early version of Sketchpad stores user details, room details,
and invitation information in one combined relation:

-   **Composite Primary Key:** `(user_id, room_id)`
-   **Attributes:** `user_id`, `room_id`, `user_name`, `room_title`,
    `invitation_status`

The combined relation mixes user attributes, room attributes, and
invitation attributes.

### 6.4 Before-Normalization Table (Violates 2NF)

#### Table: `User_Room_Invitation`

  -------------------------------------------------------------------------------
  user_id \[PK\] room_id \[PK\] user_name      room_title     invitation_status
                                (Partial)      (Partial)      
  -------------- -------------- -------------- -------------- -------------------
  U101           R101           Aarav          Design Board   Accepted

  U101           R102           Aarav          Team           Pending
                                               Whiteboard     

  U102           R101           Priya          Design Board   Pending

  U103           R102           Rohan          Team           Accepted
                                               Whiteboard     
  -------------------------------------------------------------------------------

#### Dependency Breakdown

-   `(user_id, room_id) → invitation_status` is a **Full Functional
    Dependency** in this illustrative relation.
-   `user_id → user_name` is a **Partial Dependency**, because the name
    depends only on `user_id`.
-   `room_id → room_title` is a **Partial Dependency**, because the
    title depends only on `room_id`.

#### Operational Anomalies

-   **Redundancy:** A user's name is repeated for every room associated
    with that user.
-   **Update Anomaly:** If a room title changes, every combined record
    containing that room must be updated.
-   **Insertion Anomaly:** A user who has not been invited to a room
    cannot be represented in this combined relation without a room
    value.
-   **Deletion Anomaly:** Deleting the only invitation record for a room
    could also remove the only stored copy of that room's title from the
    combined relation.

------------------------------------------------------------------------

### 6.5 After-Normalization Tables (2NF Compliant)

The partial dependencies are removed by storing user and room details in
their own relations and keeping invitation-specific data in the
relationship relation.

#### Table 1: `User` (2NF)

-   **Primary Key:** `id`

  id \[PK\]   name
  ----------- -------
  U101        Aarav
  U102        Priya
  U103        Rohan

#### Table 2: `Room` (2NF)

-   **Primary Key:** `id`

  id \[PK\]   title
  ----------- -----------------
  R101        Design Board
  R102        Team Whiteboard

#### Table 3: `RoomInvite` (2NF)

-   **Primary Key:** `id`
-   **Foreign Keys:** `roomId` references `Room(id)`; `userId`
    references `User(id)`.

  id \[PK\]   roomId \[FK\]   userId \[FK\]
  ----------- --------------- ---------------
  I101        R101            U101
  I102        R102            U101
  I103        R101            U102
  I104        R102            U103

*`invitation_status` is used only in the illustrative combined relation;
it is not present in the supplied Prisma `RoomInvite` model.*

### 6.6 Step-by-Step Decomposition Process

1.  **Identify the Composite Candidate Key:** Locate
    `(user_id, room_id)` in the illustrative combined relation.
2.  **Identify Partial Dependencies:** `user_name` depends only on
    `user_id`, while `room_title` depends only on `room_id`.
3.  **Separate User Attributes:** Store user details in `User`.
4.  **Separate Room Attributes:** Store room details in `Room`.
5.  **Keep Relationship Data Separate:** Store the user-room association
    in `RoomInvite`.
6.  **Enforce Referential Integrity:** Use foreign keys to reference the
    parent user and room records.

### 6.7 Evaluation of the Supplied Schema

In the supplied Prisma schema, every model has a single-column primary
key except `VerificationToken`, which has no explicitly declared primary
key and instead declares unique constraints. `Account` also has a
composite unique constraint on `(provider, providerAccountId)`, and its
other attributes are functionally determined by that complete pair.

The declared relations do not show a non-prime attribute depending on
only part of a composite candidate key. Therefore, the supplied
relations satisfy 2NF under the functional dependencies identified in
this document.

------------------------------------------------------------------------

## 7. Third Normal Form (3NF)

### 7.1 Definition & Rules of 3NF

A relation R is in **Third Normal Form (3NF)** if and only if:

1.  It is already in **Second Normal Form (2NF)**.
2.  It contains no disallowed transitive dependency of non-prime
    attributes on a candidate key.
3.  For every non-trivial functional dependency **X → Y**, at least one
    condition holds:
    -   **X is a Super Key** of the relation, OR
    -   **Y is a Prime Attribute**, meaning an attribute that is part of
        at least one candidate key.

### 7.2 Understanding Transitive Dependency

A **Transitive Dependency** occurs when a primary key determines a
non-key attribute, and that non-key attribute determines another non-key
attribute.

``` text
Primary Key (X) → Non-Key (Y)
Non-Key (Y) → Non-Key (Z)

Therefore, X → Z transitively through Y.
```

Descriptive information about a separate entity should be stored with
that entity rather than repeated in the referencing relation.

### 7.3 Relevant Sketchpad Example

Consider a hypothetical combined relation that stores a room's title and
its owner's email together with each room record:

-   **Primary Key:** `room_id`
-   **Functional Dependencies:**
    1.  `room_id → owner_id, room_title`
    2.  `owner_id → owner_email` (because each `owner_id` identifies one
        user)
    3.  Consequently, `room_id → owner_email` transitively through
        `owner_id`.

The owner email is a user attribute. It should be stored in `User`, not
repeated in every room record.

### 7.4 Before-Normalization Table (Violates 3NF)

#### Table: `Room_With_Owner_Details`

  room_id \[PK\]   room_title         owner_id   owner_email (Transitive)
  ---------------- ------------------ ---------- --------------------------
  R101             Design Board       U101       aarav@example.com
  R102             Team Whiteboard    U101       aarav@example.com
  R103             Marketing Canvas   U102       priya@example.com
  R104             Project Draft      U103       rohan@example.com

#### Dependency Breakdown

-   `room_id → room_title, owner_id` is valid because `room_id` is the
    primary key.
-   `owner_id → owner_email` holds because `owner_id` identifies a user
    whose email is unique.
-   Therefore, `room_id → owner_email` is a transitive dependency
    through `owner_id`.

#### Operational Problems

-   **Redundancy:** The same owner's email is repeated for every room
    that the user owns.
-   **Update Anomaly:** If a user changes their email address, all room
    records containing the old email would need to be updated.
-   **Insertion Anomaly:** A new user cannot be represented in this
    combined relation until a room is created for that user.
-   **Deletion Anomaly:** If the only room belonging to a user is
    deleted, the combined relation also loses the only stored copy of
    that user's email.

------------------------------------------------------------------------

### 7.5 After-Normalization Tables (3NF Compliant)

The transitive dependency is removed by storing user details in `User`
and room details in `Room`.

#### Table 1: `User` (3NF)

-   **Primary Key:** `id`
-   **Candidate Key:** `email`

  id \[PK\]   name    email \[Unique\]
  ----------- ------- -------------------
  U101        Aarav   aarav@example.com
  U102        Priya   priya@example.com
  U103        Rohan   rohan@example.com

#### Table 2: `Room` (3NF)

-   **Primary Key:** `id`
-   **Foreign Key:** `ownerId` references `User(id)`.

  id \[PK\]   title              ownerId \[FK\]
  ----------- ------------------ ----------------
  R101        Design Board       U101
  R102        Team Whiteboard    U101
  R103        Marketing Canvas   U102
  R104        Project Draft      U103

### 7.6 Step-by-Step Decomposition Process

1.  **Identify the Transitive Dependency:** Locate
    `owner_id → owner_email` in the illustrative combined relation.
2.  **Identify the Entity Owning the Attribute:** `owner_email`
    describes a user, not a room.
3.  **Store User Details Separately:** Keep the email in the `User`
    relation.
4.  **Retain the Foreign Key:** Keep `ownerId` in `Room` as a foreign
    key referencing `User(id)`.
5.  **Remove the Repeated Attribute:** Do not store `owner_email` in
    every room record.

### 7.7 Evaluation of the Supplied Schema

The supplied Prisma schema already separates user information from room
information:

-   `User` stores `name`, `email`, and other user attributes.
-   `Room` stores `title`, `createdAt`, and `ownerId`.
-   `Room.ownerId` references `User.id`.
-   `Post.createdById` references `User.id`.
-   `RoomInvite` references both `Room.id` and `User.id`.

The schema therefore avoids storing the user's email or name repeatedly
in the `Room`, `Post`, or `RoomInvite` models. Based on the declared
functional dependencies, no transitive dependency violation is evident
in the supplied relations. The schema satisfies 3NF under these
assumptions.

------------------------------------------------------------------------

## 8. Boyce-Codd Normal Form (BCNF)

### 8.1 Definition & Rules of BCNF

A relation R is in **Boyce-Codd Normal Form (BCNF)** if and only if, for
every non-trivial functional dependency **X → Y**:

> **X must be a Super Key of R.**

BCNF is stricter than 3NF. 3NF permits a dependency when its right-hand
side is a prime attribute, even if the determinant is not a superkey.
BCNF does not allow this exception.

### 8.2 Evaluation of the Supplied Sketchpad Schema

The supplied Sketchpad schema uses primary keys and unique constraints
to identify records:

-   `User`: `id` and the unique `email` identify a user.
-   `Account`: `id` and `(provider, providerAccountId)` identify an
    account.
-   `Session`: `id` and the unique `sessionToken` identify a session.
-   `VerificationToken`: `token` is unique, and `(identifier, token)` is
    also declared unique.
-   `Post`: `id` identifies a post.
-   `Room`: `id` identifies a room.
-   `RoomInvite`: `id` identifies an invitation.

For the functional dependencies represented by these declared keys and
unique constraints, each determinant is a candidate key or a superkey of
its relation. No non-trivial functional dependency with a non-superkey
determinant is specified by the supplied schema.

Therefore, **the seven supplied relations satisfy BCNF under the
functional dependencies and constraints declared in the Prisma schema**.

### 8.3 Illustrative Room-Collaboration Relation

To understand the determinant rule, consider a hypothetical future
feature that records which user is assigned to which room and the user's
collaboration role:

`Room_Collaboration (room_id, user_id, role)`

Suppose the business rules are:

1.  A user can participate in multiple rooms.
2.  A room can contain multiple users.
3.  A particular role is assigned to a user in a room.
4.  For this example, each user has one fixed role across all rooms.
5.  Multiple users may have the same role.

The functional dependencies are:

-   `(room_id, user_id) → role`
-   `user_id → role`

The candidate key is `(room_id, user_id)`, because a user can
participate in multiple rooms. `user_id` alone is not a superkey of the
relation because it does not determine `room_id`.

Thus, `user_id → role` has a determinant that is not a superkey. The
`role` attribute is not prime in this relation, so this example violates
both 3NF and BCNF. It illustrates a determinant violation, but it is
**not** a BCNF-only violation.

### 8.4 Correct BCNF Evaluation

For the actual supplied Sketchpad schema, a separate BCNF decomposition
is not required based on the declared dependencies. Each relation's
non-trivial dependencies are determined by its declared primary key or
unique candidate keys.

A valid BCNF-only example would require additional business rules and a
relation with overlapping candidate keys where a non-superkey
determinant determines a prime attribute. Those rules are not part of
the supplied Prisma schema, so they should not be assumed to exist in
the implemented database.

### 8.5 Step-by-Step BCNF Verification

1.  **List the Relations:** Identify all seven Prisma models.
2.  **Identify Candidate Keys:** Use the primary keys and unique
    constraints declared in the schema.
3.  **List the Functional Dependencies:** Determine which attributes are
    functionally determined by each candidate key.
4.  **Check Every Determinant:** For each non-trivial dependency
    `X → Y`, verify that `X` is a superkey.
5.  **Confirm the Result:** The declared dependencies are determined by
    candidate keys or superkeys; therefore, the supplied schema
    satisfies BCNF under the stated assumptions.

### 8.6 Result

The supplied Sketchpad schema satisfies BCNF based on its declared
primary keys, unique constraints, and relationships. No decomposition is
necessary for the current set of models solely to achieve BCNF.

------------------------------------------------------------------------

## 9. Final Conclusion

Through the analysis of the Sketchpad Prisma schema, we have evaluated
the database structure using the four major normal forms:

1.  **1NF (Atomicity):** The schema stores user, room, post, account,
    session, verification-token, and invitation records as separate
    relations. It does not define multi-valued room or invitation lists
    inside a single relational field.
2.  **2NF (No Partial Dependencies):** The schema's relations use
    single-column primary keys or declared candidate keys. No non-prime
    attribute is shown to depend on only part of a composite candidate
    key.
3.  **3NF (No Transitive Dependencies):** User details are stored in
    `User`, while room and post records reference users through foreign
    keys. User attributes such as email are not duplicated in the
    related models.
4.  **BCNF (Strict Superkey Determinants):** The non-trivial functional
    dependencies supported by the declared keys and unique constraints
    have candidate keys or superkeys as their determinants.

### Summary Matrix

  ------------------------------------------------------------------------
      Normal Form      Requirement      What It          Sketchpad
                                        Eliminates       Application
  -------------------- ---------------- ---------------- -----------------
          1NF       Atomic values;   Multi-valued     Users, rooms, and
                       no repeating     fields and       invitations are
                       groups.          repeating        represented as
                                        groups.          separate records.

          2NF        1NF + no partial Attributes       User and room
                       functional       depending on     details are kept
                       dependencies.    only part of a   outside the
                                        composite        room-invitation
                                        candidate key.   relationship.

          3NF        2NF + no         Non-key          User information
                       disallowed       attributes       is stored in
                       transitive       determining      `User` and
                       dependencies.    other non-key    referenced
                                        attributes.      through foreign
                                                         keys.

          BCNF       Every            Dependencies     The declared
                       determinant in a whose            key-based
                       non-trivial FD   determinants are dependencies in
                       must be a        not superkeys.   the seven Prisma
                       superkey.                         models satisfy
                                                         the BCNF
                                                         condition.
  ------------------------------------------------------------------------

By keeping users, rooms, invitations, posts, and authentication records
in separate relations, **Sketchpad** maintains a structured database
design with reduced duplication and clear relationships. The primary
keys, unique constraints, and foreign keys declared in the Prisma schema
help enforce entity integrity and referential integrity.

**Scope Note:** This document analyses the Prisma schema supplied for
the project. It does not assume additional tables for canvas objects,
shapes, comments, cursor activity, or collaboration permissions because
those models are not present in the provided schema. The schema declares
`provider = "postgresql"`; this analysis is therefore based on the
PostgreSQL relational model.
