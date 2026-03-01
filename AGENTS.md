# Agents

## Recetario Tasks

When adding recipes:

1. Read the source (photo, URL, or text) and extract ingredients and steps
2. Check `js/data.js` for duplicates before adding
3. Translate to both Spanish (`title`, `subtitle`, `steps`, `ingredientGroups`) and English (`titleEn`, `subtitleEn`, `stepsEn`, `ingredientGroupsEn`). Tips use `tip` and `tipEn` as separate top-level keys
4. Pick the right `category`: aperitivos, pasta, pescados, carnes, arroces, sopas, verduras, basicos, bebidas
5. Run `node validate.js` before committing — it checks EN keys, inline mistakes, count mismatches, duplicate IDs, valid categories, required fields, em dashes, and ASCII fractions
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

### Text conventions

- **Fractions**: Always use Unicode glyphs, never ASCII. The `esc()` function wraps them in `<span class="frac">` for larger rendering on the web, and `generate-book.js` renders them at base+2pt in the PDF.
  ```
  ✗ 1/2, 1/4, 3/4, 1/3, 2/3
  ✓ ½, ¼, ¾, ⅓, ⅔
  ```
- **No em dashes** (`—`). Use commas, colons, or rephrase.
- **Tips**: Attribute to the right person. Jaime = the user, Jaime Sr. = user's father. Other family: Mari, Vale, Laura, Sandro.
- **Servings**: Always a positive integer.
- **Steps/ingredient counts**: ES and EN arrays must have the same length. Same for ingredientGroups and ingredientGroupsEn group count.
