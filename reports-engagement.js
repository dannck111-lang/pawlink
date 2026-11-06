(() => {
  'use strict';

  const KEY = 'pawlinkPosts';
  const EMOJIS = ['❤️', '🐾', '🙏', '🐕'];
  const samples = {
    'post-welcome': [['Maya R.', 'So glad this community is here. Sharing a sighting can make such a difference!'], ['Sam P.', 'Every pet deserves a safe place and a happy ending. 🐾']],
    'post-found': [['Ava K.', 'Thank you for keeping this pup safe! I shared this with my neighborhood group.'], ['Jordan L.', 'The rescue has been contacted. Hoping their family sees this soon.'], ['Dee W.', 'I can help check nearby lost-pet posts. Please keep us updated!']]
  };
  const starterPosts = [
    { id: 'post-welcome', authorId: 'pawlink-community', authorName: 'PawLink Community', tag: 'Community update', caption: 'Welcome to PawLink! Share a helpful sighting, celebrate a reunion, or introduce your furry family. Every little action helps.', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1000&q=80', likes: [], comments: [], reactions: {}, createdAt: Date.now() - 86400000 },
    { id: 'post-found', authorId: 'neighbor-01', authorName: 'Jordan Lee', tag: 'Found pet', caption: 'Friendly pup spotted near Lake Merritt this morning. They are safe with a local rescue while we look for their family.', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80', likes: [], comments: [], reactions: {}, createdAt: Date.now() - 3600000 }
  ];

  const read = () => {
    try { const data = JSON.parse(localStorage.getItem(KEY) || 'null'); return Array.isArray(data) ? data : null; }
    catch { return null; }
  };
  const write = (posts) => {
    try { localStorage.setItem(KEY, JSON.stringify(posts)); return true; }
    catch { notify('Could not save your update. Check your browser storage and try again.'); return false; }
  };
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}') || {}; }
    catch { return {}; }
  };
  function ensureUser() {
    const user = getUser();
    if (!user.id) {
      user.id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch { /* Continue with a page-session ID. */ }
    }
    return user;
  }
  function notify(message) {
    let toast = document.querySelector('[data-report-toast]');
    if (!toast) {
      toast = document.createElement('p');
      toast.className = 'paw-toast';
      toast.dataset.reportToast = '';
      toast.setAttribute('role', 'status');
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const safeImage = (value) => /^(https:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(value || '') ? value : '';
  const owns = (post, user) => Boolean(user.id && post.authorId === user.id);
  const timeLabel = (time) => {
    const age = Math.max(0, Date.now() - Number(time || Date.now()));
    if (age < 60000) return 'just now';
    if (age < 3600000) return `${Math.floor(age / 60000)}m ago`;
    if (age < 86400000) return `${Math.floor(age / 3600000)}h ago`;
    return new Date(time).toLocaleDateString();
  };

  function seedPosts() {
    let posts = read();
    if (!posts) posts = starterPosts.map((post) => ({ ...post }));
    let changed = false;
    posts.forEach((post) => {
      post.likes = Array.isArray(post.likes) ? post.likes : [];
      post.comments = Array.isArray(post.comments) ? post.comments : [];
      post.reactions = post.reactions && typeof post.reactions === 'object' ? post.reactions : {};
      if (samples[post.id] && !post.comments.some((comment) => comment.isDemo)) {
        post.comments.push(...samples[post.id].map(([authorName, text], index) => ({ id: `sample-${post.id}-${index}`, authorId: `sample-user-${index}`, authorName, text, isDemo: true, createdAt: Date.now() - (index + 1) * 3600000 })));
        changed = true;
      }
      if (samples[post.id]) EMOJIS.forEach((emoji, index) => {
        if (!Array.isArray(post.reactions[emoji])) post.reactions[emoji] = [];
        if (!post.reactions[emoji].length && (post.id === 'post-welcome' || index < 3)) {
          post.reactions[emoji] = Array.from({ length: 1 + index % 2 }, (_, n) => `sample-reaction-${index}-${n}`);
          changed = true;
        }
      });
    });
    if (!read() || changed) {
      try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch { /* Keep starter content for this session. */ }
    }
    return posts;
  }

  function init() {
    const feed = document.querySelector('[data-post-feed]');
    const dialog = document.querySelector('[data-post-dialog]');
    const form = document.querySelector('[data-post-form]');
    const user = ensureUser();
    if (!feed || !dialog || !form) return;

    const toolbar = el('section', 'reports-toolbar');
    toolbar.setAttribute('aria-label', 'Filter community reports');
    toolbar.innerHTML = '<label class="reports-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search updates, tags, or neighbors" aria-label="Search reports"></label><div class="reports-filter-row"><button type="button" class="report-filter is-active" data-filter="all">All updates</button><button type="button" class="report-filter" data-filter="lost">Lost pets</button><button type="button" class="report-filter" data-filter="found">Found pets</button><button type="button" class="report-filter" data-filter="reunion">Reunions</button><button type="button" class="report-filter" data-filter="community">Community</button></div><p class="reports-result-count" aria-live="polite"></p>';
    document.querySelector('.composer-prompt')?.insertAdjacentElement('afterend', toolbar);
    let category = 'all';

    function updateFilter() {
      const query = toolbar.querySelector('input').value.trim().toLowerCase();
      let count = 0;
      feed.querySelectorAll('.feed-card').forEach((card) => {
        const tag = card.dataset.tag.toLowerCase();
        const type = tag.includes('lost') ? 'lost' : tag.includes('found') ? 'found' : tag.includes('reunion') ? 'reunion' : 'community';
        const visible = (category === 'all' || type === category) && (!query || card.textContent.toLowerCase().includes(query));
        card.hidden = !visible;
        if (visible) count++;
      });
      toolbar.querySelector('.reports-result-count').textContent = `${count} ${count === 1 ? 'update' : 'updates'}`;
    }

    function render() {
      const posts = seedPosts().sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      feed.replaceChildren();
      if (!posts.length) {
        feed.append(el('p', 'empty-state', 'No community updates yet. Be the first to share one.'));
        updateFilter();
        return;
      }
      posts.forEach((post) => {
        const card = el('article', 'feed-card');
        card.dataset.postId = post.id;
        card.dataset.tag = post.tag || 'Community';
        const header = el('header', 'feed-post-head');
        header.append(el('span', 'feed-avatar', (post.authorName || 'P').trim().charAt(0).toUpperCase()));
        const author = el('div', 'feed-author');
        author.append(el('strong', '', post.authorName || 'PawLink member'), el('small', '', `${post.tag || 'Community'} · ${timeLabel(post.createdAt)}`));
        header.append(author);
        if (owns(post, user)) {
          const actions = el('div', 'owner-actions');
          const edit = el('button', 'small-action', 'Edit'); edit.type = 'button'; edit.dataset.editPost = post.id;
          const remove = el('button', 'small-action danger', 'Delete'); remove.type = 'button'; remove.dataset.deletePost = post.id;
          actions.append(edit, remove); header.append(actions);
        }
        card.append(header, el('p', 'feed-caption', post.caption || ''));
        const imageURL = safeImage(post.image);
        if (imageURL) {
          const image = el('img', 'feed-image'); image.src = imageURL; image.alt = `Photo shared by ${post.authorName || 'a community member'}`; image.loading = 'lazy';
          image.addEventListener('error', () => image.remove(), { once: true }); card.append(image);
        }
        const actions = el('div', 'feed-actions');
        const like = el('button', `like-button${post.likes.includes(user.id) ? ' liked' : ''}`, `♥ ${post.likes.length} Like`);
        like.type = 'button'; like.dataset.likePost = post.id; like.setAttribute('aria-pressed', String(post.likes.includes(user.id)));
        actions.append(like, el('span', '', `${post.comments.length} comments`)); card.append(actions);
        const reactionBar = el('div', 'community-reactions'); reactionBar.setAttribute('aria-label', 'React to this post');
        EMOJIS.forEach((emoji) => {
          const ids = Array.isArray(post.reactions[emoji]) ? post.reactions[emoji] : [];
          const button = el('button', `reaction-button${ids.includes(user.id) ? ' is-active' : ''}`);
          button.type = 'button'; button.dataset.reactPost = post.id; button.dataset.reaction = emoji;
          button.setAttribute('aria-label', `${emoji} reaction: ${ids.length}`); button.setAttribute('aria-pressed', String(ids.includes(user.id)));
          button.append(document.createTextNode(emoji), el('span', 'reaction-count', String(ids.length))); reactionBar.append(button);
        });
        card.append(reactionBar);
        const comments = el('div', 'comment-list');
        post.comments.forEach((comment) => {
          const row = el('p'); row.append(el('strong', '', `${comment.authorName || 'Neighbor'}: `), document.createTextNode(comment.text || '')); comments.append(row);
        });
        card.append(comments);
        const commentForm = document.createElement('form'); commentForm.className = 'comment-form'; commentForm.dataset.commentPost = post.id;
        const input = document.createElement('input'); input.name = 'comment'; input.required = true; input.maxLength = 400; input.placeholder = 'Write a helpful comment...'; input.setAttribute('aria-label', 'Write a comment');
        const submit = el('button', 'button button-outline', 'Comment'); submit.type = 'submit';
        commentForm.append(input, submit); card.append(commentForm); feed.append(card);
      });
      updateFilter();
    }

    function openPost(post) {
      form.reset(); form.dataset.imageData = '';
      form.elements.namedItem('postId').value = post?.id || '';
      form.elements.namedItem('caption').value = post?.caption || '';
      form.elements.namedItem('tag').value = post?.tag || 'Community update';
      form.elements.namedItem('imageUrl').value = post?.image?.startsWith('data:') ? '' : post?.image || '';
      dialog.querySelector('[data-post-modal-title]').textContent = post ? 'Edit your post' : 'Create a community post';
      dialog.showModal();
    }

    document.querySelector('[data-open-post]')?.addEventListener('click', () => openPost());
    dialog.querySelectorAll('[data-close-post]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    form.addEventListener('change', (event) => {
      if (event.target.name !== 'imageFile' || !event.target.files?.[0]) return;
      const file = event.target.files[0];
      if (!file.type.startsWith('image/') || file.size > 900000) { event.target.value = ''; form.querySelector('[data-form-error]').textContent = 'Choose an image under 900 KB.'; return; }
      const reader = new FileReader(); reader.onload = () => { form.dataset.imageData = reader.result; }; reader.readAsDataURL(file);
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form); const id = String(data.get('postId') || '');
      const caption = String(data.get('caption') || '').trim(); const error = form.querySelector('[data-form-error]'); error.textContent = '';
      if (!caption) { error.textContent = 'Add a caption before publishing.'; return; }
      const posts = seedPosts(); const previous = posts.find((post) => post.id === id);
      if (previous && !owns(previous, user)) { error.textContent = 'You can only edit your own posts.'; return; }
      const image = safeImage(String(data.get('imageUrl') || '')) || form.dataset.imageData || previous?.image || '';
      const post = { id: previous?.id || `post-${Date.now()}`, authorId: previous?.authorId || user.id, authorName: previous?.authorName || user.name || user.email || 'PawLink member', tag: String(data.get('tag')), caption, image, likes: previous?.likes || [], comments: previous?.comments || [], reactions: previous?.reactions || {}, createdAt: previous?.createdAt || Date.now() };
      const next = previous ? posts.map((item) => item.id === id ? post : item) : [post, ...posts];
      if (write(next)) { dialog.close(); render(); notify(previous ? 'Your post was updated.' : 'Your update was shared with the community.'); }
    });

    feed.addEventListener('click', (event) => {
      const like = event.target.closest('[data-like-post]');
      const react = event.target.closest('[data-react-post]');
      const edit = event.target.closest('[data-edit-post]');
      const remove = event.target.closest('[data-delete-post]');
      const posts = seedPosts();
      if (like || react) {
        const post = posts.find((item) => item.id === (like || react).dataset[like ? 'likePost' : 'reactPost']);
        if (!post) return;
        if (like) post.likes = post.likes.includes(user.id) ? post.likes.filter((id) => id !== user.id) : [...post.likes, user.id];
        else { post.reactions[react.dataset.reaction] ||= []; const ids = post.reactions[react.dataset.reaction]; post.reactions[react.dataset.reaction] = ids.includes(user.id) ? ids.filter((id) => id !== user.id) : [...ids, user.id]; }
        if (write(posts)) render();
      } else if (edit) {
        const post = posts.find((item) => item.id === edit.dataset.editPost); if (post && owns(post, user)) openPost(post);
      } else if (remove) {
        const post = posts.find((item) => item.id === remove.dataset.deletePost);
        if (!owns(post, user)) return;
        if (confirm('Delete your community post?')) { write(posts.filter((item) => item.id !== post.id)); render(); }
      }
    });
    feed.addEventListener('submit', (event) => {
      const commentForm = event.target.closest('[data-comment-post]'); if (!commentForm) return;
      event.preventDefault(); const text = String(new FormData(commentForm).get('comment') || '').trim(); if (!text) return;
      const posts = seedPosts(); const post = posts.find((item) => item.id === commentForm.dataset.commentPost); if (!post) return;
      post.comments.push({ id: `comment-${Date.now()}`, authorId: user.id, authorName: user.name || user.email || 'Neighbor', text, createdAt: Date.now() });
      if (write(posts)) render();
    });
    toolbar.addEventListener('input', updateFilter);
    toolbar.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]'); if (!button) return;
      category = button.dataset.filter;
      toolbar.querySelectorAll('[data-filter]').forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
      updateFilter();
    });
    window.addEventListener('storage', (event) => { if (event.key === KEY) render(); });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
