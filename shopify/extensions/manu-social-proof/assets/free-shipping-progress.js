(() => {
  const rootSelector = '[data-manu-free-shipping-config]';
  const defaultDrawerSelector = 'cart-drawer, [data-cart-drawer], #CartDrawer, .cart-drawer';
  const defaultHeaderSelector = '.drawer__header, .cart-drawer__header, [data-cart-drawer-header]';
  const cartEvents = [
    'cart:change',
    'cart:changed',
    'cart:update',
    'cart:updated',
    'cart:refresh',
    'cart:rendered',
    'shopify:section:load',
  ];

  let root;
  let drawerObserver;
  let observedDrawer;
  let pageObserver;
  let refreshTimer;
  let requestNumber = 0;

  const querySafely = (scope, selector) => {
    if (!scope || !selector) return null;
    try {
      return scope.querySelector(selector);
    } catch (_error) {
      return null;
    }
  };

  const closestSafely = (element, selector) => {
    if (!element || !selector) return null;
    try {
      return element.closest(selector);
    } catch (_error) {
      return null;
    }
  };

  const getSelectors = () => ({
    drawer: root?.dataset.cartDrawerSelector?.trim() || defaultDrawerSelector,
    header: root?.dataset.cartHeaderSelector?.trim() || defaultHeaderSelector,
  });

  const getCartPageTarget = () => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (!/\/cart$/.test(path)) return null;

    const cartForm = document.querySelector('main form[action*="/cart"]');
    return cartForm ? { element: cartForm } : null;
  };

  const findDrawer = () => querySafely(document, getSelectors().drawer);

  const mountRoot = () => {
    if (!root) return null;

    const cartPageTarget = getCartPageTarget();
    if (cartPageTarget) {
      if (
        root.parentElement !== cartPageTarget.element.parentElement
        || root.nextElementSibling !== cartPageTarget.element
      ) {
        cartPageTarget.element.parentElement.insertBefore(root, cartPageTarget.element);
      }
      return null;
    }

    const drawer = findDrawer();
    if (!drawer) return null;

    const header = querySafely(drawer, getSelectors().header);
    if (header) {
      if (root.previousElementSibling !== header) header.insertAdjacentElement('afterend', root);
    } else if (root.parentElement !== drawer) {
      drawer.insertBefore(root, drawer.firstChild);
    }

    observeDrawer(drawer);
    return drawer;
  };

  const renderMessage = (message, amount) => {
    const messageElement = root?.querySelector('.manu-free-shipping-progress__message');
    if (!messageElement) return;

    const rendered = amount == null ? message : message.replace('{amount}', amount);
    const phrase = 'FREE SHIPPING';
    const phraseIndex = rendered.toUpperCase().indexOf(phrase);

    if (phraseIndex < 0) {
      messageElement.textContent = rendered;
      return;
    }

    const before = rendered.slice(0, phraseIndex);
    const highlighted = rendered.slice(phraseIndex, phraseIndex + phrase.length);
    const after = rendered.slice(phraseIndex + phrase.length);
    const strong = document.createElement('strong');
    strong.textContent = highlighted;
    messageElement.replaceChildren(
      document.createTextNode(before),
      strong,
      document.createTextNode(after),
    );
  };

  const formatMoney = (minorUnits, currency) => {
    const locale = document.documentElement.lang || navigator.language || 'en';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(minorUnits / 100);
    } catch (_error) {
      return `${currency} ${(minorUnits / 100).toFixed(2)}`;
    }
  };

  const getQualifyingSubtotal = (cart) => {
    const itemSubtotal = Number(cart.items_subtotal_price) || 0;
    const cartLevelDiscount = (cart.cart_level_discount_applications || []).reduce(
      (total, discount) => total + (Number(discount.total_allocated_amount) || 0),
      0,
    );
    return Math.max(0, itemSubtotal - cartLevelDiscount);
  };

  const renderCart = (cart) => {
    if (!root?.isConnected) return;

    const itemCount = Number(cart.item_count) || 0;
    if (itemCount < 1) {
      root.hidden = true;
      return;
    }

    const threshold = Number.parseFloat(root.dataset.threshold || '100');
    if (!Number.isFinite(threshold) || threshold < 0) {
      root.hidden = true;
      return;
    }

    const thresholdMinorUnits = Math.round(threshold * 100);
    const subtotalMinorUnits = getQualifyingSubtotal(cart);
    const remainingMinorUnits = Math.max(0, thresholdMinorUnits - subtotalMinorUnits);
    const progress = thresholdMinorUnits === 0
      ? 100
      : Math.min(100, (subtotalMinorUnits / thresholdMinorUnits) * 100);
    const track = root.querySelector('.manu-free-shipping-progress__track');
    const fill = root.querySelector('.manu-free-shipping-progress__fill');
    const currency = cart.currency || 'USD';

    if (track) track.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (fill) fill.style.width = `${progress}%`;

    if (remainingMinorUnits > 0) {
      renderMessage(root.dataset.messageAway || 'You are {amount} away from FREE SHIPPING!', formatMoney(remainingMinorUnits, currency));
    } else {
      renderMessage(root.dataset.messageUnlocked || 'Your cart qualifies for FREE SHIPPING!');
    }

    root.hidden = false;
  };

  const refreshCart = async () => {
    if (!root?.isConnected) return;
    const currentRequest = ++requestNumber;
    const routesRoot = window.Shopify?.routes?.root || '/';
    const cartUrl = `${routesRoot.replace(/\/?$/, '/') }cart.js`;

    try {
      const response = await fetch(cartUrl, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const cart = await response.json();
      if (currentRequest === requestNumber) renderCart(cart);
    } catch (_error) {
      // Keep the cart drawer usable when the optional progress request fails.
    }
  };

  const scheduleRefresh = (delay = 180) => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      mountRoot();
      refreshCart();
    }, delay);
  };

  const isInsideRoot = (node) => node instanceof Node && (node === root || root?.contains(node));

  const observeDrawer = (drawer) => {
    if (drawer === observedDrawer) return;
    drawerObserver?.disconnect();
    observedDrawer = drawer;
    drawerObserver = new MutationObserver((records) => {
      const cartChanged = records.some((record) => !isInsideRoot(record.target));
      if (cartChanged) scheduleRefresh();
    });
    drawerObserver.observe(drawer, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'open', 'aria-hidden'],
    });
  };

  const initialize = () => {
    root = document.querySelector(rootSelector);
    if (!root) return;

    mountRoot();
    scheduleRefresh(0);

    pageObserver = new MutationObserver((records) => {
      const previousParent = root?.parentElement;
      const wasConnected = root?.isConnected;
      const drawer = mountRoot();
      if (drawer) observeDrawer(drawer);
      const cartForm = getCartPageTarget()?.element;
      const cartPageChanged = cartForm && records.some((record) => (
        record.target === cartForm || cartForm.contains(record.target)
      ));
      const rootMoved = root?.isConnected && (!wasConnected || root.parentElement !== previousParent);
      if (cartPageChanged || rootMoved) scheduleRefresh(0);
    });
    pageObserver.observe(document.body, { childList: true, subtree: true });

    cartEvents.forEach((eventName) => {
      document.addEventListener(eventName, () => scheduleRefresh(), { passive: true });
    });

    document.addEventListener('change', (event) => {
      if (
        event.target instanceof Element
        && (
          closestSafely(event.target, getSelectors().drawer)
          || closestSafely(event.target, 'form[action*="/cart"]')
        )
      ) {
        scheduleRefresh(300);
      }
    }, true);

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const inCart = closestSafely(event.target, getSelectors().drawer)
        || closestSafely(event.target, 'form[action*="/cart"]');
      const control = closestSafely(event.target, 'button, a, input, select, textarea');
      const isCheckout = closestSafely(event.target, '[name="checkout"], [href*="/checkout"], [data-checkout]');
      if (inCart && control && !isCheckout) scheduleRefresh(500);
    }, true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
