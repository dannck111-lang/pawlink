(() => {
  'use strict';

  const POSTS_KEY = 'pawlinkPosts';
  const REACTIONS = ['❤️', '🐾', '🙏', '🐕'];
  const SAMPLE_COMMENTS = {
    'post-welcome': [
      { id: 'demo-welcome-1', authorId: 'demo-neighbor-maya', authorName: 'Maya R.', text: 'So glad this community is here. Sharing a sighting can make such a difference!', createdAt: Date.now() - 7200000, isDemo: true },
      { id: 'demo-welcome-2', authorId: 'demo-neighbor-sam', authorName: 'Sam P.', text: 'Every pet deserves a safe place and a happy ending. 🐾', createdAt: Date.now() - 3600000, isDemo: true }
    ],
    'post-found': [
      { id: 'demo-found-1', authorId: 'demo-neighbor-ava', authorName: 'Ava K.', text: 'Thank you for keeping this pup safe! I have shared the post with my neighborhood group.', createdAt: Date.now() - 2700000, isDemo: true },
      { id: 'demo-found-2', authorId: 'demo-neighbor-jordan', authorName: 'Jordan L.', text: 'The rescue has been contacted. Hoping their family sees this soon.', createdAt: Date.now() - 1500000, isDemo: true },
      { id: 'demo-found-3', authorId: 'demo-neighbor-dee', authorName: 'Dee W.', text: 'I can help check nearby lost-pet posts. Please keep us updated!', createdAt: Date.now() - 900000, isDemo: true }
    ]
  };

  function readPosts() {
    try {
      const value = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }
  function savePosts(posts) {
    try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); return true; }
    catch (error) { return false; }
  }
  function currentUser() {
    try { return JSON.parse(localStorage.getItem('currentUser') || 'null') || {}; }
    catch (error) { return {}; }
  }
  function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  // Add clearly labeled sample engagement for the built-in example posts only.
  const initial = readPosts();
  let seeded = false;
  initial.forEach((post) => {
    const samples = SAMPLE_COMMENTS[post.id];
    if (!samples) return;
    post.comments = Array.isArray(post.comments) ? post.comments : [];
    if (!post.comments.some((comment) => comment.isDemo)) {
      post.comments = [...post.comments, ...samples];
      seeded = true;
    }
    post.reactions = post.reactions && typeof post.reactions === 'object' ? post.reactions : {};
    REACTIONS.forEach((emoji, index) => {
      if (!Array.isArray(post.reactions[emoji])) post.reactions[emoji] = [];
      if (post.reactions[emoji].length === 0 && (post.id === 'post-welcome' || index < 3)) {
        post.reactions[emoji] = Array.from({ length: post.id === 'post-found' && index === 3 ? 0 : (index % 2) + 1 }, (_, n) => `demo-react-${post.id}-${index}-${n}`);
        if (post.reactions[emoji].length) seeded = true;
      }
    });
  });
  if (seeded) savePosts(initial);

  function addEngagementControls(card) {
    const postId = card.dataset.postId;
    if (!postId) return;
    const post = readPosts().find((item) => String(item.id) === postId);
    if (!post) return;
    let reactionBar = card.querySelector('.community-reactions');
    if (!reactionBar) {
      reactionBar = document.createElement('div');
      reactionBar.className = 'community-reactions';
      reactionBar.setAttribute('aria-label', 'React to this post');
      const feedActions = card.querySelector('.feed-actions');
      if (feedActions) feedActions.insertAdjacentElement('afterend', reactionBar);
      else card.append(reactionBar);
    }
    const reactions = post.reactions || {};
    const userId = currentUser().id;
    reactionBar.replaceChildren();
    REACTIONS.forEach((emoji) => {
      const users = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `reaction-button${userId && users.includes(userId) ? ' is-active' : ''}`;
      button.dataset.reactPost = postId;
      button.dataset.reaction = emoji;
      button.setAttribute('aria-label', `${emoji} reaction, ${users.length} total`);
      button.setAttribute('aria-pressed', String(Boolean(userId && users.includes(userId))));
      const face = document.createElement('span'); face.textContent = emoji;
      const count = document.createElement('span'); count.className = 'reaction-count'; count.textContent = String(users.length);
      button.append(face, count);
      reactionBar.append(button);
    });
  }

  function initToolbar(feed) {
    const toolbar = document.createElement('section');
    toolbar.className = 'reports-toolbar';
    toolbar.setAttribute('aria-label', 'Filter community reports');
    toolbar.innerHTML = `<label class="reports-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search updates, tags, or neighbors" aria-label="Search community reports" data-report-search></label>
      <div class="reports-filter-row" role="group" aria-label="Filter by post type"><button type="button" class="report-filter is-active" data-report-filter="all" aria-pressed="true">All updates</button><button type="button" class="report-filter" data-report-filter="lost" aria-pressed="false">Lost pets</button><button type="button" class="report-filter" data-report-filter="found" aria-pressed="false">Found pets</button><button type="button" class="report-filter" data-report-filter="reunion" aria-pressed="false">Reunions</button><button type="button" class="report-filter" data-report-filter="community" aria-pressed="false">Community</button></div>
      <p class="reports-result-count" data-report-count aria-live="polite"></p>`;
    const composer = document.querySelector('.composer-prompt');
    composer?.insertAdjacentElement('afterend', toolbar);

    let selected = 'all';
    const applyFilters = () => {
      const query = (toolbar.querySelector('[data-report-search]')?.value || '').trim().toLowerCase();
      const cards = [...feed.querySelectorAll('.feed-card')];
      let visible = 0;
      cards.forEach((card) => {
        const tag = card.querySelector('.feed-author small')?.textContent?.toLowerCase() || '';
        const content = `${card.textContent} ${card.querySelector('.feed-image')?.alt || ''}`.toLowerCase();
        const categoryMatch = selected === 'all' || (selected === 'lost' && tag.includes('lost')) || (selected === 'found' && tag.includes('found')) || (selected === 'reunion' && tag.includes('reunion')) || (selected === 'community' && !tag.includes('lost') && !tag.includes('found') && !tag.includes('reunion'));
        const match = categoryMatch && (!query || content.includes(query));
        card.hidden = !match;
        if (match) visible += 1;
      });
      const count = toolbar.querySelector('[data-report-count]');
      if (count) count.textContent = `${visible} ${visible === 1 ? 'update' : 'updates'}`;
    };
    toolbar.addEventListener('input', applyFilters);
    toolbar.addEventListener('click', (event) => {
      const button = event.target.closest('[data-report-filter]');
      if (!button) return;
      selected = button.dataset.reportFilter;
      toolbar.querySelectorAll('[data-report-filter]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    });
    return applyFilters;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const feed = document.querySelector('[data-post-feed]');
    if (!feed) return;
    const filter = initToolbar(feed);
    const decorate = () => {
      feed.querySelectorAll('.feed-card').forEach(addEngagementControls);
      filter();
    };
    decorate();
    new MutationObserver(decorate).observe(feed, { childList: true, subtree: true });

    feed.addEventListener('click', (event) => {
      const button = event.target.closest('[data-react-post]');
      if (!button) return;
      const user = currentUser();
      if (!user.id) return;
      const posts = readPosts();
      const post = posts.find((item) => String(item.id) === button.dataset.reactPost);
      if (!post) return;
      post.reactions = post.reactions && typeof post.reactions === 'object' ? post.reactions : {};
      const emoji = button.dataset.reaction;
      const users = Array.isArray(post.reactions[emoji]) ? post.reactions[emoji] : [];
      post.reactions[emoji] = users.includes(user.id) ? users.filter((id) => id !== user.id) : [...users, user.id];
      if (!savePosts(posts)) return;
      addEngagementControls(button.closest('.feed-card'));
    });

    window.addEventListener('storage', (event) => {
      if (event.key === POSTS_KEY) requestAnimationFrame(decorate);
    });
  });
})();
