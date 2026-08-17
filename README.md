# Fort Bend Tickets

A Corporate website for **Fort Bend Tickets LLC**, a Texas-based ticket broker. Visitors can browse upcoming events, read event details, and request tickets. There is **no online checkout**, cart, or payment flow — inquiries go to the team via contact forms.

Live site: [fortbendtickets.com](https://fortbendtickets.com/)

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Events listing | `events.html` |
| Event details | `events/event.html?slug=<event-slug>` |
| Who We Are | `about.html` |
| Our Services | `services.html` |
| Let’s Talk / Contact | `contact.html` |
| Privacy Policy | `privacy.html` |
| Terms & Conditions | `terms.html` |

Shared styles live in `assets/css/styles.css`. Shared behavior (navigation, events catalog, forms, ticket-request modal) lives in `assets/js/main.js`.

## Local preview

This is a static HTML site with no build step. Event pages load `data/events.json` with `fetch()`, so open the files through a local server rather than `file://`.

From the project root:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Events

Event copy and imagery are driven by `data/events.json`. The listing on `events.html` and the detail template at `events/event.html` both read this file.

Each event object uses:

| Field | Purpose |
|---|---|
| `slug` | Unique ID; used in `events/event.html?slug=...` |
| `name` | Event title |
| `category` | Broad type (currently `sports`) |
| `filter` | Listing filter: `basketball`, `tennis`, `motorsports`, or `football` |
| `dateDisplay` / `timeDisplay` | Human-readable date and optional time |
| `sortDate` | ISO date (`YYYY-MM-DD`) used for ordering |
| `venue` / `country` | Location shown on the listing and detail page |
| `summary` / `description` / `about` | Short teaser and longer copy |
| `venueDescription` | Venue context on the detail page |
| `accommodationsIntro` / `accommodations` | Nearby-hotel notes |
| `image` / `imageAlt` | Card and hero image |
| `ticketUrl` | Reference link for the brokerage team (not a public “Buy now”) |
| `featured` | Featured events sort ahead of others |

To add or update an event:

1. Edit `data/events.json`.
2. If you introduce a new `filter` value, add a matching button in `events.html` and a label in `FILTER_LABELS` inside `assets/js/main.js`.
3. Add or update the corresponding URL in `sitemap.xml`.

`events.md` is a working notes file for event sourcing; the site does not read it at runtime.

## Inquiries

Contact and ticket-request forms post to [Formspree](https://formspree.io/) (`https://formspree.io/f/mwlerlod`). Phone number is optional and used to follow up on inquiries (orders, ticket availability, or pricing). If the SMS opt-in checkbox is selected, a phone number is required. A honeypot field is included for basic spam filtering.

Arriving at `contact.html` from an event can pre-fill event context via query parameters (for example `?event=<slug>`).

## Project docs

- [`Fort_Bend_Tickets_PRD.md`](Fort_Bend_Tickets_PRD.md) — product requirements
- [`Privacy_Policy_Fort_Bend_Tickets.md`](Privacy_Policy_Fort_Bend_Tickets.md) and [`Terms_and_Conditions_Fort_Bend_Tickets.md`](Terms_and_Conditions_Fort_Bend_Tickets.md) — legal source copy (HTML pages are the public versions)
- [`ringcentral-website-compliance-checklist.md`](ringcentral-website-compliance-checklist.md) — SMS / 10DLC website checklist
