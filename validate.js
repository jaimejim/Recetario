#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync('./js/data.js', 'utf8').replace(/^const /gm, 'var ');
const ctx = {};
vm.runInNewContext(src, ctx);
const recipes = ctx.RECIPES;

let errors = 0;

recipes.forEach(r => {
  const id = r.id;

  // EN top-level keys that loc() expects
  ['title', 'subtitle', 'steps', 'ingredientGroups'].forEach(field => {
    if (!r[field + 'En']) {
      console.error(`[${id}] missing ${field}En`);
      errors++;
    }
  });

  // tip must use tipEn, not textEn inside tip
  if (r.tip) {
    if (r.tip.textEn) {
      console.error(`[${id}] tip has textEn inline — use tipEn instead`);
      errors++;
    }
    if (!r.tipEn) {
      console.error(`[${id}] has tip but missing tipEn`);
      errors++;
    }
  }

  // ingredientGroups must not have inline nameEn/itemsEn
  (r.ingredientGroups || []).forEach((g, i) => {
    if (g.nameEn) {
      console.error(`[${id}] ingredientGroups[${i}] has inline nameEn — use ingredientGroupsEn`);
      errors++;
    }
    if (g.itemsEn) {
      console.error(`[${id}] ingredientGroups[${i}] has inline itemsEn — use ingredientGroupsEn`);
      errors++;
    }
  });

  // ingredientGroupsEn group count must match ingredientGroups
  if (r.ingredientGroupsEn && r.ingredientGroups) {
    if (r.ingredientGroupsEn.length !== r.ingredientGroups.length) {
      console.error(`[${id}] ingredientGroupsEn has ${r.ingredientGroupsEn.length} groups, ingredientGroups has ${r.ingredientGroups.length}`);
      errors++;
    }
  }

  // steps count must match
  if (r.stepsEn && r.steps && r.stepsEn.length !== r.steps.length) {
    console.error(`[${id}] stepsEn has ${r.stepsEn.length} steps, steps has ${r.steps.length}`);
    errors++;
  }
});

if (errors) {
  console.error(`\n${errors} error(s) found`);
  process.exit(1);
} else {
  console.log(`✓ ${recipes.length} recipes validated`);
}
