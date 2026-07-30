# WhisperBook

A premium, privacy-first storytelling platform where users can write personal stories, journals, poems, novels, travel experiences, memories, and secret notes. Every story is private by default and can only be accessed by the owner or explicitly authorised users.

## Features

- **Authentication** — Register, Login, Logout, Forgot Password, Reset Password, Change Password (JWT + bcrypt)
- **Story Studio** — Rich text editor with autosave, word count, reading time, cover images, version history
- **Story Management** — Create, edit, delete, archive, restore, favourite, search, filter, sort, tag, categorise
- **Privacy Controls** — Private, Shared with selected users, Password protected, Hidden, Archived
- **Secure Sharing** — Share by user with permission levels (View / Comment / Edit / Owner), or generate secure links with optional password, expiry, and view limits. Disable copy & download per story.
- **Collections & Categories** — Organise stories into collections, categories, and tags
- **Advanced Search** — Search by title, category, tag, date, privacy
- **Notifications** — Story shared, permission changed, password changed, new login, comment added
- **Activity Log** — Login, logout, story created/edited/deleted/shared, password changed
- **8 Themes** — Light, Dark, Vintage Book, Forest, Royal, Cyberpunk, Fantasy, Sakura (switches instantly across the whole app)
- **Profile** — Avatar, username, bio, writing statistics, joined date, recent stories, favourite theme
- **Memory Timeline** — Stories grouped by month
- **Writing Statistics** — Total stories, words, reading time, distribution
- **Admin Dashboard** — Workspace overview

## Tech Stack

**Frontend** (running live in this environment):
- Angular 20 (standalone components, signals)
- TypeScript
- Tailwind CSS
- Angular Router + Animations
- Supabase JS client (live backend)

**Backend** (reference source in `backend/`):
- Node.js + Express.js
- REST API architecture
- JWT authentication
- bcrypt password hashing
- Multer file uploads
- Express Validator
- Helmet + rate limiting
- MySQL (via mysql2)

**Database**:
- MySQL schema in `backend/database.sql` (reference)
- Supabase Postgres (live, provisioned, with Row Level Security)

## Project Structure

```
whisperbook/
├── src/                          # Angular frontend (live)
│   ├── app/
│   │   ├── components/           # Reusable UI: app-shell, story-card, rich-editor, modal, loader, toast
│   │   ├── pages/
│   │   │   ├── auth/              # Landing, Login, Register, Forgot, Reset
│   │   │   ├── app/               # Dashboard, Library, Story editor/reader, Collections, etc.
│   │   │   └── public/            # Shared-link reader
│   │   ├── services/              # Auth, Story, Meta, Notify, Theme, Toast
│   │   ├── guards/                # authGuard, guestGuard
│   │   ├── core/                  # Supabase client
│   │   ├── models/                # TypeScript interfaces
│   │   ├── app.ts                 # Root component
│   │   └── app.routes.ts          # Route definitions
│   ├── environments/
│   └── global_styles.css          # Design system + 8 themes
├── backend/                      # Node.js + Express + MySQL (reference source)
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── database.sql              # MySQL schema
│   ├── server.js
│   └── package.json
└── README.md
```

## Installation

### Frontend (live — already running)

```bash
npm install
npm run build      # production build
```

The dev server runs automatically. The frontend connects to a provisioned Supabase backend (credentials in `.env`).

### Backend (reference — Node.js + Express + MySQL)

```bash
cd backend
cp .env.example .env      # fill in DB credentials + JWT secret
mysql -u root -p < database.sql
npm install
npm start                 # API on http://localhost:5000
```

## REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot` | Forgot password |
| POST | `/api/auth/reset` | Reset password |
| POST | `/api/auth/change-password` | Change password |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stories` | List (filter by status, category, privacy, tag, search, sort) |
| GET | `/api/stories/:id` | Get one (owner or shared) |
| POST | `/api/stories` | Create |
| PUT | `/api/stories/:id` | Update |
| DELETE | `/api/stories/:id` | Delete |
| GET | `/api/stories/:id/versions` | Version history |
| GET | `/api/stories/shared/me` | Stories shared with me |

### Categories, Tags, Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/categories` | CRUD categories |
| GET/POST/DELETE | `/api/tags` | CRUD tags |
| GET/POST/PUT/DELETE | `/api/collections` | CRUD collections |
| POST/DELETE | `/api/collections/:id/stories/:storyId` | Add/remove story |
| GET | `/api/collections/:id/stories` | Collection contents |

### Permissions, Comments, Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/stories/:id/permissions` | List/grant permissions |
| PUT/DELETE | `/api/permissions/:id` | Update/remove permission |
| GET/POST | `/api/stories/:id/comments` | List/add comments |
| DELETE | `/api/comments/:id` | Delete comment |
| GET/POST/DELETE | `/api/bookmarks`, `/api/stories/:id/bookmark` | Bookmarks |

### Notifications, Activity, Themes, Shared Links, Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/read` | Mark read |
| PUT | `/api/notifications/read-all` | Mark all read |
| GET | `/api/activity` | Activity log |
| GET | `/api/themes` | Theme catalog |
| POST | `/api/stories/:id/shared-links` | Create secure link |
| GET | `/api/shared/:token` | Open shared story |
| DELETE | `/api/shared-links/:id` | Revoke link |
| GET/PUT | `/api/profile` | View/edit profile |

## Database Tables

`users`, `profiles`, `themes`, `categories`, `stories`, `story_versions`, `tags`, `story_tags`, `collections`, `collection_stories`, `permissions`, `comments`, `bookmarks`, `notifications`, `activity_logs`, `shared_links`

All with primary keys, foreign keys, indexes, and cascade delete where appropriate. See `backend/database.sql`.

## Security

- Passwords hashed with bcrypt
- JWT authentication on all protected routes
- Role-based access control (user / admin)
- Input validation with Express Validator
- Parameterised queries (mysql2) to prevent SQL injection
- Helmet security headers + rate limiting
- Secrets stored in `.env`
- Row Level Security on the live Supabase backend

## Themes

Eight hand-crafted themes switch instantly across the entire application: Light, Dark, Vintage Book, Forest, Royal, Cyberpunk, Fantasy, Sakura. Choose yours in Settings.

---

WhisperBook — your private storytelling sanctuary. Every word stays yours.
