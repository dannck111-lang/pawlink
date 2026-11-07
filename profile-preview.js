(() => {
  'use strict';
  if (window.PawLinkProfilePreviewLoaded) return;
  window.PawLinkProfilePreviewLoaded = true;

  const previewTargets = '.feed-author strong, .comment-list strong, .product-review-header strong';
  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  };
  const nameOf = (value) => String(value || '').replace(/:\s*$/, '').trim();
  const makeProfileLinks = (root = document) => {
    root.querySelectorAll(previewTargets).forEach((label) => {
      if (label.closest('button')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'profile-preview-link';
      button.dataset.profileName = nameOf(label.textContent);
      button.textContent = label.textContent;
      button.setAttribute('aria-label', `View ${button.dataset.profileName}'s public profile`);
      label.replaceWith(button);
    });
  };

  function init() {
    makeProfileLinks();
    const dialog = document.createElement('dialog');
    dialog.className = 'profile-preview-dialog';
    dialog.setAttribute('aria-labelledby', 'profile-preview-title');
    dialog.innerHTML = '<form method="dialog" class="profile-preview-close-form"><button class="profile-preview-close" aria-label="Close profile preview">×</button></form><div class="profile-preview-head"><span class="profile-preview-avatar" data-preview-avatar></span><div><p class="home-eyebrow">Community member</p><h2 id="profile-preview-title" data-preview-name></h2></div></div><p class="profile-preview-description">Public activity on PawLink</p><div class="profile-preview-activity" data-preview-activity></div>';
    document.body.append(dialog);

    const show = (name) => {
      const posts = read('pawlinkPosts', []);
      const allReviews = read('pawlinkProductReviews', {});
      const activities = [];
      if (Array.isArray(posts)) posts.forEach((post) => {
        if (post.authorName === name && post.caption) activities.push({ type: post.tag || 'Community post', text: post.caption, date: post.createdAt });
        (Array.isArray(post.comments) ? post.comments : []).forEach((comment) => {
          if (comment.authorName === name && comment.text) activities.push({ type: 'Community comment', text: comment.text, date: comment.createdAt });
        });
      });
      if (allReviews && typeof allReviews === 'object') Object.values(allReviews).forEach((reviews) => {
        (Array.isArray(reviews) ? reviews : []).forEach((review) => {
          if (review.authorName === name && review.comment) activities.push({ type: `Product review · ${'★'.repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)))}`, text: review.comment, date: review.createdAt });
        });
      });
      dialog.querySelector('[data-preview-name]').textContent = name;
      dialog.querySelector('[data-preview-avatar]').textContent = name.charAt(0).toUpperCase() || 'P';
      const activity = dialog.querySelector('[data-preview-activity]');
      activity.replaceChildren();
      activities.sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
      if (!activities.length) {
        const empty = document.createElement('p');
        empty.className = 'profile-preview-empty';
        empty.textContent = 'No public posts, comments, or reviews yet.';
        activity.append(empty);
      } else activities.forEach((entry) => {
        const article = document.createElement('article');
        article.className = 'profile-preview-entry';
        const type = document.createElement('strong'); type.textContent = entry.type;
        const text = document.createElement('p'); text.textContent = entry.text;
        article.append(type, text);
        if (entry.date) { const date = document.createElement('small'); date.textContent = new Date(entry.date).toLocaleDateString(); article.append(date); }
        activity.append(article);
      });
      if (!dialog.open) dialog.showModal();
    };

    document.addEventListener('click', (event) => {
      const link = event.target.closest('.profile-preview-link');
      if (link) show(link.dataset.profileName);
      if (event.target === dialog) dialog.close();
    });
    // Feed cards and review lists are rendered dynamically; only replace author labels, never edit controls.
    new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches?.(previewTargets)) makeProfileLinks(node.parentElement || document);
      makeProfileLinks(node);
    }))).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
