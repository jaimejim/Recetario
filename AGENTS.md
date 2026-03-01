# Agents

## Recetario Tasks

When adding recipes:

1. Read the source (photo, URL, or text) and extract ingredients and steps
2. Check `js/data.js` for duplicates before adding
3. Translate to both Spanish (`title`, `subtitle`, `steps`, `ingredientGroups`) and English (`titleEn`, `subtitleEn`, `stepsEn`, `ingredientGroupsEn`). Tips use `tip` and `tipEn` as separate top-level keys
4. Pick the right `category`: aperitivos, pasta, pescados, carnes, arroces, sopas, verduras, basicos, bebidas
5. Run `node validate.js` before committing — it checks EN keys, inline mistakes, and count mismatches
6. Validate syntax with `node -c js/data.js` after editing
7. Titles should be descriptive (e.g. "Smoothie de Zanahoria, Manzana y Plátano", not "Rise and Shine")

### EN translation structure

The renderer uses `loc(recipe, field)` which looks for `fieldEn` as a **top-level key**. Never use inline `nameEn`/`itemsEn` inside `ingredientGroups` or `textEn` inside `tip`.

```
✗ ingredientGroups: [{ name: '...', nameEn: '...', items: [...], itemsEn: [...] }]
✓ ingredientGroups: [{ name: '...', items: [...] }]
  ingredientGroupsEn: [{ name: '...', items: [...] }]

✗ tip: { text: '...', textEn: '...' }
✓ tip: { text: '...' }
  tipEn: { text: '...' }
```
