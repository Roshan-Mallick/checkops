# CheckOps

A modern checklist management application with secure authentication, email verification, cloud synchronization, and Markdown checklist imports.

## Features

### Authentication

* Email and password signup
* Secure login with Supabase Auth
* Email verification workflow
* Persistent user sessions
* Logout support

### Checklist Management

* Create unlimited checklists
* Organize tasks into sections
* Mark items as complete
* Edit checklist titles and items inline
* Delete items, sections, or entire checklists
* Reset checklist progress

### Markdown Import

Import existing checklists directly from Markdown files.

Supported format:

```md
# Project Launch Checklist

## Planning
- [ ] Define scope
- [ ] Create roadmap

## Development
- [ ] Build MVP
- [ ] Test functionality
```

### Cloud Sync

* Automatic saving
* Persistent storage using Supabase
* Data available across browser sessions
* User-specific checklist storage

### Security

* Supabase Authentication
* Email verification required
* Row Level Security (RLS)
* User data isolation
* XSS protection through output escaping
* Secure UUID generation using `crypto.randomUUID()`
* Password length validation

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Supabase Authentication
* Supabase PostgreSQL Database
* Supabase Row Level Security

### Email Delivery

* Resend SMTP

### Deployment

* Netlify

---

## Database Schema

### checklists

| Column     | Type        |
| ---------- | ----------- |
| id         | text        |
| user_id    | uuid        |
| title      | text        |
| data       | jsonb       |
| created_at | timestamptz |
| updated_at | timestamptz |

---

## Security Model

CheckOps uses Supabase Row Level Security policies to ensure users can only access their own checklist data.

Policy:

```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

This prevents users from viewing, modifying, or deleting checklists belonging to other accounts.

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd checkops
```

### Run Locally

Python:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

---

## Supabase Setup

### Create Table

```sql
CREATE TABLE IF NOT EXISTS checklists (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklists"
ON checklists
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS checklists_user_idx
ON checklists(user_id);
```

### Configure Authentication

1. Enable Email Authentication.
2. Enable Email Confirmation.
3. Configure Site URL and Redirect URLs.
4. Add Supabase URL and Publishable Key to the application.

---

## Email Verification

CheckOps supports email verification using:

* Supabase Auth
* Resend SMTP

Verification emails are automatically sent when users create a new account.

---

## Project Structure

```text
checkops/
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## Future Improvements

* Team collaboration
* Shared checklists
* Checklist templates
* Due dates and reminders
* Drag-and-drop reordering
* Mobile app support
* Offline synchronization

---

## License

MIT License

Copyright (c) 2026 CheckOps
