// js/app.js — Hash-based SPA routing for the Recetario

(function () {
  'use strict';

  /* -------------------------------------------------------
     Translations
  ------------------------------------------------------- */
  const CATEGORY_ORDER = [
    'aperitivos', 'sopas', 'verduras', 'pasta',
    'pescados', 'carnes', 'arroces', 'basicos', 'bebidas',
  ];

  const STRINGS = {
    es: {
      subtitle:          'Recuerdos y sabores de los Jiménez-Torno',
      searchPlaceholder: 'Buscar receta...',
      backLink:          '\u2039 Índice',
      noResults:         'No se encontraron recetas.',
      sectionIngredients:'Ingredientes',
      sectionSteps:      'Elaboración',
      servings:          n => `${n} persona${n !== 1 ? 's' : ''}`,
      incomplete:        'Esta receta se añadirá próximamente al recetario.',
      footer:            'Familia Jiménez-Torno\u2003|\u20032018\u20132026',
      all:               'Todas',
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
      subtitle:          'Memories and flavours of the Jiménez-Torno family',
      searchPlaceholder: 'Search recipe...',
      backLink:          '\u2039 Index',
      noResults:         'No recipes found.',
      sectionIngredients:'Ingredients',
      sectionSteps:      'Method',
      servings:          n => `${n} serving${n !== 1 ? 's' : ''}`,
      incomplete:        'This recipe will be added to the book soon.',
      footer:            'Jiménez-Torno Family\u2003|\u20032018\u20132026',
      all:               'All',
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
  let activeCategory = null; // null = all

  function t(key) {
    return STRINGS[lang][key];
  }

  function cat(category) {
    return STRINGS[lang].categories[category] || category;
  }

  /* -------------------------------------------------------
     DOM references
  ------------------------------------------------------- */
  const viewList     = document.getElementById('view-list');
  const viewRecipe   = document.getElementById('view-recipe');
  const indexEl      = document.getElementById('recipe-index');
  const searchEl     = document.getElementById('search');
  const detailEl     = document.getElementById('recipe-detail');
  const backLink     = document.getElementById('back-link');
  const subtitleEl   = document.getElementById('site-subtitle');
  const footerList   = document.getElementById('footer-list');
  const footerRecipe = document.getElementById('footer-recipe');

  /* -------------------------------------------------------
     Pre-process data
  ------------------------------------------------------- */
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

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    renderCategoryFilter();
  }

  /* -------------------------------------------------------
     Category filter
  ------------------------------------------------------- */
  function renderCategoryFilter() {
    let filterEl = document.getElementById('category-filter');
    if (!filterEl) {
      filterEl = document.createElement('div');
      filterEl.id = 'category-filter';
      filterEl.className = 'category-filter';
      const searchWrapper = document.querySelector('.search-wrapper');
      searchWrapper.parentNode.insertBefore(filterEl, searchWrapper.nextSibling);
    }

    const buttons = [`<button class="cat-btn${activeCategory === null ? ' active' : ''}" data-cat="">${t('all')}</button>`];
    CATEGORY_ORDER.forEach(c => {
      buttons.push(`<button class="cat-btn${activeCategory === c ? ' active' : ''}" data-cat="${c}">${cat(c)}</button>`);
    });
    filterEl.innerHTML = buttons.join('');

    filterEl.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat || null;
        renderCategoryFilter();
        renderIndex(searchEl.value);
      });
    });
  }

  /* -------------------------------------------------------
     Render: index (alphabetical or by category)
  ------------------------------------------------------- */
  function renderIndex(query) {
    const q = (query || '').toLowerCase().trim();

    let list = sorted;
    if (q) {
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        (r.titleEn && r.titleEn.toLowerCase().includes(q)) ||
        (r.subtitleEn && r.subtitleEn.toLowerCase().includes(q))
      );
    }
    if (activeCategory) {
      list = list.filter(r => r.category === activeCategory);
    }

    indexEl.innerHTML = '';

    if (list.length === 0) {
      indexEl.innerHTML = `<p class="no-results">${t('noResults')}</p>`;
      return;
    }

    if (activeCategory) {
      // Flat list when filtering by category
      list.forEach(r => {
        indexEl.appendChild(makeRow(r));
      });
    } else {
      // Group by first letter
      const groups = {};
      list.forEach(r => {
        const letter = sortKey(loc(r, 'title'))[0].toUpperCase();
        (groups[letter] = groups[letter] || []).push(r);
      });

      Object.keys(groups).sort().forEach(letter => {
        const group = document.createElement('div');
        group.className = 'letter-group';

        const heading = document.createElement('div');
        heading.className = 'letter-heading';
        heading.textContent = letter;
        group.appendChild(heading);

        groups[letter].forEach(r => group.appendChild(makeRow(r)));
        indexEl.appendChild(group);
      });
    }
  }

  function makeRow(recipe) {
    const row = document.createElement('a');
    row.className = 'recipe-row' + (recipe.incomplete ? ' recipe-row-incomplete' : '');
    row.href = '#' + recipe.id;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'recipe-row-title';
    titleSpan.textContent = loc(recipe, 'title');

    const metaSpan = document.createElement('span');
    metaSpan.className = 'recipe-row-meta';
    metaSpan.textContent = cat(recipe.category);

    row.appendChild(titleSpan);
    row.appendChild(metaSpan);
    return row;
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

    const groups = loc(recipe, 'ingredientGroups');
    const multiCol = groups.length >= 2;
    const ingredientsHtml = groups.map(group => {
      const nameHtml = (group.name && group.name !== 'Ingredientes' && group.name !== 'Ingredients')
        ? `<div class="ingredient-group-name">${esc(group.name)}</div>`
        : '';
      const items = group.items.map(i => `<li>${esc(i)}</li>`).join('');
      return multiCol
        ? `<div class="ingredient-col">${nameHtml}<ul class="ingredient-list">${items}</ul></div>`
        : `${nameHtml}<ul class="ingredient-list">${items}</ul>`;
    }).join('');
    const ingredientsWrapped = multiCol
      ? `<div class="ingredient-grid">${ingredientsHtml}</div>`
      : ingredientsHtml;

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
      ${ingredientsWrapped}

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
      document.title = loc(byId[id], 'title') + ' \u00b7 Recetario';
    } else {
      viewRecipe.classList.add('hidden');
      viewList.classList.remove('hidden');
      document.title = 'Recetario \u00b7 Jiménez-Torno';
    }
  }

  /* -------------------------------------------------------
     Events
  ------------------------------------------------------- */
  backLink.addEventListener('click', e => {
    e.preventDefault();
    window.location.hash = '';
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
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && byId[id]) renderRecipe(byId[id]);
    });
  });

  /* -------------------------------------------------------
     Utility
  ------------------------------------------------------- */
  function loc(recipe, field) {
    const key = field + 'En';
    return (lang === 'en' && recipe[key] !== undefined) ? recipe[key] : recipe[field];
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/([½⅓⅔¼¾⅕⅛⅜⅝⅞])/g, '<span class="frac">$1</span>');
  }

  /* -------------------------------------------------------
     Init
  ------------------------------------------------------- */
  applyLang();
  renderIndex('');
  route();

})();
