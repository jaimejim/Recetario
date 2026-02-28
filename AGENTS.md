# Agents

## Recetario Tasks

When adding recipes:

1. Read the source (photo, URL, or text) and extract ingredients and steps
2. Check `js/data.js` for duplicates before adding
3. Translate to both Spanish (`title`, `subtitle`, `steps`, `ingredientGroups`) and English (`titleEn`, `subtitleEn`, `stepsEn`, `ingredientGroupsEn` or inline `itemsEn`/`nameEn`)
4. Pick the right `category`: aperitivos, pasta, pescados, carnes, arroces, sopas, verduras, basicos, bebidas
5. Validate with `node -c js/data.js` after editing
6. Titles should be descriptive (e.g. "Smoothie de Zanahoria, Manzana y Plátano", not "Rise and Shine")
