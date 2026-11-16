# nocosheet

nocosheet is an open-source, fully no-code CMS and spreadsheet-style database. Model your data, manage records and publish content without writing code. It is self-hostable on Cloudflare and uses Cloudflare services for everything it needs.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshot-dark.webp">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshot-light.webp">
  <img alt="nocosheet record grid" src="docs/screenshot-light.webp">
</picture>

## Features

### Data

- **No-code data modeling**: create tables and fields from the UI with a guided new-table wizard; schema changes are applied live
- **Spreadsheet-style grid**: browse and edit records in a fast, familiar grid
- **Advanced field types**: select and multi-select, dates, currency, attachments and computed fields
- **File uploads**: attach and manage files on records and see them in the grid
- **CSV import**: upload or paste a CSV, match its columns to your fields and preview the records before anything is added
- **Views**: save a set of columns and filters as its own grid
- **Forms**: pick the columns a form asks for and let members fill it in; every response becomes a record
- **Trash and recovery**: deleted tables and views are soft-deleted, protected by dependency checks and purged after 30 days

### Teams and security

- **Members**: invite and manage people in your workspace, and pin your favorite tables
- **Roles and access profiles**: members are administrators or members. Administrators can do everything; each member has one access profile with workspace-level and per-table grants and own/all record scopes
- **Audit log**: turn on auditing per table to log every record created, edited or deleted, with who did it and when. Entries are kept for 30 days
- **Account security**: sign in with a password or passkey, add an authenticator app and manage your sessions

### Developers

- **REST API and API keys**: read and write records from your own scripts and apps with API keys or bearer tokens, documented with an OpenAPI reference

### Hosting

- **Self-hosted on Cloudflare**: Workers, D1 and R2 on your own account, with no external services required

## Self-hosting

nocosheet runs entirely on your Cloudflare account. Deploy it as a Worker, bind a D1 database and an R2 bucket, and you are done.

## Contributing

nocosheet is open source and contributions are welcome. Open an issue to discuss an idea or send a pull request.
