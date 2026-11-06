(() => {
  'use strict';
  const KEY = 'pawlinkPosts';
  const EMOJIS = ['❤️', '🐾', '🙏', '🐕'];
  const samples = {
    'post-welcome': [['Maya R.', 'So glad this community is here. Sharing a sighting can make such a difference!'], ['Sam P.', 'Every pet deserves a safe place and a happy ending. 🐾']],
    'post-found': [['Ava K.', 'Thank you for keeping this pup safe! I shared this with my neighborhood group.'], ['Jordan L.', 'The rescue has been contacted. Hoping their family sees this soon.'], ['Dee W.', 'I can help check nearby lost-pet posts. Please keep us updated!']]
  };
  const starters = [
    { id: 'post-welcome', authorId: 'pawlink-community', authorName: 'PawLink Community', tag: 'Community update', caption: 'Welcome to PawLink! Share a helpful sighting, celebrate a reunion, or introduce your furry family. Every little action helps.', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1000&q=80' },
    { id: 'post-found', authorId: 'neighbor-01', authorName: 'Jordan Lee', tag: 'Found pet', caption: 'Friendly pup spotted near Lake Merritt this morning. They are safe with a local rescue while we look for their family.', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80' }
  ];
  const read = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || 'null'); return Array.isArray(x) ? x : null; } catch { return null; } };
  const write = (posts) => { try { localStorage.setItem(KEY, JSON.stringify(posts)); return true; } catch { return false; } };
  const getUser = () => { try { return JSON.parse(localStorage.getItem('currentUser') || '{}') || {}; } catch { return {}; } };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const own = (post, user) => Boolean(user.id && post.authorId === user.id);
  const imageURL = (value) => /^(https:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(value || '') ? value : '';

  function loadPosts() {
    // Older versions stored [] before starter content existed; treat an empty list as uninitialized.
    let posts = read();
    if (!posts?.length) posts = starters.map((p, index) => ({ ...p, createdAt: Date.now() - index * 3600000, likes: [], comments: [], reactions: {} }));
    let changed = false;
    posts.forEach((post) => {
      post.likes = Array.isArray(post.likes) ? post.likes : [];
      post.comments = Array.isArray(post.comments) ? post.comments : [];
      post.reactions = post.reactions && typeof post.reactions === 'object' ? post.reactions : {};
      if (samples[post.id] && !post.comments.some((c) => c.isDemo)) {
        post.comments.push(...samples[post.id].map(([authorName, text], i) => ({ id: `sample-${post.id}-${i}`, authorId: `demo-${i}`, authorName, text, isDemo: true, createdAt: Date.now() - (i + 1) * 1800000 })));
        changed = true;
      }
      if (samples[post.id]) EMOJIS.forEach((emoji, i) => {
        if (!Array.isArray(post.reactions[emoji])) post.reactions[emoji] = [];
        if (!post.reactions[emoji].length && (post.id === 'post-welcome' || i < 3)) {
          post.reactions[emoji] = Array.from({ length: 1 + i % 2 }, (_, n) => `demo-react-${i}-${n}`);
          changed = true;
        }
      });
    });
    if (!read()?.length || changed) write(posts);
    return posts;
  }

  function init() {
    const feed = document.querySelector('[data-post-feed]');
    const dialog = document.querySelector('[data-post-dialog]');
    const form = document.querySelector('[data-post-form]');
    if (!feed || !dialog || !form) return;
    let user = getUser();
    if (!user.id) { user.id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`; try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch {} }

    const toolbar = el('section', 'reports-toolbar');
    toolbar.setAttribute('aria-label', 'Filter community reports');
    toolbar.innerHTML = '<label class="reports-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search updates, tags, or neighbors" aria-label="Search reports"></label><div class="reports-filter-row"><button type="button" class="report-filter is-active" data-filter="all" aria-pressed="true">All updates</button><button type="button" class="report-filter" data-filter="lost" aria-pressed="false">Lost pets</button><button type="button" class="report-filter" data-filter="found" aria-pressed="false">Found pets</button><button type="button" class="report-filter" data-filter="reunion" aria-pressed="false">Reunions</button><button type="button" class="report-filter" data-filter="community" aria-pressed="false">Community</button></div><p class="reports-result-count" aria-live="polite"></p>';
    document.querySelector('.composer-prompt')?.insertAdjacentElement('afterend', toolbar);
    let category = 'all';
    const filter = () => {
      const query = toolbar.querySelector('input').value.trim().toLowerCase(); let count = 0;
      feed.querySelectorAll('.feed-card').forEach((card) => {
        const tag = card.dataset.tag.toLowerCase();
        const type = tag.includes('lost') ? 'lost' : tag.includes('found') ? 'found' : tag.includes('reunion') ? 'reunion' : 'community';
        const show = (category === 'all' || type === category) && (!query || card.textContent.toLowerCase().includes(query));
        card.hidden = !show; if (show) count++;
      });
      toolbar.querySelector('.reports-result-count').textContent = `${count} ${count === 1 ? 'update' : 'updates'}`;
    };
    toolbar.addEventListener('input', filter);
    toolbar.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]'); if (!button) return;
      category = button.dataset.filter;
      toolbar.querySelectorAll('[data-filter]').forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
      filter();
    });

    function render() {
      const posts = loadPosts().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      feed.replaceChildren();
      posts.forEach((post) => {
        const card = el('article', 'feed-card'); card.dataset.postId = post.id; card.dataset.tag = post.tag || 'Community';
        const header = el('header', 'feed-post-head'); header.append(el('span', 'feed-avatar', (post.authorName || 'P')[0].toUpperCase()));
        const author = el('div', 'feed-author'); author.append(el('strong', '', post.authorName || 'PawLink member'), el('small', '', `${post.tag || 'Community'} · ${new Date(post.createdAt || Date.now()).toLocaleDateString()}`)); header.append(author);
        if (own(post, user)) { const actions = el('div', 'owner-actions'); const edit = el('button', 'small-action', 'Edit'); edit.type = 'button'; edit.dataset.editPost = post.id; const del = el('button', 'small-action danger', 'Delete'); del.type = 'button'; del.dataset.deletePost = post.id; actions.append(edit, del); header.append(actions); }
        card.append(header, el('p', 'feed-caption', post.caption || ''));
        const src = imageURL(post.image); if (src) { const image = el('img', 'feed-image'); image.src = src; image.alt = `Photo shared by ${post.authorName || 'a community member'}`; image.loading = 'lazy'; image.onerror = () => image.remove(); card.append(image); }
        const actions = el('div', 'feed-actions'); const liked = post.likes.includes(user.id); const like = el('button', `like-button${liked ? ' liked' : ''}`, `♥ ${post.likes.length} Like`); like.type = 'button'; like.dataset.likePost = post.id; like.setAttribute('aria-pressed', String(liked)); actions.append(like, el('span', '', `${post.comments.length} comments`)); card.append(actions);
        const reactions = el('div', 'community-reactions'); reactions.setAttribute('aria-label', 'React to this post');
        EMOJIS.forEach((emoji) => { const ids = Array.isArray(post.reactions[emoji]) ? post.reactions[emoji] : []; const b = el('button', `reaction-button${ids.includes(user.id) ? ' is-active' : ''}`); b.type = 'button'; b.dataset.reactPost = post.id; b.dataset.reaction = emoji; b.setAttribute('aria-pressed', String(ids.includes(user.id))); b.setAttribute('aria-label', `${emoji} reaction: ${ids.length}`); b.append(document.createTextNode(emoji), el('span', 'reaction-count', String(ids.length))); reactions.append(b); });
        card.append(reactions);
        const comments = el('div', 'comment-list'); post.comments.forEach((comment) => { const row = el('p'); row.append(el('strong', '', `${comment.authorName || 'Neighbor'}: `), document.createTextNode(comment.text || '')); comments.append(row); }); card.append(comments);
        const cf = document.createElement('form'); cf.className = 'comment-form'; cf.dataset.commentPost = post.id; const input = document.createElement('input'); input.name = 'comment'; input.required = true; input.maxLength = 400; input.placeholder = 'Write a helpful comment...'; input.setAttribute('aria-label', 'Write a comment'); const submit = el('button', 'button button-outline', 'Comment'); submit.type = 'submit'; cf.append(input, submit); card.append(cf);
        feed.append(card);
      });
      if (!posts.length) feed.append(el('p', 'empty-state', 'No community updates yet. Be the first to share one.'));
      filter();
    }

    function openPost(post) {
      form.reset(); form.dataset.imageData = ''; form.elements.namedItem('postId').value = post?.id || ''; form.elements.namedItem('caption').value = post?.caption || ''; form.elements.namedItem('tag').value = post?.tag || 'Community update'; form.elements.namedItem('imageUrl').value = post?.image?.startsWith('data:') ? '' : post?.image || ''; dialog.querySelector('[data-post-modal-title]').textContent = post ? 'Edit your post' : 'Create a community post'; dialog.showModal();
    }
    document.querySelector('[data-open-post]')?.addEventListener('click', () => openPost());
    dialog.querySelectorAll('[data-close-post]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    form.addEventListener('change', (event) => {
      if (event.target.name !== 'imageFile' || !event.target.files?.[0]) return;
      const file = event.target.files[0]; const error = form.querySelector('[data-form-error]');
      if (!file.type.startsWith('image/') || file.size > 900000) { event.target.value = ''; error.textContent = 'Choose an image under 900 KB.'; return; }
      const reader = new FileReader(); reader.onload = () => { form.dataset.imageData = reader.result; }; reader.readAsDataURL(file);
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault(); const data = new FormData(form); const id = String(data.get('postId') || ''); const caption = String(data.get('caption') || '').trim(); const error = form.querySelector('[data-form-error]'); error.textContent = '';
      if (!caption) { error.textContent = 'Add a caption before publishing.'; return; }
      const posts = loadPosts(); const previous = posts.find((p) => p.id === id); if (previous && !own(previous, user)) { error.textContent = 'You can only edit your own posts.'; return; }
      const post = { id: previous?.id || `post-${Date.now()}`, authorId: previous?.authorId || user.id, authorName: previous?.authorName || user.name || user.email || 'PawLink member', tag: String(data.get('tag')), caption, image: imageURL(String(data.get('imageUrl') || '')) || form.dataset.imageData || previous?.image || '', createdAt: previous?.createdAt || Date.now(), likes: previous?.likes || [], comments: previous?.comments || [], reactions: previous?.reactions || {} };
      const next = previous ? posts.map((p) => p.id === id ? post : p) : [post, ...posts]; if (write(next)) { dialog.close(); render(); }
    });
    feed.addEventListener('click', (event) => {
      const button = event.target.closest('[data-like-post], [data-react-post], [data-edit-post], [data-delete-post]'); if (!button) return;
      const posts = loadPosts(); const id = button.dataset.likePost || button.dataset.reactPost || button.dataset.editPost || button.dataset.deletePost; const post = posts.find((p) => p.id === id); if (!post) return;
      if (button.hasAttribute('data-edit-post')) { if (own(post, user)) openPost(post); return; }
      if (button.hasAttribute('data-delete-post')) { if (own(post, user) && confirm('Delete your community post?')) { write(posts.filter((p) => p.id !== id)); render(); } return; }
      if (button.hasAttribute('data-like-post')) post.likes = post.likes.includes(user.id) ? post.likes.filter((x) => x !== user.id) : [...post.likes, user.id];
      else { const emoji = button.dataset.reaction; const ids = Array.isArray(post.reactions[emoji]) ? post.reactions[emoji] : []; post.reactions[emoji] = ids.includes(user.id) ? ids.filter((x) => x !== user.id) : [...ids, user.id]; }
      if (write(posts)) render();
    });
    feed.addEventListener('submit', (event) => {
      const commentForm = event.target.closest('[data-comment-post]'); if (!commentForm) return; event.preventDefault(); const text = String(new FormData(commentForm).get('comment') || '').trim(); if (!text) return;
      const posts = loadPosts(); const post = posts.find((p) => p.id === commentForm.dataset.commentPost); if (!post) return;
      post.comments.push({ id: `comment-${Date.now()}`, authorId: user.id, authorName: user.name || user.email || 'Neighbor', text, createdAt: Date.now() }); if (write(posts)) render();
    });
    window.addEventListener('storage', (event) => { if (event.key === KEY) render(); });
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
