THE RAIL EXCHANGE™ — MASTER BUILD INSTRUCTIONS FOR GITHUB COPILOT

Use these instructions to generate the entire codebase, including UI, backend, API routes, database models, search, add-ons, onboarding, dashboard systems, and all marketplace logic.

1. PROJECT IDENTITY

You are building The Rail Exchange™, a full-stack online marketplace and contractor ecosystem for the railroad industry.
The platform includes:

Marketplace for rail assets, equipment, materials, and services

Contractor directory and verification system

Google Maps–powered search

Listing add-on monetization

AI tools for listing enhancement

Messaging, notifications, saved searches, and watchlists

Seller onboarding

Contractor onboarding with verification logic

Admin oversight dashboards

2. TECH STACK REQUIREMENTS

Copilot must generate all code using:

Next.js 14 (App Router)

React

TypeScript

Tailwind CSS

MongoDB with Mongoose

NextAuth for authentication

AWS S3 for file uploads

Google Maps API/Places API

OpenAI API for AI listing tools

3. PROJECT STRUCTURE (MANDATORY FOR COPILOT)

Use this structure:

/app
  /auth
  /dashboard
    /admin
    /contractor
    /user
  /marketplace
  /contractors
  /api
    /auth
    /listings
    /contractors
    /addons
    /messages
    /search
/models
/utils
/components
/public
/scripts

4. CORE MARKETPLACE REQUIREMENTS

Copilot must generate:

4.1 Listing System

Each listing must include:

Title

Description

Price

Category

Region

Seller

Photos (S3 upload)

Add-ons selected

Verified Asset Badge (optional purchase)

API Endpoints:

POST   /api/listings
GET    /api/listings
GET    /api/listings/:id
PUT    /api/listings/:id
DELETE /api/listings/:id

4.2 Listing Add-On Logic

Copilot must implement the following:

Featured Listing ($20)

Shown in homepage featured section

Ranking boost

Premium Placement ($50)

Pinned to top of category

Elite Placement ($99)

Homepage + category top + boosted search ranking

AI Listing Enhancement ($10)

Use OpenAI to rewrite:

Title

Description

Generate SEO keywords

Spec Sheet Auto-Build ($25)

Generate PDF spec sheet from listing data.

Add-on purchase endpoint:

POST /api/addons/purchase

5. SEARCH ENGINE REQUIREMENTS

Copilot must build full search:

Keyword

Category

Region/State

ZIP code

Radius

Google Places autocomplete

Verified badge filter

Boost ranking based on add-ons

API:

GET /api/search

6. GOOGLE MAPS + CONTRACTOR SEARCH

Copilot must implement a full-screen or embedded maps component:

Shows contractor locations

Autocomplete search bar

Filters by services offered

Clickable contractor pins

Links to contractor profile pages

7. CONTRACTOR SYSTEM

Copilot must generate:

7.1 Registration Flow

User chooses:

Buyer/Seller

Contractor

7.2 Contractor Onboarding

Fields required:

Business name

Contact info

Services offered

Regions served

Insurance documents

Safety documents

Experience summary

Equipment fleet

Logo + photos

Option to purchase Verified Badge ($15)

API:

POST /api/contractors/onboard
PUT  /api/contractors/:id
GET  /api/contractors

7.3 Contractor Profile Pages

Must include:

Overview

Services

Regions served

Google Map

Reviews

Contact buttons

Verification status

8. ACCOUNT SYSTEM

Copilot must build:

Register

Login

Logout

Forgot password

Session persistence

Multi-role dashboards

Profile editing

9. DASHBOARDS

Copilot must create:

9.1 User Dashboard

Manage listings

Watchlist

Saved searches

Messages

Profile settings

9.2 Contractor Dashboard

Manage contractor profile

Projects

Documents

Purchased add-ons

Verification status

Messaging

Leads received

9.3 Admin Dashboard

Approve or reject listings

Approve contractor verification

Moderate content

User management

Add-on logs

Reports

10. MESSAGING SYSTEM

Copilot must generate:

Inbox

Thread list

Chat window

File attachments

Notifications for new messages

API:

GET  /api/messages
POST /api/messages
GET  /api/messages/thread/:id

11. SAVED SEARCH + WATCHLIST SYSTEM

Copilot build endpoints:

POST /api/savedsearches
GET  /api/savedsearches
POST /api/watchlist
GET  /api/watchlist

12. NOTIFICATION SERVICE

Copilot must generate:

Database model

Notification UI

Notification triggers for:

New messages

Listing approvals

Saved search matches

Price updates

Add-on expirations

13. HOMEPAGE REQUIREMENTS

Homepage must include:

Hero section with global search bar

Featured categories

Google Maps contractor search section

Featured listings (add-ons)

Add-on explanation blocks

Recent listings

Calls to action (Become a contractor, List an item, Browse marketplace)

Light, modern, clean design (NOT heavy header)

14. DATABASE MODELS (MANDATORY FOR COPILOT)

Copilot must create all models below:

User

Listing

ContractorProfile

Notification

Message

Watchlist

SavedSearch

AddOnPurchase

VerificationDocuments

15. ENVIRONMENT VARIABLES

Copilot must configure:

DATABASE_URL=
NEXTAUTH_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
NEXTAUTH_URL=

16. DEVELOPER RULES FOR COPILOT

Copilot must follow these rules when generating code:

Use TypeScript everywhere

Use server components when possible

Validate all API inputs

Use Mongoose schemas strictly

Never generate placeholder logic

Always implement full CRUD

Ensure all components are responsive

Use Tailwind CSS

Use clean modern UI without oversized headers

Use professional marketplace layout patterns

Make every page functional end-to-end

17. FINAL EXPECTATION

Copilot is responsible for building:

The entire UI

All functional components

All API routes

All backend logic

All database models

All marketplace workflows

All contractor workflows

All dashboards

Full search system

Full Google Maps integration

Full authentication system

Full messaging system

Full notification system

Full add-on monetization engine

AI integrations

Deployment-ready Next.js project

Copilot must auto-generate missing files and ensure the system runs end-to-end.
