(() => {
  'use strict';
  const KEY = 'pawlinkProducts';
  const read = () => { try { const list = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(list) ? list : []; } catch { return []; } };
  const currentUser = () => { try { return JSON.parse(localStorage.getItem('currentUser') || 'null') || {}; } catch { return {}; } };
  const canEdit = (product) => Boolean(product && currentUser().id && product.sellerId === currentUser().id);
  const safeURL = (value) => /^(https:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(String(value || '').trim()) ? String(value).trim() : '';

  function init() {
    const dialog = document.querySelector('[data-product-dialog]');
    const form = dialog?.querySelector('.listing-form');
    const rows = document.querySelector('[data-seller-listings]');
    if (!dialog || !form || !rows) return;

    const open = (product = null) => {
      form.reset();
      form.querySelector('[data-form-error]').textContent = '';
      form.elements.namedItem('productId').value = product?.id || '';
      ['name', 'description', 'price', 'category', 'image'].forEach((key) => {
        const field = form.elements.namedItem(key);
        if (field) field.value = product?.[key] ?? (key === 'category' ? 'Toys' : '');
      });
      dialog.querySelector('#product-modal-title').textContent = product ? 'Edit your listing' : 'List a new item';
      dialog.querySelector('[data-save-product]').textContent = product ? 'Save changes' : 'Publish listing';
      if (!dialog.open) dialog.showModal();
    };

    // Run in capture so the legacy app handler cannot open a second dialog or bypass confirmation.
    document.addEventListener('click', (event) => {
      const add = event.target.closest('[data-open-product]');
      const edit = event.target.closest('[data-edit-product]');
      const remove = event.target.closest('[data-delete-product]');
      const close = event.target.closest('[data-close-product]');
      if (add) {
        event.preventDefault(); event.stopImmediatePropagation(); open(); return;
      }
      if (edit) {
        event.preventDefault(); event.stopImmediatePropagation();
        const product = read().find((item) => item.id === edit.dataset.editProduct);
        if (canEdit(product)) open(product);
        return;
      }
      if (remove) {
        event.preventDefault(); event.stopImmediatePropagation();
        const product = read().find((item) => item.id === remove.dataset.deleteProduct);
        if (!canEdit(product)) return;
        if (!window.confirm(`Remove “${product.name}” from the shop? This cannot be undone.`)) return;
        const products = read().filter((item) => item.id !== product.id);
        try {
          localStorage.setItem(KEY, JSON.stringify(products));
          // Reload to refresh both the catalog and seller table, including cart visibility.
          window.location.reload();
        } catch { window.alert('Could not remove this listing. Please try again.'); }
        return;
      }
      if (close) { event.preventDefault(); event.stopImmediatePropagation(); dialog.close(); }
    }, true);

    // Save/edit only listings belonging to this user; seeded marketplace products remain read-only.
    document.addEventListener('submit', (event) => {
      if (event.target !== form) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const error = form.querySelector('[data-form-error]');
      error.textContent = '';
      const data = new FormData(form);
      const id = String(data.get('productId') || '');
      const existing = id ? read().find((item) => item.id === id) : null;
      if (existing && !canEdit(existing)) { error.textContent = 'You can only edit your own listings.'; return; }
      const name = String(data.get('name') || '').trim();
      const description = String(data.get('description') || '').trim();
      const price = Number(data.get('price'));
      if (!name || !description || !Number.isFinite(price) || price <= 0) { error.textContent = 'Enter a name, description, and valid price.'; return; }
      const user = currentUser();
      const product = {
        ...(existing || {}),
        id: existing?.id || `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sellerId: existing?.sellerId || user.id,
        sellerName: existing?.sellerName || user.name || user.email || 'PawLink seller',
        name, description, price,
        category: String(data.get('category') || 'Other'),
        image: safeURL(data.get('image')) || existing?.image || '',
        active: true
      };
      const products = read();
      const updated = existing ? products.map((item) => item.id === existing.id ? product : item) : [product, ...products];
      try {
        localStorage.setItem(KEY, JSON.stringify(updated));
        window.location.reload();
      } catch { error.textContent = 'Unable to save this listing in your browser. Check storage and retry.'; }
    }, true);

    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('cancel', () => { form.querySelector('[data-form-error]').textContent = ''; });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
