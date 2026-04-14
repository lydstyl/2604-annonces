# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real estate rental listing application for collecting rental applications. The app displays property listings with images, videos, and maps, then collects candidate information via a form that sends email notifications.

## Technology Stack

- **Framework:** Next.js 16.2.3 with App Router
- **Runtime:** React 19
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS 3.4
- **Data Storage:** JSON file-based storage in `/data/candidatures.json`
- **Email:** Nodemailer with SMTP notifications to lydstyl@gmail.com
- **Deployment:** Node.js + PM2 + Nginx on personal server

## Architecture

### Directory Structure

```
app/
  ├── annonce/[id]/                    # Listing detail pages
  │   └── page.tsx
  ├── candidature/[id]/                # Application form pages
  │   ├── page.tsx
  │   └── confirmation/
  │       └── page.tsx                 # Success confirmation page
  ├── api/
  │   └── candidatures/[id]/
  │       └── route.ts                 # POST endpoint for form submission
  ├── layout.tsx                       # Root layout with metadata
  ├── page.tsx                         # Home page (redirects to default listing)
  └── globals.css                      # Global styles and Tailwind utilities
components/
  ├── ImageCarousel.tsx                # Client component for image gallery
  ├── VideoEmbed.tsx                   # YouTube video iframe embed
  ├── MapEmbed.tsx                     # Google Maps iframe embed
  ├── FAQSection.tsx                   # Client component for collapsible FAQ
  └── ApplicationForm.tsx              # Client component for form with validation
lib/
  ├── listings.ts                      # Listing data and types
  ├── storage.ts                       # JSON file operations for candidatures
  └── email.ts                         # Email sending with nodemailer
public/
  └── images/                          # Property photos
data/
  └── candidatures.json                # Stored applications (gitignored)
```

### Key Pages

1. **Listing Page** ([app/annonce/[id]/page.tsx](app/annonce/[id]/page.tsx)): Displays property details with image carousel, YouTube embed, Google Maps, FAQ section, and CTA button
2. **Application Form** ([app/candidature/[id]/page.tsx](app/candidature/[id]/page.tsx)): Collects candidate information
3. **Confirmation** ([app/candidature/[id]/confirmation/page.tsx](app/candidature/[id]/confirmation/page.tsx)): Success page after submission

### Data Flow

```
Form Submission → API Route (/api/candidatures/[id]) →
  1. Validate data
  2. Save to JSON (lib/storage.ts)
  3. Send email (lib/email.ts)
  4. Return success → Redirect to confirmation page
```

### Listing Management

Listings are defined in [lib/listings.ts](lib/listings.ts). To add a new listing:

1. Add new entry to the `listings` object with unique ID
2. Add property images to `public/images/`
3. Update image paths in listing definition
4. Pages are generated statically at build time via `generateStaticParams()`

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Deployment Process

The application will be deployed on a personal server:

```bash
# Build for production
npm run build

# Start with PM2
pm2 start "npm start" --name "annonces-immobilier"

# Configure Nginx as reverse proxy
```

## Critical Requirements

### Email Notifications

**MANDATORY:** Every form submission must send an email to `lydstyl@gmail.com` containing ALL form fields, regardless of whether the candidate meets rental conditions.

### Application Form Fields

- nom (last name)
- prenom (first name)
- telephone (phone)
- email
- revenus mensuels (monthly income)
- peutFournirGarant (boolean: can provide guarantor)
- remarques (free text: additional comments)

### Rental Conditions (Display Only)

- Net income ≥ 3× rent including charges
- At least 1 permanent contract (CDI) in household, past probation period
- Complete application file required

### Media Integration

- Image carousel with provided property photos
- YouTube video embed: `https://www.youtube.com/watch?v=CLYk4N3QttI`
- Google Maps centered on "Raismes centre"

## Design Principles

- Mobile-first responsive design
- Modern, clean UI with Tailwind CSS
- Clear call-to-action buttons
- Component reusability for easy addition of new listings
- Minimal external dependencies

## Environment Variables

Before running the application, copy `.env.local.example` to `.env.local` and configure:

```bash
# Google Maps API Key (optional - will use basic embed if not provided)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password_here  # NOT your regular Gmail password!
EMAIL_FROM=your_email@gmail.com
EMAIL_TO=lydstyl@gmail.com
```

**Gmail SMTP Setup:**
- `SMTP_PASSWORD` must be an **App Password** (16 characters), NOT your regular Gmail password
- Enable 2-Step Verification: https://myaccount.google.com/security
- Generate App Password: https://myaccount.google.com/apppasswords
- The app password is different from your Gmail password and only allows SMTP email sending

## Code Organization

- **TypeScript:** All files use TypeScript with strict mode enabled
- **Client Components:** Use `'use client'` directive for interactive components (forms, carousels, accordions)
- **Server Components:** Default for pages and static content
- **Async Params:** Next.js 16 requires awaiting `params` in dynamic routes
- **File Naming:** Use PascalCase for components, kebab-case for routes
- **Comments:** Add JSDoc comments for complex functions, inline comments in French or English
