// js/app.js — Hash-based SPA routing for the Recetario

(function () {
  'use strict';

  /* -------------------------------------------------------
     DOM references
  ------------------------------------------------------- */
  const viewList   = document.getElementById('view-list');
  const viewRecipe = document.getElementById('view-recipe');
  const indexEl    = document.getElementById('recipe-index');
  const searchEl   = document.getElementById('search');
  const detailEl   = document.getElementById('recipe-detail');
  const backLink   = document.getElementById('back-link');

  /* -------------------------------------------------------
     Category labels
  ------------------------------------------------------- */
  const CAT = {
    aperitivos: 'Aperitivos',
    pasta:      'Pasta',
    pescados:   'Pescados',
    carnes:     'Carnes',
    arroces:    'Arroces',
    sopas:      'Sopas',
    verduras:   'Verduras',
    basicos:    'Básicos',
    bebidas:    'Bebidas',
  };

  /* -------------------------------------------------------
     Pre-process data
  ------------------------------------------------------- */

  // Sort alphabetically, ignoring leading articles
  function sortKey(title) {
    return title
      .replace(/^(El|La|Los|Las|Un|Una|Y también)\s+/i, '')
      .toLowerCase();
  }

  const sorted = [...RECIPES].sort((a, b) =>
    sortKey(a.title).localeCompare(sortKey(b.title), 'es', { sensitivity: 'base' })
  );

  const byId = {};
  RECIPES.forEach(r => { byId[r.id] = r; });

  /* -------------------------------------------------------
     Render: alphabetical index
  ------------------------------------------------------- */

  function renderIndex(query) {
    const q = (query || '').toLowerCase().trim();

    const list = q
      ? sorted.filter(r =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q)
        )
      : sorted;

    indexEl.innerHTML = '';

    if (list.length === 0) {
      indexEl.innerHTML = '<p class="no-results">No se encontraron recetas.</p>';
      return;
    }

    // Group by first letter
    const groups = {};
    list.forEach(r => {
      const letter = sortKey(r.title)[0].toUpperCase();
      (groups[letter] = groups[letter] || []).push(r);
    });

    Object.keys(groups).sort().forEach(letter => {
      const group = document.createElement('div');
      group.className = 'letter-group';

      const heading = document.createElement('div');
      heading.className = 'letter-heading';
      heading.textContent = letter;
      group.appendChild(heading);

      groups[letter].forEach(recipe => {
        const row = document.createElement('a');
        row.className = 'recipe-row' + (recipe.incomplete ? ' recipe-row-incomplete' : '');
        row.href = '#' + recipe.id;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'recipe-row-title';
        titleSpan.textContent = recipe.title;

        const metaSpan = document.createElement('span');
        metaSpan.className = 'recipe-row-meta';
        metaSpan.textContent = CAT[recipe.category] || recipe.category;

        row.appendChild(titleSpan);
        row.appendChild(metaSpan);
        group.appendChild(row);
      });

      indexEl.appendChild(group);
    });
  }

  /* -------------------------------------------------------
     Render: recipe detail
  ------------------------------------------------------- */

  function renderRecipe(recipe) {
    if (recipe.incomplete) {
      detailEl.innerHTML = `
        <div class="recipe-header">
          <div class="recipe-category-label">${CAT[recipe.category] || recipe.category}</div>
          <h1 class="recipe-title">${esc(recipe.title)}</h1>
          <p class="recipe-subtitle">${esc(recipe.subtitle)}</p>
          <div class="recipe-meta">pág. ${recipe.page}</div>
        </div>
        <div class="incomplete-notice">
          <p>Esta receta se añadirá próximamente al recetario.</p>
        </div>
      `;
      return;
    }

    const ingredientsHtml = recipe.ingredientGroups.map(group => {
      const nameHtml = (group.name && group.name !== 'Ingredientes')
        ? `<div class="ingredient-group-name">${esc(group.name)}</div>`
        : '';
      const items = group.items.map(i => `<li>${esc(i)}</li>`).join('');
      return `${nameHtml}<ul class="ingredient-list">${items}</ul>`;
    }).join('');

    const stepsHtml = recipe.steps
      .map(s => `<li>${esc(s)}</li>`)
      .join('');

    const tipHtml = recipe.tip ? `
      <div class="tip-section">
        <p class="tip-text">${esc(recipe.tip.text)}</p>
        <div class="tip-author">${esc(recipe.tip.author)}</div>
      </div>
    ` : '';

    const servings = `${recipe.servings} persona${recipe.servings !== 1 ? 's' : ''}`;

    detailEl.innerHTML = `
      <div class="recipe-header">
        <div class="recipe-category-label">${CAT[recipe.category] || recipe.category}</div>
        <h1 class="recipe-title">${esc(recipe.title)}</h1>
        <p class="recipe-subtitle">${esc(recipe.subtitle)}</p>
        <div class="recipe-meta">${servings} &mdash; pág. ${recipe.page}</div>
      </div>

      <div class="section-heading">Ingredientes</div>
      <hr class="section-rule">
      ${ingredientsHtml}

      <div class="section-heading">Elaboración</div>
      <hr class="section-rule">
      <ol class="steps-list">${stepsHtml}</ol>

      ${tipHtml}
    `;
  }

  /* -------------------------------------------------------
     Routing
  ------------------------------------------------------- */

  function route() {
    const id = decodeURIComponent(window.location.hash.slice(1));

    if (id && byId[id]) {
      // Show recipe detail
      viewList.classList.add('hidden');
      viewRecipe.classList.remove('hidden');
      renderRecipe(byId[id]);
      window.scrollTo(0, 0);

      // Update page title
      document.title = byId[id].title + ' · Recetario';
    } else {
      // Show index
      viewRecipe.classList.add('hidden');
      viewList.classList.remove('hidden');
      document.title = 'Recetario · Jiménez Bolonio';
    }
  }

  /* -------------------------------------------------------
     Events
  ------------------------------------------------------- */

  backLink.addEventListener('click', e => {
    e.preventDefault();
    history.back();
  });

  searchEl.addEventListener('input', () => {
    renderIndex(searchEl.value);
  });

  window.addEventListener('hashchange', route);

  /* -------------------------------------------------------
     Utility
  ------------------------------------------------------- */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* -------------------------------------------------------
     Init
  ------------------------------------------------------- */
  renderIndex('');
  route();

})();
