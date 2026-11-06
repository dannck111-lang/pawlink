(() => {
  'use strict';

  const KEY = 'pawlinkPosts';
  const EMOJIS = ['❤️', '🐾', '🙏', '🐕'];
  const examples = {
    'post-welcome': [
      ['Maya R.', 'So glad this community is here. Sharing a sighting can make such a difference!'],
      ['Sam P.', 'Every pet deserves a safe place and a happy ending. 🐾']
    ],
    'post-found': [
      ['Ava K.', 'Thank you for keeping this pup safe! I shared this with my neighborhood group.'],
      ['Jordan L.', 'The rescue has been contacted. Hoping their family sees this soon.'],
      ['Dee W.', 'I can help check nearby lost-pet posts. Please keep us updated!']
    ]
  };
  const read = () => {
    try { const posts = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(posts) ? posts : []; }
    catch { return []; }
  };
  const write = (posts) => { try { localStorage.setItem(KEY, JSON.stringify(posts)); return true; } catch { return false; } };
  const user = () => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}') || {}; }
    catch { return {}; }
  };

  function seed(posts) {
    let changed = false;
    posts.forEach((post) => {
      if (!examples[post.id]) return;
      post.comments = Array.isArray(post.comments) ? post.comments : [];
      if (!post.comments.some((comment) => comment.isDemo)) {
        post.comments.push(...examples[post.id].map(([authorName, text], i) => ({
          id: `example-${post.id}-${i}`, authorId: `example-user-${i}`, authorName, text,
          isDemo: true, createdAt: Date.now() - (i + 1) * 3600000
        })));
        changed = true;
      }
      post.reactions = post.reactions || {};
      EMOJIS.forEach((emoji, i) => {
        if (!Array.isArray(post.reactions[emoji])) post.reactions[emoji] = [];
        if (!post.reactions[emoji].length && (post.id === 'post-welcome' || i < 3)) {
          post.reactions[emoji] = Array.from({ length: 1 + (i % 2) }, (_, n) => `example-reaction-${i}-${n}`);
          changed = true;
        }
      });
    });
    if (changed) write(posts);
  }

  function decorate(card) {
    const id = card.dataset.postId;
    const post = read().find((item) => String(item.id) === id);
    if (!post) return;
    let bar = card.querySelector('.community-reactions');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'community-reactions';
      bar.setAttribute('aria-label', 'React to this post');
      card.querySelector('.feed-actions')?.insertAdjacentElement('afterend', bar);
    }
    bar.replaceChildren(...EMOJIS.map((emoji) => {
      const ids = Array.isArray(post.reactions?.[emoji]) ? post.reactions[emoji] : [];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `reaction-button${user().id && ids.includes(user().id) ? ' is-active' : ''}`;
      button.dataset.reactPost = id;
      button.dataset.reaction = emoji;
      button.setAttribute('aria-label', `${emoji} reaction: ${ids.length}`);
      button.setAttribute('aria-pressed', String(Boolean(user().id && ids.includes(user().id))));
      button.append(document.createTextNode(emoji));
      const count = document.createElement('span');
      count.className = 'reaction-count';
      count.textContent = ids.length;
      button.append(count);
      return button;
    }));
  }

  function init(feed) {
    const toolbar = document.createElement('section');
    toolbar.className = 'reports-toolbar';
    toolbar.setAttribute('aria-label', 'Filter community reports');
    toolbar.innerHTML = '<label class="reports-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search updates, tags, or neighbors" aria-label="Search reports"></label><div class="reports-filter-row" role="group" aria-label="Post category"><button type="button" class="report-filter is-active" data-filter="all" aria-pressed="true">All updates</button><button type="button" class="report-filter" data-filter="lost" aria-pressed="false">Lost pets</button><button type="button" class="report-filter" data-filter="found" aria-pressed="false">Found pets</button><button type="button" class="report-filter" data-filter="reunion" aria-pressed="false">Reunions</button><button type="button" class="report-filter" data-filter="community" aria-pressed="false">Community</button></div><p class="reports-result-count" aria-live="polite"></p>';
    document.querySelector('.composer-prompt')?.insertAdjacentElement('afterend', toolbar);
    let category = 'all';
    const filter = () => {
      const query = toolbar.querySelector('input').value.trim().toLowerCase();
      let visible = 0;
      feed.querySelectorAll('.feed-card').forEach((card) => {
        const tag = card.querySelector('.feed-author small')?.textContent.toLowerCase() || '';
        const group = tag.includes('lost') ? 'lost' : tag.includes('found') ? 'found' : tag.includes('reunion') ? 'reunion' : 'community';
        const show = (category === 'all' || group === category) && (!query || card.textContent.toLowerCase().includes(query));
        card.hidden = !show;
        if (show) visible++;
      });
      toolbar.querySelector('.reports-result-count').textContent = `${visible} ${visible === 1 ? 'update' : 'updates'}`;
    };
    toolbar.addEventListener('input', filter);
    toolbar.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      category = button.dataset.filter;
      toolbar.querySelectorAll('[data-filter]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      filter();
    });
    const renderExtras = () => {
      const posts = read();
      seed(posts);
      feed.querySelectorAll('.feed-card').forEach(decorate);
      filter();
    };
    renderExtras();
    // Observe only feed rows. Watching descendants caused an endless loop when reaction buttons were rebuilt.
    new MutationObserver(renderExtras).observe(feed, { childList: true });
    feed.addEventListener('click', (event) => {
      const button = event.target.closest('[data-react-post]');
      if (!button || !user().id) return;
      const posts = read();
      const post = posts.find((item) => String(item.id) === button.dataset.reactPost);
      if (!post) return;
      post.reactions ||= {};
      const ids = Array.isArray(post.reactions[button.dataset.reaction]) ? post.reactions[button.dataset.reaction] : [];
      post.reactions[button.dataset.reaction] = ids.includes(user().id) ? ids.filter((id) => id !== user().id) : [...ids, user().id];
      if (write(posts)) decorate(button.closest('.feed-card'));
    });
    window.addEventListener('storage', (event) => { if (event.key === KEY) renderExtras(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const feed = document.querySelector('[data-post-feed]');
    if (feed) init(feed);
  });
})();
