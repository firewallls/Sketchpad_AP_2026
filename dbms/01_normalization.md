# Prisma schema — Normalization (1NF → 2NF → 3NF → BCNF)

## Scope

This normalizes `prisma/schema.prisma`: users, OAuth accounts, sessions, verification tokens, posts, rooms, and room invites. The debugging domain (submissions, runs, errors) isn't in this schema, so it isn't covered here. Notation: `X → Y` means "X determines Y", primary keys are **bold**, `{ ... }` is a repeating group.

## Unnormalized form

Everything on a profile page, assembled without splitting the lists:

```
USER_RECORD(
  user_id, name, email, email_verified, image, password,
  { account_id, provider, provider_account_id, type, access_token, refresh_token,
    expires_at, token_type, scope, id_token, session_state, refresh_token_expires_in },
  { session_id, session_token, expires },
  { post_id, post_name, created_at, updated_at },
  { room_id, title, room_created_at,
    { invite_id, invitee_user_id, invitee_email, invitee_name } }
)
```

The same data can also be stored wrongly by putting provider tokens on `User` as `access_token_google`, `access_token_github`, … — a repeating group spread across columns. That is exactly why NextAuth splits accounts out.

**Problems:** accounts, sessions, posts, rooms and invites are repeating groups; the owner's and invitee's details are copied into every post and room; changing an email means editing all of them; a provider can't be linked without rewriting the user row; deleting a user's last post deletes their only profile copy.

## 1NF

Give every table a key and every cell one value. Each repeating group becomes its own table keyed by the parent plus what identifies a member:

```
USER(user_id, name, email, email_verified, image, password)
USER_ACCOUNT(user_id, provider, provider_account_id, type, access_token, refresh_token, …)
USER_SESSION(user_id, session_token, expires)
USER_POST(user_id, post_id, post_name, created_at, updated_at)
USER_ROOM(user_id, room_id, title, room_created_at)
ROOM_INVITE(room_id, invitee_user_id)
VERIFICATION(identifier, token, expires)
```

Keys: **user_id**; (**user_id, provider, provider_account_id**); (**user_id, session_token**); (**user_id, post_id**); (**user_id, room_id**); (**room_id, invitee_user_id**); (**identifier, token**).

## 2NF

Remove columns that depend on only part of a composite key. Single-key tables are already fine.

| Table | Key | Partial dependency |
|-------|-----|--------------------|
| USER_ACCOUNT | (user_id, provider, provider_account_id) | (provider, provider_account_id) → all token columns |
| USER_SESSION | (user_id, session_token) | session_token → expires |
| USER_POST | (user_id, post_id) | post_id → post_name, created_at, updated_at |
| VERIFICATION | (identifier, token) | token → identifier, expires |

Two facts checked against the adapter rather than assumed:

- **`(provider, provider_account_id)` is the real account key** — the schema declares `@@unique([provider, providerAccountId])` and NextAuth looks accounts up by that pair.
- **`(user_id, provider)` is *not* a key** — the unique constraint allows one user to link two Google accounts.

After splitting:

```
ACCOUNT(account_id, user_id, type, provider, provider_account_id, …tokens…)   -- user_id is an FK, not part of the key
SESSION(session_id, session_token, user_id, expires)
POST(post_id, name, created_at, updated_at, created_by_id)
ROOM(room_id, owner_id, title, created_at)
ROOM_INVITE(room_id, user_id)
VERIFICATION_TOKEN(identifier, token, expires)
```

## 3NF

Remove columns that depend on another non-key column. All the transitive dependencies were the copied profile fields, and each is replaced by a foreign key:

| Chain | Fix |
|-------|-----|
| post_id → created_by_id → name, email, image | `POST` keeps only `created_by_id` |
| room_id → owner_id → name, email | `ROOM` keeps only `owner_id` |
| room_id → invitee_user_id → email, name | `ROOM_INVITE` keeps only `user_id` |
| account_id → user_id → email | `ACCOUNT` keeps only `user_id` |

Two columns look derived but are kept: `Post.updatedAt` is written by `@updatedAt` on every update, so it can't disagree with `createdAt`; `Room.title` has a literal default, which is a default value, not a dependency. `Account.type` is `"oauth"` on every row — a constant, so not a dependency.

### Final tables

```
USER(user_id, name, email, email_verified, image, password)
ACCOUNT(account_id, user_id, type, provider, provider_account_id, …tokens…)   FK user_id → USER
SESSION(session_id, session_token, user_id, expires)                         FK user_id → USER
VERIFICATION_TOKEN(identifier, token, expires)                               -- no FK, by design
POST(post_id, name, created_at, updated_at, created_by_id)                   FK created_by_id → USER
ROOM(room_id, owner_id, title, created_at)                                   FK owner_id → USER
ROOM_INVITE(room_id, user_id)                                                FK → ROOM, USER
```

| Table | Functional dependencies |
|-------|-------------------------|
| USER | user_id → all; email → user_id, … |
| ACCOUNT | account_id → all; (provider, provider_account_id) → all |
| SESSION | session_id → all; session_token → session_id, user_id, expires |
| VERIFICATION_TOKEN | token → identifier, expires |
| POST | post_id → name, created_at, updated_at, created_by_id |
| ROOM | room_id → owner_id, title, created_at |
| ROOM_INVITE | none besides the key (all-key table) |

## BCNF

| Table | Candidate keys | BCNF? |
|-------|----------------|-------|
| USER | {user_id}, {email} | Yes — both determinants are keys. |
| ACCOUNT | {account_id}, {provider, provider_account_id} | Yes. `(user_id, provider)` is not a key, which is what keeps it here. |
| SESSION | {session_id}, {session_token} | Yes. |
| VERIFICATION_TOKEN | {token} | Yes — `@@unique([identifier, token])` is a superkey of `{token}`. |
| POST | {post_id} | Yes — `@@index([name])` is not unique. |
| ROOM | {room_id} | Yes. |
| ROOM_INVITE | {id}, and {room_id, user_id} once the unique constraint is added | Yes. |

All seven tables are in BCNF.
