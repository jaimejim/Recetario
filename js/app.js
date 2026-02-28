// js/app.js — Hash-based SPA routing for the Recetario

(function () {
  'use strict';

  /* -------------------------------------------------------
     Translations
  ------------------------------------------------------- */
  const STRINGS = {
    es: {
      subtitle:          'Recuerdos y sabores de los Jiménez',
      searchPlaceholder: 'Buscar receta...',
      backLink:          '\u2190 Índice',
      noResults:         'No se encontraron recetas.',
      sectionIngredients:'Ingredientes',
      sectionSteps:      'Elaboración',
      servings:          n => `${n} persona${n !== 1 ? 's' : ''}`,
      incomplete:        'Esta receta se añadirá próximamente al recetario.',
      footer:            'Familia Jiménez \u00b7 2018\u20132024',
      categories: {
        aperitivos: 'Aperitivos',
        pasta:      'Pasta',
        pescados:   'Pescados',
        carnes:     'Carnes',
        arroces:    'Arroces',
        sopas:      'Sopas',
        verduras:   'Verduras',
        basicos:    'Básicos',
        bebidas:    'Bebidas',
      },
    },
    en: {
      subtitle:          'Memories and flavours of the Jiménez family',
      searchPlaceholder: 'Search recipe...',
      backLink:          '\u2190 Index',
      noResults:         'No recipes found.',
      sectionIngredients:'Ingredients',
      sectionSteps:      'Method',
      servings:          n => `${n} serving${n !== 1 ? 's' : ''}`,
      incomplete:        'This recipe will be added to the book soon.',
      footer:            'Jiménez Family \u00b7 2018\u20132024',
      categories: {
        aperitivos: 'Starters',
        pasta:      'Pasta',
        pescados:   'Fish',
        carnes:     'Meat',
        arroces:    'Rice',
        sopas:      'Soups',
        verduras:   'Vegetables',
        basicos:    'Basics',
        bebidas:    'Drinks',
      },
    },
  };

  /* -------------------------------------------------------
     Language state
  ------------------------------------------------------- */
  let lang = localStorage.getItem('lang') || 'es';

  function t(key) {
    return STRINGS[lang][key];
  }

  function cat(category) {
    return STRINGS[lang].categories[category] || category;
  }

  /* -------------------------------------------------------
     DOM references
  ------------------------------------------------------- */
  const viewList   = document.getElementById('view-list');
  const viewRecipe = document.getElementById('view-recipe');
  const indexEl    = document.getElementById('recipe-index');
  const searchEl   = document.getElementById('search');
  const detailEl   = document.getElementById('recipe-detail');
  const backLink   = document.getElementById('back-link');
  const subtitleEl = document.getElementById('site-subtitle');
  const footerList = document.getElementById('footer-list');
  const footerRecipe = document.getElementById('footer-recipe');

  /* -------------------------------------------------------
     Pre-process data
  ------------------------------------------------------- */

  // Sort alphabetically, ignoring leading articles
  function sortKey(title) {
    return title
      .replace(/^(El|La|Los|Las|Un|Una|Y también Dos|Y también)\s+/i, '')
      .toLowerCase();
  }

  const sorted = [...RECIPES].sort((a, b) =>
    sortKey(a.title).localeCompare(sortKey(b.title), 'es', { sensitivity: 'base' })
  );

  const byId = {};
  RECIPES.forEach(r => { byId[r.id] = r; });

  /* -------------------------------------------------------
     Apply language to static DOM elements
  ------------------------------------------------------- */
  function applyLang() {
    document.documentElement.lang = lang;
    subtitleEl.textContent         = t('subtitle');
    searchEl.placeholder           = t('searchPlaceholder');
    backLink.textContent           = t('backLink');
    footerList.textContent         = t('footer');
    footerRecipe.textContent       = t('footer');

    // Update lang button active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

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
      indexEl.innerHTML = `<p class="no-results">${t('noResults')}</p>`;
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
        metaSpan.textContent = cat(recipe.category);

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
          <div class="recipe-category-label">${cat(recipe.category)}</div>
          <h1 class="recipe-title">${esc(loc(recipe, 'title'))}</h1>
          <p class="recipe-subtitle">${esc(loc(recipe, 'subtitle'))}</p>
          <div class="recipe-meta">${t('servings')(recipe.servings)}</div>
        </div>
        <div class="incomplete-notice">
          <p>${t('incomplete')}</p>
        </div>
      `;
      return;
    }

    const ingredientsHtml = loc(recipe, 'ingredientGroups').map(group => {
      const nameHtml = (group.name && group.name !== 'Ingredientes' && group.name !== 'Ingredients')
        ? `<div class="ingredient-group-name">${esc(group.name)}</div>`
        : '';
      const items = group.items.map(i => `<li>${esc(i)}</li>`).join('');
      return `${nameHtml}<ul class="ingredient-list">${items}</ul>`;
    }).join('');

    const stepsHtml = loc(recipe, 'steps')
      .map(s => `<li>${esc(s)}</li>`)
      .join('');

    const tipData = loc(recipe, 'tip');
    const tipHtml = tipData ? `
      <div class="tip-section">
        <p class="tip-text">${esc(tipData.text)}</p>
        <div class="tip-author">${esc(tipData.author)}</div>
      </div>
    ` : '';

    detailEl.innerHTML = `
      <div class="recipe-header">
        <div class="recipe-category-label">${cat(recipe.category)}</div>
        <h1 class="recipe-title">${esc(loc(recipe, 'title'))}</h1>
        <p class="recipe-subtitle">${esc(loc(recipe, 'subtitle'))}</p>
        <div class="recipe-meta">${t('servings')(recipe.servings)}</div>
      </div>

      <div class="section-heading">${t('sectionIngredients')}</div>
      <hr class="section-rule">
      ${ingredientsHtml}

      <div class="section-heading">${t('sectionSteps')}</div>
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
      viewList.classList.add('hidden');
      viewRecipe.classList.remove('hidden');
      renderRecipe(byId[id]);
      window.scrollTo(0, 0);
      document.title = loc(byId[id], 'title') + ' · Recetario';
    } else {
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

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      localStorage.setItem('lang', lang);
      applyLang();
      renderIndex(searchEl.value);
      // Re-render detail view if visible
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && byId[id]) renderRecipe(byId[id]);
    });
  });

  /* -------------------------------------------------------
     Utility
  ------------------------------------------------------- */

  // Return language-specific field if available, otherwise fall back to base field
  function loc(recipe, field) {
    const key = field + 'En';
    return (lang === 'en' && recipe[key] !== undefined) ? recipe[key] : recipe[field];
  }

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
  applyLang();
  renderIndex('');
  route();

})();
