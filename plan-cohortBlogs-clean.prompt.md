# Plan: ChaiAndBlog.com

A dead-simple, clean blogging platform for cohort students. Write → Publish → Copy Link → Submit to cohort. That's it.

---

## Problem Statement

- Existing blogging platforms suck:
  - **Hashnode**: Terrible editor, bloated features
  - **Medium**: Paywalled, readers hit paywall
  - **Twitter/X**: Not for blogs
  - **Dev.to**: Clunky, slow
- Students just need to: **Write a blog → Get a link → Submit to cohort**
- No platform does this simply and cleanly

---

## Solution: ChaiAndBlog.com

A minimal blogging platform that does ONE thing well:
1. **Write** (Medium-quality editor)
2. **Publish** (instant, no approval)
3. **Share** (copy link, submit to cohort externally)

**NOT our problem:**
- Topic assignments (cohort handles this)
- Submission tracking (cohort handles this)
- Grading/feedback (cohort handles this)

---

## User Flow

1. User gets topic from cohort (e.g., "Git Version Control")
2. User comes to chaiandblog.com
3. User logs in
4. Dashboard shows: Recent blogs + "Write" button
5. Click "Write" → Medium-like editor opens
6. Write the blog with images, code, formatting
7. Click "Publish"
8. Blog goes live → appears in Feed
9. Copy the blog link
10. Submit link to cohort's submission page (external)

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Auth** | Simple login (invite-only or open signup) |
| **Dashboard** | List of YOUR blogs (drafts + published) |
| **Write** | Medium-like editor with full formatting |
| **Publish** | One click, instant publish |
| **Feed** | See all published blogs from students |
| **Copy Link** | Shareable URL for each blog |

---

## Features to EXCLUDE

| Feature | Why NOT |
|---------|---------|
| ❌ Topic management | Cohort's job |
| ❌ Submission tracking | Cohort's job |
| ❌ Admin dashboard | Not needed |
| ❌ Comments | Keep it simple |
| ❌ Likes/Reactions | Not social media |
| ❌ Followers | Not social media |
| ❌ Analytics | Distraction |
| ❌ SEO features | Not needed |
| ❌ Monetization | Not Medium |

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing or redirect to dashboard |
| `/login` | Login page |
| `/signup` | Signup page |
| `/dashboard` | Your blogs list + "Write" button |
| `/write` | The editor (new blog) |
| `/edit/[id]` | Edit existing blog |
| `/blog/[slug]` | Public blog page (shareable link) |
| `/feed` | All published blogs |
| `/profile` | Your profile |

---

## Tech Stack (Latest Stable - Jan 2026)

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 16.1.3 | LTS, Turbopack, fast |
| **Editor** | Tiptap 3.15 | Medium-like, extensible |
| **Database** | MongoDB Atlas | 512MB free, JSON storage |
| **Auth** | Clerk | Zero auth code, handles everything |
| **Images** | ImageKit | 20GB free, unlimited transforms |
| **Styling** | Tailwind + shadcn/ui | Fast UI development |
| **Hosting** | Vercel | Free tier, easy deploy |

**Total cost: $0** for 200+ students

---

## Why This Tech Stack?

### MongoDB Atlas
- ✅ 512MB free forever (no pausing)
- ✅ Simple JSON documents (Tiptap outputs JSON)
- ✅ No migrations needed
- ✅ Automatic backups

### ImageKit
- ✅ 20GB storage free
- ✅ 20GB bandwidth/month free
- ✅ Unlimited image transformations
- ✅ Auto WebP conversion
- ✅ Global CDN

### Why NOT Supabase?
- ❌ Complex (RLS policies, edge functions)
- ❌ Projects pause after 7 days inactivity
- ❌ Overkill for simple blog

### Clerk for Auth
- ✅ Zero auth code to write
- ✅ Pre-built UI components (sign-in, sign-up, user button)
- ✅ 10,000 MAU free tier
- ✅ OAuth providers (GitHub, Google) out of the box
- ✅ Handles sessions, JWT, middleware automatically

---

## Database Structure

### Users Collection
- id, email, name, username, avatar, created_at

### Blogs Collection
- id, author_id, title, slug, content (JSON), cover_image
- status (draft/published), published_at, created_at, updated_at

That's it. Just 2 collections.

---

## Editor Features (THE CORE)

The editor must feel as good as Medium. This is the main differentiator.

### Writing Experience
- Large, clean title field
- Distraction-free UI
- "Tell your story..." placeholder
- Auto-focus on load

### Text Formatting
- Bold, Italic, Underline
- Headings (H1, H2, H3)
- Bullet & Numbered lists
- Blockquotes
- Inline code
- Horizontal rule

### Markdown Shortcuts
- `#` + space → Heading
- `**text**` → Bold
- `*text*` → Italic
- `-` + space → Bullet list
- `>` + space → Quote
- `---` → Divider

### Floating Toolbar
- Appears on text selection
- Bold, Italic, Link, Code, Heading options

### Plus Menu
- Appears on empty lines
- Insert: Image, Code Block, Divider, Embed

### Images
- Drag & drop upload
- Paste from clipboard
- Resize & alignment
- Auto-optimization via ImageKit

### Code Blocks
- Syntax highlighting (JS, Python, Rust, etc.)
- Language selector
- Copy button
- Tab indentation

### Links
- Select text + paste URL
- Ctrl+K shortcut
- Edit/remove option

### Embeds (Nice to Have)
- YouTube videos
- Twitter posts
- CodePen
- GitHub Gist

### Auto-Save
- Save every 30 seconds
- "Saving..." / "Saved" indicator
- Offline support (localStorage)
- Draft recovery

### Keyboard Shortcuts
- Ctrl+B (Bold), Ctrl+I (Italic)
- Ctrl+K (Link), Ctrl+S (Save)
- Ctrl+Z (Undo), Ctrl+Shift+Z (Redo)

---

## UI Layout

### Dashboard
```
┌──────────────────────────────────────────────────┐
│  ☕ ChaiAndBlog                    [User] [Write]│
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Dashboard │     Your Blogs                      │
│  Write     │     ┌───────────────────────────┐   │
│  Feed      │     │ Blog Title         DRAFT  │   │
│  Profile   │     │ Jan 15, 2026               │   │
│            │     └───────────────────────────┘   │
│            │     ┌───────────────────────────┐   │
│            │     │ Blog Title         LIVE   │   │
│            │     │ Jan 10     [Copy Link 📋] │   │
│            │     └───────────────────────────┘   │
└────────────┴─────────────────────────────────────┘
```

### Editor
```
┌────────────────────────────────────────────────────┐
│  ← Back                      [Save Draft] [Publish]│
├────────────────────────────────────────────────────┤
│                                                    │
│   Title                                            │
│   ════════════════════════════════════════════     │
│                                                    │
│   Tell your story...                               │
│                                                    │
│   [+] ← Plus menu on empty lines                   │
│                                                    │
│                                                    │
│                                                    │
│                        Word count: 0               │
└────────────────────────────────────────────────────┘
```

---

## Feed Implementation

- Cursor-based pagination (not offset)
- Load 10 blogs at a time
- Infinite scroll on frontend
- Sorted by published_at descending

---

## Image Handling

- User uploads image in editor
- Image sent to ImageKit via their API
- ImageKit returns CDN URL
- URL stored in blog content
- Auto-optimization via URL parameters

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MongoDB 512MB limit | High usage | Monitor, upgrade to $9/mo if needed |
| ImageKit 20GB limit | Image heavy users | Compress images, cleanup old drafts |
| No moderation | Bad content | Trust cohort, add report button later |
| Downtime | Users can't write | Accept for MVP, Vercel is reliable |

---

## Development Timeline (10 Days)

| Days | Tasks |
|------|-------|
| **1-2** | Project setup, MongoDB, ImageKit, Auth |
| **3-5** | Tiptap editor, image upload, blog CRUD, auto-save |
| **6-7** | Dashboard, Feed (paginated), Public blog page |
| **8-9** | Copy link, mobile responsive, polish |
| **10** | Deploy to Vercel, test with users |

---

## MVP Checklist

- [ ] User can sign up / log in
- [ ] User sees dashboard with their blogs
- [ ] User can write new blog with Tiptap editor
- [ ] User can add images (ImageKit)
- [ ] User can add code blocks with syntax highlighting
- [ ] Auto-save works
- [ ] User can publish
- [ ] Published blog has shareable URL
- [ ] User can copy link with one click
- [ ] Feed shows all published blogs (paginated)
- [ ] Works on mobile

---

## Open Questions

1. ✅ **Database:** MongoDB Atlas
2. ✅ **Auth:** Open signup via Clerk
3. 🔲 **Domain:** TBD

---

## Next Steps

1. ✅ Finalize plan
2. 🔲 Create MongoDB Atlas cluster
3. 🔲 Create ImageKit account
4. 🔲 Create Clerk application
5. 🔲 Create Next.js project
6. 🔲 Build editor first (core value)
7. 🔲 Ship MVP in 10 days
