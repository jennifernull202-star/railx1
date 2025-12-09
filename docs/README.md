# THE RAIL EXCHANGE™ — PROJECT README

This repository powers The Rail Exchange™, a premium marketplace platform for:

- Hi-rail vehicles
- Locomotives
- Rail equipment & tools
- Materials
- Rentals
- Contractors for hire
- Rail services
- Full bidding and contractor verification ecosystem

This README summarizes the system architecture, engineering patterns, workflows, and core expectations.

---

## 🔷 System Architecture Overview

The platform is built on:

- Next.js 14 (App Router)
- TypeScript
- ShadCN UI + TailwindCSS
- MongoDB + Mongoose
- NextAuth (role-based authentication)
- Stripe subscriptions (Verified Contractor Badge - $24/month)
- AWS S3 or comparable storage for uploads
- Google Maps + Places API
- OpenAI for listing enhancement
- pdf-lib for spec sheet generation

---

## 🔷 Required Project Layout

The system uses the unified dashboard architecture defined in the Layout Blueprint:

- `/app/layout.tsx` → Global app layout  
- `/dashboard/layout.tsx` → Unified dashboard layout for all roles  
- `/dashboard/modules/*` → Role-based dashboard modules  
- `/marketplace/*` → Listing creation, detail pages, categories  
- `/marketplace/category/[slug]` → Category-specific listing pages  
- `/components/ui/*` → ShadCN components  
- `/components/forms/*` → Form elements  
- `/components/cards/*` → Listing & contractor cards  
- `/components/maps/*` → Map components  

Full folder hierarchy must match the blueprint exactly.

---

## 🔷 Dashboard System

The platform uses a unified dashboard containing four module groups:

- Buyer Dashboard  
- Seller Dashboard  
- Contractor Dashboard + Setup Flow  
- Admin Dashboard (full analytics)  

The dashboard auto-loads modules based on user role and contractor setup status.

---

## 🔷 Monetization System

The system includes paid add-ons:

- Featured Listing  
- Premium Placement  
- Elite Placement  
- Verified Contractor Badge ($24/month subscription)  
- AI Listing Enhancement  
- Spec Sheet Generator  

Stripe integration must be fully implemented with webhook support.

---

## 🔷 Search System

Search supports filtering by:

- Category  
- Location  
- Price  
- Condition  
- Verified contractors  
- Keyword  
- Add-on ranking logic  

Backed by `/api/search`.

---

## 🔷 Development Standards

All code MUST meet:

- Strict Master Development Plan  
- UI/UX Blueprint  
- Layout Blueprint  
- PR Review Checklist  
- Copilot Persona behavior  

No placeholders, no dummy data, no incomplete flows.

---

## 🔷 Final Rule

If any conflicts exist, ALWAYS defer to:

1. Strict Master Development Plan  
2. Layout Blueprint  
3. UI/UX Blueprint  
4. Copilot Persona  
5. PR Checklist  

This README summarizes the system but the full behavior is defined in the governing documents.
