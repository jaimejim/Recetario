#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync('./js/data.js', 'utf8').replace(/^const /gm, 'var ');
const ctx = {};
vm.runInNewContext(src, ctx);
const recipes = ctx.RECIPES;

const VALID_CATEGORIES = ['aperitivos', 'pasta', 'pescados', 'carnes', 'arroces', 'sopas', 'verduras', 'basicos', 'bebidas'];
const EM_DASH = /\u2014/;

let errors = 0;
const err = msg => { console.error(msg); errors++; };

// Duplicate IDs
const ids = recipes.map(r => r.id);
ids.forEach((id, i) => {
  if (ids.indexOf(id) !== i) err(`[${id}] duplicate id`);
});

recipes.forEach(r => {
  const id = r.id || '(no id)';

  // Required fields
  if (!r.id) err(`[${id}] missing id`);
  if (!r.title) err(`[${id}] missing title`);
  if (!r.steps || r.steps.length === 0) err(`[${id}] missing or empty steps`);
  if (!r.ingredientGroups || r.ingredientGroups.length === 0) err(`[${id}] missing or empty ingredientGroups`);
  if (!r.servings || r.servings < 1) err(`[${id}] missing or invalid servings`);

  // Valid category
  if (!VALID_CATEGORIES.includes(r.category)) err(`[${id}] invalid category "${r.category}"`);

  // EN top-level keys that loc() expects
  ['title', 'subtitle', 'steps', 'ingredientGroups'].forEach(field => {
    if (!r[field + 'En']) err(`[${id}] missing ${field}En`);
  });

  // tip must use tipEn, not textEn inside tip
  if (r.tip) {
    if (r.tip.textEn) err(`[${id}] tip has textEn inline — use tipEn instead`);
    if (!r.tipEn) err(`[${id}] has tip but missing tipEn`);
  }

  // ingredientGroups must not have inline nameEn/itemsEn
  (r.ingredientGroups || []).forEach((g, i) => {
    if (g.nameEn) err(`[${id}] ingredientGroups[${i}] has inline nameEn — use ingredientGroupsEn`);
    if (g.itemsEn) err(`[${id}] ingredientGroups[${i}] has inline itemsEn — use ingredientGroupsEn`);
  });

  // ingredientGroupsEn group count must match ingredientGroups
  if (r.ingredientGroupsEn && r.ingredientGroups) {
    if (r.ingredientGroupsEn.length !== r.ingredientGroups.length)
      err(`[${id}] ingredientGroupsEn has ${r.ingredientGroupsEn.length} groups, ingredientGroups has ${r.ingredientGroups.length}`);
  }

  // steps count must match
  if (r.stepsEn && r.steps && r.stepsEn.length !== r.steps.length)
    err(`[${id}] stepsEn has ${r.stepsEn.length} steps, steps has ${r.steps.length}`);

  // No em dashes in any text field
  const texts = [r.title, r.titleEn, r.subtitle, r.subtitleEn, ...(r.steps || []), ...(r.stepsEn || [])];
  if (r.tip) texts.push(r.tip.text);
  if (r.tipEn) texts.push(r.tipEn.text);
  texts.forEach(t => {
    if (t && EM_DASH.test(t)) err(`[${id}] em dash found: "${t.substring(0, 60)}..."`);
  });
});

if (errors) {
  console.error(`\n${errors} error(s) found`);
  process.exit(1);
} else {
  console.log(`✓ ${recipes.length} recipes validated`);
}
