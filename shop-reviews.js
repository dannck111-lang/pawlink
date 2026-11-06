(() => {
  'use strict';

  const REVIEW_KEY = 'pawlinkProductReviews';
  const BOWL_IMAGE = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=85';
  const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?auto=format&fit=crop&w=800&q=80';

  function safeRead() {
    try {
      const value = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (error) { return {}; }
  }

  function userDetails() {
    try { return JSON.parse(localStorage.getItem('currentUser') || 'null') || {}; }
    catch (error) { return {}; }
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function starText(value) { return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`; }

  function hydrateCard(card) {
    const addButton = card.querySelector('[data-add-cart]');
    const productId = addButton?.dataset.addCart;
    if (!productId || card.dataset.reviewsReady === 'true') return;
    card.dataset.reviewsReady = 'true';

    const image = card.querySelector(':scope > img');
    if (image && image.dataset.fallbackReady !== 'true') {
      image.dataset.fallbackReady = 'true';
      image.addEventListener('error', () => {
        if (image.dataset.usedFallback === 'true') return;
        image.dataset.usedFallback = 'true';
        image.src = IMAGE_FALLBACK;
      });
    }

    const body = card.querySelector('.product-card-body');
    if (!body) return;
    const feedback = node('details', 'product-feedback');
    const summary = node('summary', 'product-feedback-summary');
    const list = node('div', 'product-review-list');
    const form = document.createElement('form');
    form.className = 'product-review-form';
    form.dataset.reviewProduct = productId;

    const ratingLabel = document.createElement('label');
    ratingLabel.className = 'review-rating-label';
    ratingLabel.append(node('span', '', 'Your rating'));
    const rating = document.createElement('select');
    rating.name = 'rating';
    rating.setAttribute('aria-label', 'Select a star rating');
    [5, 4, 3, 2, 1].forEach((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = `${starText(value)} ${value}`;
      rating.append(option);
    });
    ratingLabel.append(rating);
    const commentLabel = document.createElement('label');
    commentLabel.className = 'review-comment-label';
    commentLabel.append(node('span', '', 'Review or comment'));
    const comment = document.createElement('textarea');
    comment.name = 'comment';
    comment.rows = 2;
    comment.maxLength = 500;
    comment.required = true;
    comment.placeholder = 'Share your thoughts about this item...';
    commentLabel.append(comment);
    const submit = node('button', 'button button-primary review-submit', 'Post review');
    submit.type = 'submit';
    form.append(ratingLabel, commentLabel, submit);
    feedback.append(summary, list, form);
    body.append(feedback);

    const renderReviews = () => {
      const all = safeRead();
      const reviews = Array.isArray(all[productId]) ? all[productId] : [];
      const average = reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1) : null;
      summary.textContent = average ? `Reviews & comments  ·  ${starText(Math.round(Number(average)))} ${average} (${reviews.length})` : 'Reviews & comments  ·  Be the first to review';
      list.replaceChildren();
      if (!reviews.length) {
        list.append(node('p', 'no-reviews', 'No reviews yet. Share the first helpful review.'));
        return;
      }
      reviews.slice().reverse().forEach((review) => {
        const item = node('article', 'product-review');
        const header = node('div', 'product-review-header');
        header.append(node('strong', '', review.authorName || 'PawLink member'), node('span', 'review-stars', starText(Number(review.rating) || 5)));
        item.append(header, node('p', '', review.comment || ''), node('small', 'review-date', review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''));
        list.append(item);
      });
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const user = userDetails();
      const text = comment.value.trim();
      if (!text) return;
      const all = safeRead();
      const reviews = Array.isArray(all[productId]) ? all[productId] : [];
      reviews.push({ authorId: user.id || '', authorName: user.name || user.email || 'PawLink member', rating: Number(rating.value), comment: text, createdAt: Date.now() });
      all[productId] = reviews;
      try {
        localStorage.setItem(REVIEW_KEY, JSON.stringify(all));
        comment.value = '';
        renderReviews();
        feedback.open = true;
      } catch (error) {
        let notice = form.querySelector('.review-error');
        if (!notice) { notice = node('p', 'review-error'); form.append(notice); }
        notice.textContent = 'Could not save your review. Please try again.';
      }
    });

    window.addEventListener('storage', (event) => { if (event.key === REVIEW_KEY) renderReviews(); });
    renderReviews();
  }

  function refreshCards() {
    const grid = document.querySelector('[data-product-grid]');
    if (!grid) return;
    grid.querySelectorAll('.product-card').forEach(hydrateCard);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Correct the previously saved bowl URL as well as the seed URL, then let the shop redraw.
    try {
      const products = JSON.parse(localStorage.getItem('pawlinkProducts') || '[]');
      let changed = false;
      products.forEach((product) => {
        if (product.name === 'Everyday Ceramic Bowl' && /400dc9ECC119/i.test(product.image || '')) {
          product.image = BOWL_IMAGE;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('pawlinkProducts', JSON.stringify(products));
        window.dispatchEvent(new StorageEvent('storage', { key: 'pawlinkProducts' }));
      }
    } catch (error) { /* Keep the current shop usable when local storage is unavailable. */ }

    refreshCards();
    const grid = document.querySelector('[data-product-grid]');
    if (grid) new MutationObserver(refreshCards).observe(grid, { childList: true });
    window.addEventListener('storage', (event) => { if (event.key === 'pawlinkProducts') requestAnimationFrame(refreshCards); });
  });
})();
