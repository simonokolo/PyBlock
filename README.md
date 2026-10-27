![PyBlock screenshot](/public/images/logo.png)

A block-based programming environment in the style of Scratch, built around Python. Users drag blocks together, and PyBlock turns them into Python code and runs it in the browser.

Live site: https://pyblock.vercel.app

Written for the OCR A-Level Computer Science NEA (2026). Marked 66/70.


## What it does

- Drag-and-drop blocks that generate Python code
- Runs the generated Python in the browser, with no server involved
- Account system, so signed-in users can save their projects to the cloud and open them again later

## How it works

The interface is plain HTML, CSS and JavaScript. When a user runs their blocks, the generated code is passed to [Pyodide](https://pyodide.org), which is CPython compiled to WebAssembly. That means the Python runs client-side, so there is nothing to host or secure on the execution side.

Accounts use Firebase Authentication. Saved projects are stored per user in Firebase.

The project is built with Vite and deployed on Vercel.

## Tech stack

- HTML, CSS, JavaScript
- Python (via Pyodide)
- Firebase (Authentication and project storage)
- Vite
- Vercel

## Running it locally

You need Node.js installed.

```bash
git clone https://github.com/simonokolo/PyBlock.git
cd PyBlock
npm install
npm run dev
```

Vite will print a local address to open. To make it reachable from other devices on your network, use `npm run devhost`. For a production build, use `npm run build`.

Signing in and saving projects needs a Firebase project. Add your own Firebase config to the app's Firebase setup file in `src`.

## Project structure

- `pages/` – the app's pages
- `public/` – static assets
- `src/` – application source
- `index.html` – entry point
- `vite.config.js` – build config

## Testing

The app was tested with real users during development, and their feedback shaped later changes.

## Licence

ISC
