# ☕ ChaiAndBlog

A dead-simple, clean blogging platform for cohort students. Write → Publish → Copy Link → Submit to cohort. That's it.

**🌍 Now with 21 languages powered by [Lingo.dev Compiler](https://lingo.dev)!**

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)
![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-blue)

## 🏗️ Architecture

This project uses a **monorepo** structure with Turborepo for better separation of concerns:

```
lingo/
├── apps/
│   ├── web/           → Next.js frontend (pages, components, Clerk auth)
│   └── api/           → Express backend (REST API, MongoDB)
├── packages/
│   └── shared/        → Shared TypeScript types
├── turbo.json         → Turborepo config
└── package.json       → Root workspace config
```

## 🌐 Live Demo

**[https://www.chaiand.blog](https://www.chaiand.blog)**

## ✨ Features

- **🌍 21 Languages** - Automatic translations powered by Lingo.dev Compiler
- **Medium-like Editor** - Beautiful writing experience with Tiptap
- **One-click Publish** - Instant publishing, no approval needed
- **Copy Link** - Share your blog anywhere
- **Community Feed** - Browse all published blogs with live search
- **Auto-save** - Never lose your work
- **Dark Theme** - Easy on the eyes

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Backend** | Express.js, MongoDB, Mongoose |
| **i18n** | Lingo.dev Compiler |
| **Editor** | Tiptap 3.15 |
| **Auth** | Clerk (GitHub & Google OAuth) |
| **Images** | ImageKit |
| **Rate Limiting** | Upstash Redis |
| **Monorepo** | Turborepo |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Clerk account
- ImageKit account
- Upstash Redis account

### Installation

1. Clone and install:
```bash
git clone https://github.com/YEDASAVG/chai_and_blog.git
cd chai_and_blog
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Build the shared package:
```bash
npm run build --workspace=@lingo/shared
```

4. Run development servers:
```bash
# Run both API and Web
npm run dev

# Or run separately
npm run dev:api   # API on port 4000
npm run dev:web   # Web on port 3000
```

## 📡 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/blogs` | GET | ✅ | Get user's blogs |
| `/api/v1/blogs` | POST | ✅ | Create/update blog |
| `/api/v1/blogs/:id` | GET | ✅ | Get blog for editing |
| `/api/v1/blogs/:id` | DELETE | ✅ | Delete blog |
| `/api/v1/profile` | GET | ✅ | Get current user profile |
| `/api/v1/profile` | PUT | ✅ | Update profile |
| `/api/v1/users/:username` | GET | ❌ | Public user profile |
| `/api/v1/upload` | POST | ✅ | Upload image |

## 🌍 Lingo.dev Integration

This project uses **Lingo.dev Compiler** for automatic multilingual support:

```typescript
// next.config.ts
import { withLingo } from "@lingo.dev/compiler/next";

export default async function () {
  return await withLingo(baseConfig, {
    sourceLocale: "en",
    targetLocales: ["es", "fr", "de", "hi", "ja", "zh", ...],
    models: "lingo.dev",
  });
}
```

### Supported Languages
English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Ukrainian, Swedish, Japanese, Korean, Chinese, Hindi, Thai, Vietnamese, Indonesian, Arabic, Turkish, Hebrew

## 📝 License

MIT

---

Built with ☕ by Abhiraj
