# Recetario

Family recipe book — [recetario.jaime.win](https://recetario.jaime.win)

A static single-page app built with vanilla HTML, CSS, and JavaScript. Recipes are stored in `js/data.js` and rendered client-side with hash-based routing.

## Features

- Alphabetical index with search
- Recipe detail view (ingredients + steps)
- ES / EN language toggle
- Responsive, typewriter-styled design

## Development

No build step needed. Open `index.html` directly in a browser, or serve it with any static server:

```sh
npx serve .
```

Recipe data lives in `js/data.js`. Each entry follows this shape:

```js
{
  id:       'lentejas-chorizo',
  title:    'Lentejas con Chorizo',
  subtitle: 'Un clásico de cuchara...',
  servings: 4,
  category: 'sopas',           // aperitivos | pasta | pescados | carnes | arroces | sopas | verduras | basicos | bebidas
  ingredientGroups: [
    { name: 'Ingredientes', items: ['...'] }
  ],
  steps: ['...'],
  tip: { text: '...', author: '...' }  // optional
}
```
