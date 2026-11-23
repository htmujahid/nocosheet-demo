# Nocosheet

An open-source, offline-first no-code tool to track anything with your team. Set up tables for clients, jobs, tickets or whatever you track today in spreadsheets, invite your team, work offline and find anything by just asking. Runs on your own Cloudflare account, one installation per team.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshot-dark.webp" />
  <img alt="Nocosheet" src="docs/screenshot-light.webp" />
</picture>

## What you get

- **Tables in a few clicks**: create tables with a guided setup, bring in columns from a CSV file, or start from a ready-made template.
- **A grid that feels like a spreadsheet**: search, filter, sort, column summaries, edit right in the grid or open a row in its own panel.
- **Links and files**: link rows to rows in other tables, attach files and images.
- **Saved views**: save the columns and filters you use most as a view your team can open any time.
- **Import and export**: bring spreadsheets in from CSV and export any table or view back to CSV.
- **Ask in your own words**: describe what you want to see and the assistant applies the filters and sorts for you. It only looks, it never changes anything.
- **Trash**: deleted tables, fields and rows can be restored within 30 days.
- **Who sees what**: administrators and members, with access profiles that set permissions table by table.
- **Workspace**: a home page with stats and recent tables, a sidebar with search and favorites, members and an audit log.
- **Works offline**: your tables open instantly and rows can be added, edited and deleted without a connection. Changes are saved when you reconnect.
- **Installable**: add it to your home screen or desktop like any app.
- **Sign-in**: password, passkey, two-factor, Google sign-in, and account management.

## Run locally

```sh
pnpm install
pnpm dev
```

Copy `example.env` to configure settings. The first run asks you to create the first administrator at `/auth/setup`.

## Deploy

```sh
pnpm exec void deploy
```
