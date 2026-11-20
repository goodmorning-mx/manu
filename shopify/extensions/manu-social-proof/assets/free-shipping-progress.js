(() => {
  if (window.ManuFreeShippingProgress) return;

  const rootSelector = '[data-manu-free-shipping-config]';
  const defaults = {
    drawer: 'cart-drawer, [data-cart-drawer], #CartDrawer, .cart-drawer',
    header: '.drawer__header, .cart-drawer__header, [data-cart-drawer-header]',
  };
  const euCountries = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
    'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ]);
  let refreshTimer;
  let requestNumber = 0;

  const safeQuery = (scope, selector) => {
    try { return scope?.querySelector(selector) || null; } catch (_error) { return null; }
  };
  const safeClosest = (element, selector) => {
    try { return element?.closest(selector) || null; } catch (_error) { return null; }
  };

  const mountCartRoot = (root) => {
    if (root.dataset.placement !== 'cart') return;
    const path = window.location.pathname.replace(/\/+$/, '');
    if (/\/cart$/.test(path)) {
      const form = document.querySelector('main form[action*="/cart"]');
      if (form?.parentElement && root.nextElementSibling !== form) form.before(root);
      return;
    }

    const drawerSelector = root.dataset.cartDrawerSelector?.trim() || defaults.drawer;
    const headerSelector = root.dataset.cartHeaderSelector?.trim() || defaults.header;
    const drawer = safeQuery(document, drawerSelector);
    if (!drawer) return;
    const header = safeQuery(drawer, headerSelector);
    if (header && root.previousElementSibling !== header) header.after(root);
    else if (!header && root.parentElement !== drawer) drawer.prepend(root);
  };

  const formatMoney = (minorUnits, currency) => {
    const locale = document.documentElement.lang || navigator.language || 'en';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minorUnits / 100);
    } catch (_error) {
      return `${currency} ${(minorUnits / 100).toFixed(2)}`;
    }
  };

  const subtotalAfterCartDiscounts = (cart) => {
    const itemsSubtotal = Number(cart.items_subtotal_price) || 0;
    const cartDiscounts = (cart.cart_level_discount_applications || []).reduce(
      (sum, discount) => sum + (Number(discount.total_allocated_amount) || 0), 0,
    );
    return Math.max(0, itemsSubtotal - cartDiscounts);
  };

  const getCountryCode = (root) => (
    root.dataset.countryCode || window.Shopify?.country || ''
  ).trim().toUpperCase();

  const getCountryLabel = (countryCode) => {
    if (!countryCode) return 'your country';
    const locale = document.documentElement.lang || navigator.language || 'en';
    try {
      return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) || countryCode;
    } catch (_error) {
      return countryCode;
    }
  };

  const countryFlag = (countryCode) => {
    if (!/^[A-Z]{2}$/.test(countryCode)) return '🌐';
    return [...countryCode]
      .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 0x1f1a5))
      .join('');
  };

  const submitCountryChange = (countryCode) => {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = '/localization';
    form.hidden = true;

    const values = {
      form_type: 'localization',
      utf8: '✓',
      _method: 'put',
      country_code: countryCode,
      return_to: `${window.location.pathname}${window.location.search}`,
    };
    Object.entries(values).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.append(input);
    });
    document.body.append(form);
    form.submit();
  };

  const createCountryControl = (root, countryCode, countryLabel) => {
    const template = root.querySelector('template[data-manu-country-options]');
    const options = template ? [...template.content.querySelectorAll('option')] : [];
    if (options.length < 2) {
      return document.createTextNode(`${countryFlag(countryCode)} ${countryLabel}`.trim());
    }

    const select = document.createElement('select');
    select.className = 'manu-free-shipping-progress__country';
    select.setAttribute('aria-label', 'Country for shipping estimate');
    [...template.content.children].forEach((sourceGroup) => {
      if (sourceGroup.tagName !== 'OPTGROUP') {
        const option = sourceGroup.cloneNode(true);
        const code = option.value.toUpperCase();
        option.textContent = `${countryFlag(code)} ${option.dataset.countryName || option.textContent.trim()}`;
        select.append(option);
        return;
      }
      const group = sourceGroup.cloneNode(false);
      sourceGroup.querySelectorAll('option').forEach((sourceOption) => {
        const option = sourceOption.cloneNode(true);
        const code = option.value.toUpperCase();
        option.textContent = `${countryFlag(code)} ${option.dataset.countryName || option.textContent.trim()}`;
        group.append(option);
      });
      if (group.children.length) select.append(group);
    });
    select.value = countryCode;
    select.addEventListener('change', () => submitCountryChange(select.value));
    return select;
  };

  const renderMessage = (root, message, amount, countryCode, countryLabel) => {
    const output = root.querySelector('.manu-free-shipping-progress__message');
    if (!output) return;

    const tokens = /\{amount\}|\{country\}|FREE SHIPPING/gi;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let countryControlAdded = false;
    let match;
    while ((match = tokens.exec(message)) !== null) {
      if (match.index > lastIndex) {
        fragment.append(document.createTextNode(message.slice(lastIndex, match.index)));
      }
      const token = match[0].toLowerCase();
      if (token === '{amount}') {
        fragment.append(document.createTextNode(amount ?? ''));
      } else if (token === '{country}' && !countryControlAdded) {
        fragment.append(createCountryControl(root, countryCode, countryLabel));
        countryControlAdded = true;
      } else if (token === 'free shipping') {
        const strong = document.createElement('strong');
        strong.textContent = match[0];
        fragment.append(strong);
      } else {
        fragment.append(document.createTextNode(match[0]));
      }
      lastIndex = tokens.lastIndex;
    }
    if (lastIndex < message.length) fragment.append(document.createTextNode(message.slice(lastIndex)));
    output.replaceChildren(fragment);
  };

  const getThreshold = (root, countryCode) => {
    const fallback = Number.parseFloat(root.dataset.threshold || '100');
    if (!countryCode) return fallback;
    try {
      const thresholds = JSON.parse(root.dataset.countryThresholds || '{}');
      const readThreshold = (key) => {
        const rawThreshold = thresholds[key];
        if (typeof rawThreshold !== 'number' && !(typeof rawThreshold === 'string' && rawThreshold.trim())) return null;
        const value = Number(rawThreshold);
        return Number.isFinite(value) && value >= 0 ? value : null;
      };
      const countryThreshold = readThreshold(countryCode);
      if (countryThreshold != null) return countryThreshold;
      if (euCountries.has(countryCode)) {
        const euThreshold = readThreshold('EU');
        if (euThreshold != null) return euThreshold;
      }
    } catch (_error) {
      // An invalid optional country map falls back to the general threshold.
    }
    return fallback;
  };

  const renderRoot = (root, cart) => {
    if (!root.isConnected) return;
    if (root.dataset.placement === 'cart' && Number(cart.item_count) < 1) {
      root.hidden = true;
      return;
    }
    const countryCode = getCountryCode(root);
    const country = getCountryLabel(countryCode);
    const threshold = getThreshold(root, countryCode);
    if (!Number.isFinite(threshold) || threshold < 0) { root.hidden = true; return; }
    const target = Math.round(threshold * 100);
    const subtotal = subtotalAfterCartDiscounts(cart);
    const remaining = Math.max(0, target - subtotal);
    const progress = target === 0 ? 100 : Math.min(100, subtotal / target * 100);
    const track = root.querySelector('.manu-free-shipping-progress__track');
    const fill = root.querySelector('.manu-free-shipping-progress__fill');
    if (track) track.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (fill) fill.style.width = `${progress}%`;
    if (remaining > 0) {
      renderMessage(
        root,
        root.dataset.messageAway || 'You are {amount} away from FREE SHIPPING in {country}!',
        formatMoney(remaining, cart.currency || 'USD'),
        countryCode,
        country,
      );
    } else {
      renderMessage(
        root,
        root.dataset.messageUnlocked || 'Your cart qualifies for FREE SHIPPING in {country}!',
        null,
        countryCode,
        country,
      );
    }
    root.hidden = false;
  };

  const refresh = async () => {
    document.querySelectorAll(rootSelector).forEach(mountCartRoot);
    if (!document.querySelector(rootSelector)) return;
    const currentRequest = ++requestNumber;
    const rootPath = window.Shopify?.routes?.root || '/';
    try {
      const response = await fetch(`${rootPath.replace(/\/?$/, '/')}cart.js`, {
        credentials: 'same-origin', headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const cart = await response.json();
      if (currentRequest !== requestNumber) return;
      document.querySelectorAll(rootSelector).forEach((root) => renderRoot(root, cart));
    } catch (_error) {
      // The optional progress display must not interfere with the cart.
    }
  };

  const scheduleRefresh = (delay = 180) => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refresh, delay);
  };

  const initialize = () => {
    if (!document.querySelector(rootSelector)) return;
    refresh();
    new MutationObserver((records) => {
      const newBlock = records.some((record) => [...record.addedNodes].some((node) => (
        node instanceof Element && (node.matches(rootSelector) || node.querySelector(rootSelector))
      )));
      if (newBlock) scheduleRefresh(0);
      else document.querySelectorAll(rootSelector).forEach(mountCartRoot);
    }).observe(document.body, { childList: true, subtree: true });

    ['cart:change', 'cart:changed', 'cart:update', 'cart:updated', 'cart:refresh', 'cart:rendered', 'shopify:section:load']
      .forEach((name) => document.addEventListener(name, () => scheduleRefresh(), { passive: true }));
    document.addEventListener('change', (event) => {
      if (event.target instanceof Element && (safeClosest(event.target, defaults.drawer) || safeClosest(event.target, 'form[action*="/cart"]'))) scheduleRefresh(300);
    }, true);
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const inCart = safeClosest(event.target, defaults.drawer) || safeClosest(event.target, 'form[action*="/cart"]');
      const control = safeClosest(event.target, 'button, a, input, select, textarea');
      const checkout = safeClosest(event.target, '[name="checkout"], [href*="/checkout"], [data-checkout]');
      if (inCart && control && !checkout) scheduleRefresh(500);
    }, true);
  };

  window.ManuFreeShippingProgress = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
