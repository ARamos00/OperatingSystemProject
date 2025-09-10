# File System Disk Simulator (JS)

I built a **from-scratch file system simulator** that runs in the browser. It models a disk and basic FS operations so I could experiment with block layouts, directories, and simple file workflows without OS dependencies.

## What’s here

* **Vanilla stack**: plain **JavaScript**, **HTML**, and **CSS** (no frameworks).
* **Single-page UI** served by `index.html`.
* All logic lives in `file-system.js`; styles in `styles.css`.

```
/index.html
/file-system.js
/styles.css
/.idea/            # editor config (ignored by runtime)
```

## Goals

* Simulate a **disk** with predictable layout.
* Provide minimal **FS primitives** (format/init, paths/dirs, create/read/write/delete).
* Keep it **visual and self-contained** (open the HTML file and play).

## Getting started

```bash
# clone, then just open index.html in a browser
# or use a static server if you prefer:
npx serve .
# then visit the printed localhost URL
```

## How it works (high-level)

* A **disk abstraction** sits under the file system layer (fixed layout, browser memory).
* The FS layer manages directories and files over that disk abstraction.
* The UI wires simple controls to the FS methods so you can create files/dirs,
  write/read content, and inspect the state.

