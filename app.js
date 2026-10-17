const MENU_KEY = 'amma-food-menu-v1';
const CART_KEY = 'amma-food-cart-v1';
const ORDERS_KEY = 'amma-food-orders-v1';
const FILTER_KEY = 'amma-food-filter-session';
const DRAFT_KEY = 'amma-food-checkout-draft-session';
const DELIVERY_FEE = 3.5;
const FREE_DELIVERY_AT = 35;
const fallbackImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80';

const starterMenu = [
  { id: 'dish-idli', name: 'Soft idli & sambar', category: 'Meals', price: 9.5, description: 'Steamed rice cakes, coconut chutney, and a generous pour of sambar.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: 'A favorite' },
  { id: 'dish-dosa', name: 'Golden masala dosa', category: 'Meals', price: 13, description: 'Crisp-edged dosa wrapped around spiced potato masala.', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: 'Bestseller' },
  { id: 'dish-thali', name: 'Amma’s veg thali', category: 'Meals', price: 17, description: 'A little bit of everything: rice, dal, seasonal veg, and pickle.', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: 'A favorite' },
  { id: 'dish-pakora', name: 'Crispy onion pakora', category: 'Snacks', price: 7.5, description: 'Thin-sliced onions, chickpea batter, curry leaf, and a hint of chili.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: '' },
  { id: 'dish-samosa', name: 'Little potato samosas', category: 'Snacks', price: 8, description: 'Flaky pastry, warmly spiced potato, and tangy tamarind chutney.', image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: 'Bestseller' },
  { id: 'dish-ladoo', name: 'Besan ladoo', category: 'Sweets', price: 6, description: 'Toasty gram flour, ghee, cardamom, and just enough sweetness.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: '' },
  { id: 'dish-gulab', name: 'Warm gulab jamun', category: 'Sweets', price: 6.5, description: 'Soft milk dumplings in a fragrant cardamom and rose syrup.', image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: 'A favorite' },
  { id: 'dish-mango', name: 'Mango lassi', category: 'Drinks', price: 5.5, description: 'Ripe mango blended with cool yogurt and a pinch of cardamom.', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80', vegetarian: true, featured: '' }
];

const readStorage = (storage, key, fallback) => {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};
const writeStorage = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast('Your browser could not save this change. Check its storage settings.');
    return false;
  }
};
const validList = (value) => Array.isArray(value) ? value : [];
let menu = readStorage(localStorage, MENU_KEY, null);
if (!Array.isArray(menu)) {
  menu = starterMenu;
  writeStorage(localStorage, MENU_KEY, menu);
}
let cart = readStorage(localStorage, CART_KEY, {});
if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {};
let orders = validList(readStorage(localStorage, ORDERS_KEY, []));
let activeCategory = sessionStorage.getItem(FILTER_KEY) || 'All';
let adminMode = false;
let toastTimer;

const elements = {
  categoryTabs: document.querySelector('#category-tabs'),
  menuGrid: document.querySelector('#menu-grid'),
  menuEmpty: document.querySelector('#menu-empty'),
  search: document.querySelector('#menu-search'),
  cartItems: document.querySelector('#cart-items'),
  cartCount: document.querySelector('#cart-count'),
  cartEmpty: document.querySelector('#cart-empty'),
  clearCart: document.querySelector('#clear-cart'),
  orderTotals: document.querySelector('#order-totals'),
  subtotal: document.querySelector('#subtotal'),
  deliveryFee: document.querySelector('#delivery-fee'),
  orderTotal: document.querySelector('#order-total'),
  checkoutButton: document.querySelector('#checkout-button'),
  recentOrders: document.querySelector('#recent-orders'),
  menuModal: document.querySelector('#menu-modal'),
  menuForm: document.querySelector('#menu-form'),
  checkoutModal: document.querySelector('#checkout-modal'),
  checkoutForm: document.querySelector('#checkout-form'),
  toast: document.querySelector('#toast')
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

function persistMenu() {
  writeStorage(localStorage, MENU_KEY, menu);
}

function persistCart() {
  writeStorage(localStorage, CART_KEY, cart);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function renderCategories() {
  const categories = ['All', 'Meals', 'Snacks', 'Sweets', 'Drinks'];
  if (!categories.includes(activeCategory)) activeCategory = 'All';
  elements.categoryTabs.innerHTML = categories.map((category) => `
    <button class="category-tab" type="button" data-category="${category}" aria-pressed="${category === activeCategory}">${category}</button>
  `).join('');
}

function renderMenu() {
  const query = elements.search.value.trim().toLowerCase();
  const visibleDishes = menu.filter((dish) => {
    const categoryMatches = activeCategory === 'All' || dish.category === activeCategory;
    const queryMatches = `${dish.name} ${dish.description} ${dish.category}`.toLowerCase().includes(query);
    return categoryMatches && queryMatches;
  });

  elements.menuGrid.innerHTML = visibleDishes.map((dish, index) => `
    <article class="menu-card" style="animation-delay:${Math.min(index * 35, 175)}ms">
      <div class="menu-image-wrap">
        <img src="${escapeHTML(dish.image || fallbackImage)}" alt="${escapeHTML(dish.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}'">
        ${dish.featured ? `<span class="dish-badge">${escapeHTML(dish.featured)}</span>` : ''}
        ${dish.vegetarian ? '<span class="dish-veg" role="img" aria-label="Vegetarian"></span>' : ''}
      </div>
      <div class="menu-card-content">
        <div class="dish-title-row"><h3 title="${escapeHTML(dish.name)}">${escapeHTML(dish.name)}</h3><span class="dish-price">${formatPrice(dish.price)}</span></div>
        <p class="dish-description">${escapeHTML(dish.description)}</p>
        <div class="dish-actions">
          <button class="add-button" type="button" data-add="${escapeHTML(dish.id)}">Add to order <span aria-hidden="true">＋</span></button>
          ${adminMode ? `<span class="admin-actions"><button type="button" data-edit="${escapeHTML(dish.id)}">Edit</button><button type="button" data-delete="${escapeHTML(dish.id)}">Delete</button></span>` : ''}
        </div>
      </div>
    </article>
  `).join('');
  elements.menuEmpty.hidden = visibleDishes.length > 0;
}

function renderCart() {
  cart = Object.fromEntries(Object.entries(cart).filter(([id, quantity]) => menu.some((dish) => dish.id === id) && Number.isInteger(quantity) && quantity > 0));
  persistCart();
  const lineItems = Object.entries(cart).map(([id, quantity]) => ({ dish: menu.find((dish) => dish.id === id), quantity })).filter((item) => item.dish);
  const itemCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0);
  const delivery = subtotal >= FREE_DELIVERY_AT || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  elements.cartCount.textContent = String(itemCount);
  elements.cartEmpty.hidden = itemCount > 0;
  elements.cartItems.innerHTML = lineItems.map(({ dish, quantity }) => `
    <div class="cart-line">
      <span class="cart-line-name" title="${escapeHTML(dish.name)}">${escapeHTML(dish.name)}</span><span class="cart-line-price">${formatPrice(Number(dish.price) * quantity)}</span>
      <div class="quantity-control" aria-label="Quantity for ${escapeHTML(dish.name)}"><button type="button" data-quantity="${escapeHTML(dish.id)}" data-change="-1" aria-label="Remove one ${escapeHTML(dish.name)}">−</button><span>${quantity}</span><button type="button" data-quantity="${escapeHTML(dish.id)}" data-change="1" aria-label="Add one ${escapeHTML(dish.name)}">+</button></div>
      <button class="remove-item" type="button" data-remove="${escapeHTML(dish.id)}">Remove</button>
    </div>
  `).join('');
  elements.orderTotals.hidden = itemCount === 0;
  elements.clearCart.hidden = itemCount === 0;
  elements.checkoutButton.disabled = itemCount === 0;
  elements.subtotal.textContent = formatPrice(subtotal);
  elements.deliveryFee.textContent = delivery === 0 ? 'Free' : formatPrice(delivery);
  elements.orderTotal.textContent = formatPrice(total);
  renderOrders();
}

function renderOrders() {
  const recent = orders.slice(0, 3);
  elements.recentOrders.innerHTML = recent.length ? `<div class="recent-heading">Recent orders</div>${recent.map((order) => `
    <div class="order-history-row"><span title="${escapeHTML(order.id)}">${escapeHTML(order.id)} · ${formatPrice(order.total)}</span><button type="button" data-delete-order="${escapeHTML(order.id)}" aria-label="Remove order ${escapeHTML(order.id)}">Remove</button></div>
  `).join('')}` : '';
}

function updateMenu() {
  renderCategories();
  renderMenu();
  renderCart();
}

function openMenuForm(dish = null) {
  elements.menuForm.reset();
  document.querySelector('#dish-id').value = dish?.id || '';
  document.querySelector('#dish-name').value = dish?.name || '';
  document.querySelector('#dish-price').value = dish?.price ?? '';
  document.querySelector('#dish-category').value = dish?.category || 'Meals';
  document.querySelector('#dish-description').value = dish?.description || '';
  document.querySelector('#dish-image').value = dish?.image || '';
  document.querySelector('#dish-vegetarian').checked = dish?.vegetarian ?? true;
  document.querySelector('#menu-modal-title').textContent = dish ? 'Edit this dish' : 'Add a dish';
  elements.menuModal.showModal();
}

function openCheckout() {
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = Object.entries(cart).reduce((sum, [id, quantity]) => {
    const dish = menu.find((item) => item.id === id);
    return sum + (dish ? Number(dish.price) * quantity : 0);
  }, 0);
  const delivery = subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
  elements.checkoutForm.reset();
  const draft = readStorage(sessionStorage, DRAFT_KEY, {});
  document.querySelector('#customer-name').value = draft.name || '';
  document.querySelector('#customer-phone').value = draft.phone || '';
  document.querySelector('#customer-address').value = draft.address || '';
  if (draft.payment) {
    const choice = elements.checkoutForm.querySelector(`input[name="payment"][value="${CSS.escape(draft.payment)}"]`);
    if (choice) choice.checked = true;
  }
  document.querySelector('#checkout-item-count').textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${delivery ? formatPrice(delivery) + ' delivery' : 'free delivery'}`;
  document.querySelector('#checkout-total').textContent = formatPrice(subtotal + delivery);
  updatePaymentFields();
  elements.checkoutModal.showModal();
}

function updatePaymentFields() {
  const method = elements.checkoutForm.querySelector('input[name="payment"]:checked')?.value;
  const cardFields = document.querySelector('#card-fields');
  const upiFields = document.querySelector('#upi-fields');
  cardFields.hidden = method !== 'Card';
  upiFields.hidden = method !== 'UPI';
  cardFields.querySelectorAll('input').forEach((input) => { input.required = method === 'Card'; });
  upiFields.querySelector('input').required = method === 'UPI';
}

function saveCheckoutDraft() {
  writeStorage(sessionStorage, DRAFT_KEY, {
    name: document.querySelector('#customer-name').value,
    phone: document.querySelector('#customer-phone').value,
    address: document.querySelector('#customer-address').value,
    payment: elements.checkoutForm.querySelector('input[name="payment"]:checked')?.value || 'Card'
  });
}

function clearPaymentDetails() {
  elements.checkoutForm.querySelectorAll('#card-fields input, #upi-fields input').forEach((input) => { input.value = ''; });
}

elements.categoryTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  try { sessionStorage.setItem(FILTER_KEY, activeCategory); } catch { /* Session preferences are optional. */ }
  renderCategories();
  renderMenu();
});

elements.search.addEventListener('input', renderMenu);
elements.search.addEventListener('input', () => {
  try { sessionStorage.setItem('amma-food-search-session', elements.search.value); } catch { /* Session preferences are optional. */ }
});

 elements.menuGrid.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (addButton) {
    const id = addButton.dataset.add;
    cart[id] = (cart[id] || 0) + 1;
    persistCart();
    renderCart();
    showToast('Added to your order.');
  } else if (editButton) {
    const dish = menu.find((item) => item.id === editButton.dataset.edit);
    if (dish) openMenuForm(dish);
  } else if (deleteButton) {
    const dish = menu.find((item) => item.id === deleteButton.dataset.delete);
    if (dish && window.confirm(`Remove ${dish.name} from the menu?`)) {
      menu = menu.filter((item) => item.id !== dish.id);
      delete cart[dish.id];
      persistMenu();
      updateMenu();
      showToast('Dish removed from the menu.');
    }
  }
});

document.querySelector('#manage-menu').addEventListener('click', () => {
  adminMode = !adminMode;
  document.querySelector('#add-dish').hidden = !adminMode;
  document.querySelector('#manage-menu').innerHTML = adminMode ? '<span aria-hidden="true">✓</span> Done managing' : '<span aria-hidden="true">＋</span> Manage menu';
  renderMenu();
  if (adminMode) showToast('Menu management is on. You can add, edit, or remove dishes.');
});

document.querySelector('#add-dish').addEventListener('click', () => openMenuForm());

elements.menuForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!elements.menuForm.reportValidity()) return;
  const id = document.querySelector('#dish-id').value || `dish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const previous = menu.find((dish) => dish.id === id);
  const image = document.querySelector('#dish-image').value.trim();
  const dish = {
    id,
    name: document.querySelector('#dish-name').value.trim(),
    price: Number(document.querySelector('#dish-price').value),
    category: document.querySelector('#dish-category').value,
    description: document.querySelector('#dish-description').value.trim(),
    image: image || previous?.image || fallbackImage,
    vegetarian: document.querySelector('#dish-vegetarian').checked,
    featured: previous?.featured || ''
  };
  if (previous) menu = menu.map((item) => item.id === id ? dish : item);
  else menu = [dish, ...menu];
  persistMenu();
  elements.menuModal.close();
  updateMenu();
  showToast(previous ? 'Dish updated.' : 'Dish added to the menu.');
});

elements.cartItems.addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  const removeButton = event.target.closest('[data-remove]');
  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    cart[id] = (cart[id] || 0) + Number(quantityButton.dataset.change);
    if (cart[id] <= 0) delete cart[id];
    persistCart();
    renderCart();
  } else if (removeButton) {
    delete cart[removeButton.dataset.remove];
    persistCart();
    renderCart();
  }
});

elements.clearCart.addEventListener('click', () => {
  cart = {};
  persistCart();
  renderCart();
});
elements.checkoutButton.addEventListener('click', openCheckout);
elements.checkoutForm.addEventListener('change', (event) => {
  if (event.target.name === 'payment') updatePaymentFields();
  saveCheckoutDraft();
});
elements.checkoutForm.addEventListener('input', (event) => {
  if (!event.target.closest('#card-fields, #upi-fields')) saveCheckoutDraft();
});
elements.checkoutModal.addEventListener('close', clearPaymentDetails);

elements.checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!elements.checkoutForm.reportValidity()) return;
  const method = elements.checkoutForm.querySelector('input[name="payment"]:checked').value;
  if (method === 'Card') {
    const digits = elements.checkoutForm.elements.cardNumber.value.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) {
      elements.checkoutForm.elements.cardNumber.setCustomValidity('Enter a demo card number with 12 to 19 digits.');
      elements.checkoutForm.elements.cardNumber.reportValidity();
      elements.checkoutForm.elements.cardNumber.setCustomValidity('');
      return;
    }
  }
  if (method === 'UPI' && !/^[\w.-]+@[\w.-]+$/.test(elements.checkoutForm.elements.upiId.value.trim())) {
    elements.checkoutForm.elements.upiId.setCustomValidity('Enter a valid demo UPI ID, such as name@bank.');
    elements.checkoutForm.elements.upiId.reportValidity();
    elements.checkoutForm.elements.upiId.setCustomValidity('');
    return;
  }

  const orderItems = Object.entries(cart).map(([id, quantity]) => {
    const dish = menu.find((item) => item.id === id);
    return dish ? { name: dish.name, quantity, price: Number(dish.price) } : null;
  }).filter(Boolean);
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
  const order = {
    id: `AF-${Date.now().toString().slice(-7)}`,
    customer: document.querySelector('#customer-name').value.trim(),
    phone: document.querySelector('#customer-phone').value.trim(),
    address: document.querySelector('#customer-address').value.trim(),
    payment: method,
    items: orderItems,
    total: subtotal + delivery,
    placedAt: new Date().toISOString()
  };
  orders = [order, ...orders].slice(0, 20);
  writeStorage(localStorage, ORDERS_KEY, orders);
  cart = {};
  persistCart();
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Session storage is optional. */ }
  elements.checkoutModal.close();
  document.querySelector('#confirmation-copy').textContent = `Order ${order.id} is confirmed. This demo did not process a payment.`;
  document.querySelector('#confirmation-modal').showModal();
  renderCart();
});

elements.recentOrders.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-order]');
  if (!button) return;
  orders = orders.filter((order) => order.id !== button.dataset.deleteOrder);
  writeStorage(localStorage, ORDERS_KEY, orders);
  renderOrders();
  showToast('Order removed from your history.');
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.close}`).close());
});
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

try { elements.search.value = sessionStorage.getItem('amma-food-search-session') || ''; } catch { /* Session preferences are optional. */ }
document.querySelector('#current-year').textContent = String(new Date().getFullYear());
updateMenu();
