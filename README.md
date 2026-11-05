# Mr Watts Office Twin

A digital twin of the Mr Watts office: one model of the office at a moment in time, which you can scrub back and forth like a watch crown. Built as an interview assignment for the UI/UX developer role.

![The overview: floor plan, time machine and status bar](docs/overview.png)

## What it answers

| Question from the brief | Where |
|---|---|
| Who is in the office right now? | People pill and sheet, filled desk chairs |
| How busy will the desks be? | People sheet: week bars and an expected count for future days, learned from the last 4 weeks |
| What music is playing? | Music pill and sheet: now playing, queue, played today |
| Which lights are on? | Energy sheet, per room |
| Which test devices are in the office? | Devices pill and sheet: borrowed by, city, battery, most used |
| Extra 1: energy | Derived from what is on: desktops, lights, speaker, screen, water, network |
| Extra 2: the time machine | Every screen shows the same moment, past or present |

Also included: meeting room bookings (free, in use, double booked), the front door's last lock and unlock, and water cups with CO₂ saved.

## Run it

```bash
npm install
npm run dev
```

`npm run build` type-checks and builds, `npm run lint` runs oxlint.

## Using the time machine

| Input | Does |
|---|---|
| Drag, throw, mouse wheel, click a day | Move through days (each day shows 10:00, or the hour you picked) |
| ← → | One day |
| ⌘ ← → | One week |
| Hold the crown for 1 s, or hold ↓ | Hour ticks appear between the days; move hour by hour |
| ↑ | Back to 10:00 on the same day |
| Space or Home | Back to now |

A **red** tick marks a day the front door was left unlocked after everyone left; a **yellow** tick, a day the lights were left on after office hours. In hour mode, every hour it lasted is coloured.

Every object on the floor plan and every pill opens its sheet. Escape closes it.

![A sheet: who is in the office](docs/sheet.png)

## How it works

```
crown → selection (day + hour) → moment → snapshotAt(moment) → every screen
```

- **One snapshot.** `App` turns the crown's selection into a moment and asks for one `Snapshot`. The header, floor plan, pills and sheets all render from it, so they can never disagree.
- **Derived, not stored.** Counts, energy, warnings, conflicts and "most used" are calculated from the snapshot in `data/derive.ts`. Nothing is copied into state.
- **Explicit unknowns.** The model has no `null`. In the future, people and device loans are `expected` with `estimated` times; lights and music are `unknown`, and the UI says so.
- **Forecast.** `data/forecast.ts` only reads the past. For a future moment, each person counts as expected if they were in at that time on at least half of the last 4 same weekdays. Backtested on the last 10 working days, it is off by 1.8 people a day on average. Devices work the same way: a device is expected out if the same person borrowed it at that time in at least half of those weeks. Energy is built from those forecasts: desktops from the expected people, the meeting room screen from the reservations, and lights and speaker from the average of the same 4 weeks (off by about 150 W on a typical 950 W).
- **Seeded history.** `data/history.ts` generates each past day from a seed (the date), so the same moment always looks the same. A day is planned once (who comes in, loans, meetings, cups), then read at any minute.
- **One visual language for predictions.** Solid is what happened, dashed is what's expected: in the week bars, the hourly energy bars, the desk seats and the cabinet slots.

## Structure

```
src/
  app/          shell, header, time machine (crown.ts · CrownTicks · TimeMachine), moment
  model/        types.ts — the domain model
  data/         catalogue, office constants, history (the past), forecast (the future), snapshot (picks one), derive (calculations)
  features/     overview (floor plan), people, devices, energy, music, meeting, door
  components/   ui (Sheet, List, Facts, Bars, StatPill, Notice, Avatar, tone) and icons
```

## Design decisions

- **One persona: the office manager.** He wants to know who is in, not where they sit. Desk chairs only fill in by count, and device locations are cities, never desks.
- **Apple-inspired:** dark, calm, grid-aligned and squircle shapes; one colour language (green = good, yellow = needs attention, grey = off or unknown, red = room in use or door left unlocked).
- **Progressive disclosure:** the pill gives the number, the sheet gives the detail.
- **Read-only:** the data comes from history, so the sheets show the office rather than control it.

## Not included (yet)

- A real backend: sensors, door and light integrations, and privacy (GDPR) for presence data
- Light mode, settings and a full mobile layout

## Stack

React 19, TypeScript, Tailwind CSS v4, Vite, oxlint. Frontend only, all data mocked.

Icons are SF Symbols, used for this prototype only: Apple's licence allows them in apps for Apple platforms, so a public release would need a different icon set.
