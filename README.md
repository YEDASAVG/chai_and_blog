# ☕ ChaiAndBlog

A dead-simple, clean blogging platform for cohort students. Write → Publish → Copy Link → Submit to cohort. That's it.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)
![Tiptap](https://img.shields.io/badge/Editor-Tiptap-blue)

## ✨ Features

- **Medium-like Editor** - Beautiful writing experience with Tiptap
- **One-click Publish** - Instant publishing, no approval needed
- **Copy Link** - Share your blog anywhere
- **Community Feed** - Browse all published blogs with live search
- **Auto-save** - Never lose your work
- **Dark Theme** - Easy on the eyes

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.1.3 (Turbopack) |
| **Editor** | Tiptap 3.15 |
| **Database** | MongoDB Atlas |
| **Auth** | Clerk (GitHub & Google OAuth) |
| **Images** | ImageKit |
| **Styling** | Tailwind CSS + shadcn/ui |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Clerk account
- ImageKit account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/chai_and_blogs.git
cd chai_and_blogs
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Add your credentials to `.env.local`:
```env
# MongoDB
MONGODB_URI=your_mongodb_uri

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_endpoint
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Dashboard, Feed, Profile pages
│   ├── api/             # API routes
│   ├── blog/[slug]/     # Public blog page
│   ├── edit/[id]/       # Edit blog page
│   ├── sign-in/         # Custom sign-in page
│   ├── sign-up/         # Custom sign-up page
│   └── write/           # New blog editor
├── components/          # Reusable components
├── lib/                 # Utilities & database connection
└── models/              # MongoDB models
```

## 🎯 User Flow

1. Sign in with GitHub or Google
2. Click "Write" to create a new blog
3. Write your content with the rich text editor
4. Click "Publish" when ready
5. Copy the blog link and share it

## 📝 License

MIT

---

Built with ☕ by [ChaiCode](https://chaicode.com)
