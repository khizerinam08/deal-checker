# WorthIt - Find Foods Your Wallet Loves

<div align="center">

```text
                    ╔══════════════════════════════════════════════════════════╗
                    ║      _____  __        __         _   _     _ _           ║
                    ║     |  ___\ \ \      / /__  _ __| |_| |__ | | |_         ║
                    ║      \ \     \ \ /\ / / _ \| '__| __| '_ \| | __|        ║
                    ║       |_|     \ V  V / (_) | |  | |_| | | | | |_         ║
                    ║       (_)      \_/\_/ \___/|_|   \__|_| |_|_|\__|        ║
                    ╚══════════════════════════════════════════════════════════╝
```

</div>

**WorthIt** is a crowd-sourced food deal evaluation platform that helps users discover whether fast-food deals are actually worth the money. Unlike traditional review systems driven by ads and marketing, WorthIt leverages community feedback to provide **personalized value scores** based on your appetite size.


## What It Does

WorthIt solves a common problem: *"Is this deal actually good value for ME?"*

Traditional deal ratings don't account for individual appetite differences. A deal perfect for a light eater might leave a heavy eater hungry. WorthIt addresses this by:

1. **Categorizing users by "Eater Type"** (Small, Medium, or Large appetite)
2. **Collecting community reviews** on deal value and satiety
3. **Calculating personalized scores** that project how valuable a deal is for YOUR specific appetite

### Key Features

- **Personalized Value Scores** - Deals are scored based on your eater type, not generic averages
- **Crowd-sourced Reviews** - Real users rate deals on value and how full they felt
- **Blended Algorithm** - Combines peer reviews with mathematically projected scores from other eater types
- **Automated Deal Scraping** - Fresh deals pulled directly from vendor websites
- **Secure Authentication** - JWT-based auth with Neon Auth integration

---

## How It Works

### 1. User Onboarding
When a user first visits, they select their "eater type":
- **Small** - Light appetite (0.67x capacity ratio)
- **Medium** - Average appetite (1.0x baseline)
- **Large** - Heavy appetite (1.33x capacity ratio)

### 2. Deal Discovery
Users browse deals scraped from supported vendors (currently Domino's Pakistan). Each deal displays:
- Deal name, description, and price
- Extracted item breakdown (pizzas, drinks, sides, etc.)
- **Personalized value score** (0-10 scale)
- Number of reviews

### 3. Review System
Authenticated users can submit reviews for any deal, rating:
- **Value Rating** - "Was it worth the money?" (2.0, 6.0, or 10.0)
- **Satiety Rating** - "How full did it leave you?" (multiplier values)

### 4. Personalized Score Calculation

The app uses a **blended scoring algorithm** to simulate how a deal would feel to *you*, even if people with different appetite sizes reviewed it.

**The Problem:** A "Small" eater might rate a single burger meal **10/10** because it filled them up. A "Large" eater paying the same price might still be hungry, finding it poor value.

**The Solution:** We mathematically project scores across eater types so you get a personalized rating.

### How It Works

**1. Capacity Ratios**
We define how much food each group typically needs:
*   **Small**: `0.67` (Needs ~67% of a medium meal)
*   **Medium**: `1.00` (Baseline)
*   **Large**: `1.33` (Needs ~133% of a medium meal)

**2. The Formula**
When a user reviews a deal, we adjust their score for *your* capacity:

```math
ProjectedScore = ReviewerScore × (ReviewerCapacity / YourCapacity)
```

**3. Weighted Consensus**
We then combine all scores, but we trust your own "tribe" more:
*   **Same Type Reviews**: 100% Weight (Most trusted)
*   **Different Type Reviews**: 50% Weight (Trusted, but less)

### 💡 Real World Example
> You are a **Large Eater** (Capacity 1.33).
> A **Small Eater** (Capacity 0.67) rates a deal **10/10**.

Ideally, that meal is too small for you. The algorithm knows this:
*   **Calculation**: `10 × (0.67 / 1.33) = 5.0`
*   **Result**: You see a score of **5.0/10**, warning you that while it's great for them, it's not enough for you.

---


## Technologies Used

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router, Server Components |
| **React 19** | UI library with latest features |
| **TypeScript** | Type-safe development |
| **Neon Auth** | Authentication integration |
| **SWR** | Data fetching and caching |
| **CSS Modules** | Scoped, maintainable styling |

### Backend
| Technology | Purpose |
|------------|---------|
| **Express.js 5** | Node.js web framework |
| **Drizzle ORM** | Type-safe SQL query builder |
| **Neon Serverless** | PostgreSQL database (serverless) |
| **Jose** | JWT verification using JWKS |
| **CORS** | Cross-origin resource sharing |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** (Neon) | Primary database |
| **Drizzle Kit** | Schema migrations |

### Scraping & Automation
| Technology | Purpose |
|------------|---------|
| **Python 3.9** | Scraper runtime |
| **Selenium** | Browser automation for dynamic sites |
| **WebDriver Manager** | Automatic ChromeDriver management |
| **psycopg2** | PostgreSQL adapter for Python |
| **Docker** | Containerized scraper with Chrome |

### Deployment
| Technology | Purpose |
|------------|---------|
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |
| **GitHub Actions** | CI/CD pipelines |

---



<p align="center">
  <strong>WorthIt</strong> — Decided by people, not ads.
</p>