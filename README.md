# Same Mouth

A small puzzle. Say **Red** or **Church**, notice your tongue and lips, and move the sliders until the side-view mouth matches that sound.

General American. Both real tongue shapes for *r* — bunched and curled — count as a match.

```bash
npm install
npm test
npm run dev
```

The drawing and the score use the same seven numbers: jaw, tongue front, tongue height, tongue tip, lips, opening, and nose. A sound locks when every slider that matters sits on a target for that sound. After the last lock, the mouth plays the word.
