# BloxdWorldCode Workshop

A lightweight community mod-sharing app for BloxdWorldCode. Users can browse submitted mods, inspect their code, and publish new workshop entries from a simple web form.

This project combines a static front-end with Vercel serverless functions and a Supabase backend for storage.

## Features

- Browse a community list of submitted mods
- Submit new mods with title, creator, description, and code payload
- Inspect a mod before copying it
- One-click copy of a selected mod's code
- Built-in anti-spam cooldown for submissions
- Basic creator-name validation to prevent emoji/special icon abuse
- Vercel-ready deployment setup

## Tech Stack

- HTML, CSS, JavaScript
- Vercel serverless functions
- Supabase for storage and retrieval
- Node.js package setup for dependency management

## Project Structure

```text
.
├── api/
│   ├── get-mods.js
│   └── submit-mod.js
├── app.js
├── index.html
├── style.css
├── package.json
├── vercel.json
└── README.md
```

## How It Works

- The browser loads the mod list from `/api/get-mods`
- New submissions are sent to `/api/submit-mod`
- The API connects to a Supabase table named `workshop_codes`
- The front end renders mod cards and opens a modal with the selected payload

## API Endpoints

### GET /api/get-mods

Returns all submitted workshop entries ordered by newest first.

### POST /api/submit-mod

Accepts a JSON payload with:

```json
{
  "title": "Example Mod",
  "creator": "PlayerName",
  "description": "Adds a custom UI feature",
  "code_content": "print('hello')"
}
```

The API validates:

- missing required fields
- duplicate post cooldown by IP
- invalid creator name characters

## Local Development

1. Clone the repository:

```bash
git clone https://github.com/Shahadah-studs/BloxdWorldCode-workshop.git
cd BloxdWorldCode-workshop
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file for required Supabase settings:

```bash
# .env.local
SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

4. Run the project locally with Vercel:

```bash
npx vercel dev
```

Then open the local URL shown in the terminal.

## Deployment

This project is designed for deployment on Vercel.

```bash
vercel --prod
```

Make sure your Vercel project has the required environment variables configured:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase Table

The API expects a Supabase table named `workshop_codes` with fields such as:

- `title`
- `creator`
- `description`
- `code_content`
- `created_at` (optional, used for ordering)

## Notes

- The frontend is a single-page workshop UI with a browse tab and a submit tab.
- The app currently assumes a Vercel-hosted deployment and uses serverless functions under the `api/` directory.
- No explicit license file is included in the repository at this time.

## Contributing

Contributions are welcome. If you want to improve the front end, add moderation tools, or enhance the API validation, feel free to open a pull request.

## Project Status

This repository is a functional workshop prototype for sharing BloxdWorldCode mod payloads and is ready for local development and Vercel deployment with the proper Supabase configuration.
