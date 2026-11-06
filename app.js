(() => {
  'use strict';

  const KEYS = { user: 'currentUser', loggedIn: 'isLoggedIn', theme: 'pawlinkTheme', posts: 'pawlinkPosts', products: 'pawlinkProducts', cart: 'pawlinkCart' };
  const PUBLIC_PAGES = new Set(['', 'index.html', 'login.html', 'signup.html']);
  const seedPets = [
    { id: 'milo', name: 'Milo', species: 'Dog', breed: 'Golden Retriever mix', age: '2 years', location: 'Oakland, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80', description: 'A gentle, sunny-natured companion who loves walks and new friends.' },
    { id: 'luna', name: 'Luna', species: 'Cat', breed: 'Domestic shorthair', age: '1 year', location: 'Berkeley, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80', description: 'Curious, affectionate, and happiest in a cozy sunny window.' },
    { id: 'buddy', name: 'Buddy', species: 'Dog', breed: 'Beagle mix', age: '4 years', location: 'San Francisco, CA', category: 'Adoption', status: 'Foster favorite', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=800&q=80', description: 'A friendly little explorer with a big heart and a great nose.' },
    { id: 'peaches', name: 'Peaches', species: 'Cat', breed: 'Calico', age: '3 years', location: 'Richmond, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', description: 'A mellow, people-loving cat who enjoys company and gentle play.' },
    { id: 'max', name: 'Max', species: 'Dog', breed: 'Terrier mix', age: '8 months', location: 'Alameda, CA', category: 'Adoption', status: 'New arrival', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80', description: 'Playful puppy energy, learning new things every day.' },
    { id: 'coco', name: 'Coco', species: 'Dog', breed: 'Poodle mix', age: '5 years', location: 'Emeryville, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80', description: 'A smart, sweet companion looking for a calm forever home.' }
  ];
  const initialPosts = [
    { id: 'post-welcome', authorId: 'pawlink-community', authorName: 'PawLink Community', tag: 'Community update', caption: 'Welcome to PawLink! Share a helpful sighting, celebrate a reunion, or introduce your furry family. Every little action helps.', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1000&q=80', likes: [], comments: [], createdAt: Date.now() - 86400000 },
    { id: 'post-found', authorId: 'neighbor-01', authorName: 'Jordan Lee', tag: 'Found pet', caption: 'Friendly pup spotted near Lake Merritt this morning. They are safe with a local rescue while we look for their family.', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80', likes: [], comments: [], createdAt: Date.now() - 3600000 }
  ];
  const initialProducts = [
    { id: 'prod-treats', sellerId: 'pawlink-shop', sellerName: 'PawLink Pantry', name: 'Good Dog Training Bites', description: 'Small-batch, all-natural rewards for good pups.', price: 12, category: 'Treats', image: 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?auto=format&fit=crop&w=800&q=80', active: true },
    { id: 'prod-toy', sellerId: 'pawlink-shop', sellerName: 'PawLink Pantry', name: 'Rainbow Rope Toy', description: 'A sturdy, colorful tug toy for playtime.', price: 16, category: 'Toys', image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=800&q=80', active: true },
    { id: 'prod-bed', sellerId: 'pawlink-shop', sellerName: 'PawLink Pantry', name: 'Cozy Cloud Pet Mat', description: 'A soft washable mat for well-earned naps.', price: 35, category: 'Home', image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=800&q=80', active: true },
    { id: 'prod-bowl', sellerId: 'pawlink-shop', sellerName: 'PawLink Pantry', name: 'Everyday Ceramic Bowl', description: 'A simple, sturdy bowl for dinner and water.', price: 22, category: 'Essentials', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ECC119?auto=format&fit=crop&w=800&q=80', active: true }
  ];

  function readJSON(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch (error) { return fallback; }
  }
  const currentUser = () => readJSON(KEYS.user, null);
  function ensureUserId() {
    const user = currentUser();
    if (user && !user.id) saveUser({ ...user, id: `user-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}` });
    return currentUser();
  }
  const state = {
    get currentUser() { return currentUser(); },
    get isLoggedIn() { try { return localStorage.getItem(KEYS.loggedIn) === 'true' && Boolean(currentUser()); } catch (error) { return false; } },
    saveUser(user) {
      if (!user || !user.email) throw new TypeError('An email address is required.');
      const saved = { ...(currentUser() || {}), ...user, id: user.id || currentUser()?.id || `user-${Date.now()}-${Math.random().toString(36).slice(2)}` };
      localStorage.setItem(KEYS.user, JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('pawlink:userchange', { detail: saved }));
      return saved;
    },
    signOut() { localStorage.removeItem(KEYS.user); localStorage.removeItem(KEYS.loggedIn); location.assign('index.html'); }
  };
  function saveUser(user) { return state.saveUser(user); }
  function safeText(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function safeImage(value) {
    const url = String(value || '').trim();
    return /^(https:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(url) ? url : '';
  }
  function getRecords(key, initial) {
    let rows = readJSON(key, null);
    if (!Array.isArray(rows)) { rows = initial.map((record) => ({ ...record })); try { localStorage.setItem(key, JSON.stringify(rows)); } catch (error) { /* Demo content remains in memory. */ } }
    return rows;
  }
  function storeRecords(key, records) { localStorage.setItem(key, JSON.stringify(records)); }

  function applyTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    document.querySelectorAll('.theme-toggle [data-theme-icon]').forEach((icon) => { icon.textContent = value === 'dark' ? '☀' : '☾'; });
    document.querySelectorAll('.theme-toggle').forEach((button) => button.setAttribute('aria-label', value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'));
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = value === 'dark' ? '#0f172a' : '#f8fafc';
  }
  function initTheme() {
    applyTheme(readJSON(KEYS.theme, 'light'));
    document.querySelectorAll('.theme-toggle').forEach((button) => button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next);
      try { localStorage.setItem(KEYS.theme, JSON.stringify(next)); } catch (error) { /* Theme remains applied this session. */ }
    }));
  }
  function guardRoute() {
    const page = location.pathname.split('/').pop() || '';
    if (!PUBLIC_PAGES.has(page) && !state.isLoggedIn) { location.replace('index.html'); return false; }
    return true;
  }
  function toast(message) {
    let node = document.querySelector('[data-toast]');
    if (!node) { node = document.createElement('div'); node.className = 'paw-toast'; node.dataset.toast = ''; node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); document.body.append(node); }
    node.textContent = message; node.classList.add('is-visible'); window.setTimeout(() => node.classList.remove('is-visible'), 3500);
  }
  function syncUser(user = currentUser()) {
    if (!user) return;
    document.querySelectorAll('[data-user-name]').forEach((node) => { node.textContent = user.name || user.email || 'Pet lover'; });
    document.querySelectorAll('[data-user-email]').forEach((node) => { node.textContent = user.email || ''; });
    document.querySelectorAll('[data-user-initial]').forEach((node) => { node.textContent = (user.name || user.email || 'P').trim().charAt(0).toUpperCase(); });
  }
  function initAuth() {
    document.querySelectorAll('[data-auth-form]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault(); const data = new FormData(form); const error = form.querySelector('[data-form-error]');
      const email = String(data.get('email') || '').trim(); const password = String(data.get('password') || '');
      if (error) error.textContent = '';
      if (!email || password.length < 8) { if (error) error.textContent = 'Enter a valid email and a password of at least 8 characters.'; return; }
      if (form.dataset.authForm === 'signup') {
        const user = {}; for (const [key, value] of data.entries()) if (key !== 'password') user[key] = String(value).trim();
        user.name = user.name || email.split('@')[0];
        try { state.saveUser(user); localStorage.setItem(KEYS.loggedIn, 'true'); toast('Welcome to PawLink! Every little action helps a pet find their way home.'); setTimeout(() => location.assign('dashboard.html'), 700); }
        catch (storageError) { if (error) error.textContent = 'Unable to save your account in this browser.'; }
      } else {
        state.saveUser({ name: String(data.get('name') || email.split('@')[0]), email }); localStorage.setItem(KEYS.loggedIn, 'true'); location.assign('dashboard.html');
      }
    }));
  }
  function petCard(pet, featured = false) {
    return `<article class="pet-card${featured ? ' featured-pet-card' : ''}" data-pet-card data-species="${pet.species.toLowerCase()}" data-category="${pet.category.toLowerCase()}" data-location="${pet.location.toLowerCase()}"><a class="pet-photo" href="adopt.html" aria-label="Learn about ${safeText(pet.name)}"><img src="${safeText(pet.image)}" alt="${safeText(pet.name)}, a ${safeText(pet.breed)}" loading="lazy"><span class="pet-status">${safeText(pet.status)}</span></a><div class="pet-card-body"><div class="pet-title-row"><div><h3>${safeText(pet.name)}</h3><p>${safeText(pet.breed)}</p></div><span class="pet-heart" aria-hidden="true">♡</span></div><div class="pet-meta"><span>${safeText(pet.age)}</span><span>${safeText(pet.location)}</span></div>${featured ? `<a class="pet-link" href="adopt.html">Meet ${safeText(pet.name)} →</a>` : `<button class="button button-primary pet-inquire" type="button" data-inquire="${safeText(pet.id)}">Ask about ${safeText(pet.name)}</button>`}</div></article>`;
  }
  function initPetCards() {
    document.querySelectorAll('[data-featured-pets]').forEach((container) => { container.innerHTML = seedPets.slice(0, 4).map((pet) => petCard(pet, true)).join(''); });
    const grid = document.querySelector('[data-pet-grid]'); if (!grid) return;
    grid.innerHTML = seedPets.map((pet) => petCard(pet)).join('');
    const search = document.querySelector('[data-search-input]'), category = document.querySelector('[data-filter-category]'), locationFilter = document.querySelector('[data-filter-location]'), species = document.querySelector('[data-filter-species]');
    const chips = [...document.querySelectorAll('[data-category-chip]')];
    const filter = () => {
      const term = (search?.value || '').trim().toLowerCase(); let count = 0;
      grid.querySelectorAll('[data-pet-card]').forEach((card, index) => {
        const pet = seedPets[index]; const categoryValue = category?.value || 'all';
        const match = (!term || `${pet.name} ${pet.breed} ${pet.species} ${pet.location} ${pet.description}`.toLowerCase().includes(term)) && (categoryValue === 'all' || pet.category.toLowerCase() === categoryValue) && (!locationFilter?.value || pet.location.toLowerCase().includes(locationFilter.value.toLowerCase())) && (!species?.value || pet.species.toLowerCase() === species.value);
        card.hidden = !match; if (match) count++;
      });
      const result = document.querySelector('[data-search-count]'); if (result) result.textContent = `${count} ${count === 1 ? 'pet' : 'pets'} found`;
      const empty = document.querySelector('[data-no-results]'); if (empty) empty.hidden = count > 0;
    };
    [search, category, locationFilter, species].filter(Boolean).forEach((control) => control.addEventListener('input', filter));
    chips.forEach((chip) => chip.addEventListener('click', () => { if (category) category.value = chip.dataset.categoryChip; chips.forEach((item) => item.classList.toggle('is-active', item === chip)); filter(); })); filter();
  }
  function initInquiryModal() {
    const dialog = document.querySelector('[data-inquiry-dialog]'); if (!dialog) return;
    const form = dialog.querySelector('.inquiry-form');
    const fill = () => { const user = currentUser() || {}; form.elements.namedItem('applicantName').value = user.name || ''; form.elements.namedItem('applicantEmail').value = user.email || ''; form.elements.namedItem('applicantPhone').value = user.phone || ''; };
    fill();
    document.addEventListener('click', (event) => { const trigger = event.target.closest('[data-inquire]'); if (!trigger) return; const pet = seedPets.find((item) => item.id === trigger.dataset.inquire); if (pet) { dialog.querySelector('[data-modal-pet]').textContent = pet.name; form.elements.namedItem('petName').value = pet.name; dialog.showModal(); } });
    dialog.querySelectorAll('[data-modal-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    form.addEventListener('submit', (event) => { event.preventDefault(); const name = form.elements.namedItem('petName').value; dialog.close(); toast(`Thanks! Your inquiry for ${name} is ready for the PawLink team.`); form.reset(); fill(); });
  }

  // Community posts: ownership is checked at render time and again for every mutation.
  function canManage(record) { return Boolean(record && currentUser()?.id && record.authorId === currentUser().id); }
  function initReports() {
    const feed = document.querySelector('[data-post-feed]'); if (!feed) return;
    const dialog = document.querySelector('[data-post-dialog]'); const form = dialog.querySelector('[data-post-form]');
    let posts = getRecords(KEYS.posts, initialPosts);
    const render = () => {
      posts = getRecords(KEYS.posts, initialPosts);
      feed.innerHTML = posts.slice().sort((a, b) => b.createdAt - a.createdAt).map((post) => {
        const own = canManage(post); const image = safeImage(post.image);
        return `<article class="feed-card" data-post-id="${safeText(post.id)}"><header class="feed-post-head"><span class="feed-avatar">${safeText((post.authorName || 'P').charAt(0).toUpperCase())}</span><div class="feed-author"><strong>${safeText(post.authorName)}</strong><small>${safeText(post.tag || 'Community')} · ${new Date(post.createdAt).toLocaleDateString()}</small></div>${own ? `<div class="owner-actions"><button type="button" data-edit-post="${safeText(post.id)}" class="small-action">Edit</button><button type="button" data-delete-post="${safeText(post.id)}" class="small-action danger">Delete</button></div>` : ''}</header><p class="feed-caption">${safeText(post.caption)}</p>${image ? `<img class="feed-image" src="${safeText(image)}" alt="Community post image" loading="lazy">` : ''}<div class="feed-actions"><button type="button" class="like-button${post.likes.includes(currentUser()?.id) ? ' liked' : ''}" data-like-post="${safeText(post.id)}">♥ <span>${post.likes.length}</span> Like</button><span>${post.comments.length} comments</span></div><div class="comment-list">${post.comments.map((comment) => `<p><strong>${safeText(comment.authorName)}:</strong> ${safeText(comment.text)}</p>`).join('')}</div><form class="comment-form" data-comment-form="${safeText(post.id)}"><input name="comment" required maxlength="400" placeholder="Write a comment..." aria-label="Write a comment"><button type="submit" class="button button-outline">Comment</button></form></article>`;
      }).join('') || '<p class="empty-state">No community posts yet. Start the conversation.</p>';
    };
    document.querySelector('[data-open-post]')?.addEventListener('click', () => { form.reset(); form.elements.namedItem('postId').value = ''; dialog.querySelector('[data-post-modal-title]').textContent = 'Create a community post'; dialog.showModal(); });
    document.querySelectorAll('[data-close-post]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    feed.addEventListener('click', (event) => {
      const like = event.target.closest('[data-like-post]');
      if (like) { const user = currentUser(); if (!user?.id) return; posts = getRecords(KEYS.posts, initialPosts); const post = posts.find((item) => item.id === like.dataset.likePost); if (!post) return; post.likes = Array.isArray(post.likes) ? post.likes : []; post.likes = post.likes.includes(user.id) ? post.likes.filter((id) => id !== user.id) : [...post.likes, user.id]; storeRecords(KEYS.posts, posts); render(); return; }
      const edit = event.target.closest('[data-edit-post]');
      if (edit) { posts = getRecords(KEYS.posts, initialPosts); const post = posts.find((item) => item.id === edit.dataset.editPost); if (!canManage(post)) return; form.elements.namedItem('postId').value = post.id; form.elements.namedItem('caption').value = post.caption; form.elements.namedItem('tag').value = post.tag; form.elements.namedItem('imageUrl').value = post.image?.startsWith('data:') ? '' : post.image || ''; dialog.querySelector('[data-post-modal-title]').textContent = 'Edit your post'; dialog.showModal(); return; }
      const remove = event.target.closest('[data-delete-post]');
      if (remove) { posts = getRecords(KEYS.posts, initialPosts); const post = posts.find((item) => item.id === remove.dataset.deletePost); if (!canManage(post)) { toast('You can only remove your own posts.'); return; } storeRecords(KEYS.posts, posts.filter((item) => item.id !== post.id)); render(); }
    });
    feed.addEventListener('submit', (event) => {
      const commentForm = event.target.closest('[data-comment-form]'); if (!commentForm) return; event.preventDefault();
      const user = currentUser() || {}; const text = String(new FormData(commentForm).get('comment') || '').trim(); if (!text) return;
      posts = getRecords(KEYS.posts, initialPosts); const post = posts.find((item) => item.id === commentForm.dataset.commentForm); if (!post) return;
      post.comments = [...(post.comments || []), { authorId: user.id, authorName: user.name || user.email, text, createdAt: Date.now() }]; storeRecords(KEYS.posts, posts); render();
    });
    form.addEventListener('change', (event) => {
      if (event.target.name !== 'imageFile' || !event.target.files?.[0]) return;
      const file = event.target.files[0]; const error = form.querySelector('[data-form-error]');
      if (!file.type.startsWith('image/') || file.size > 900000) { event.target.value = ''; if (error) error.textContent = 'Choose an image under 900 KB.'; return; }
      const reader = new FileReader(); reader.onload = () => { form.dataset.imageData = reader.result; }; reader.readAsDataURL(file);
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault(); const user = currentUser(); const data = new FormData(form); const id = String(data.get('postId') || '');
      const caption = String(data.get('caption') || '').trim(); const error = form.querySelector('[data-form-error]'); if (error) error.textContent = '';
      if (!caption) { if (error) error.textContent = 'Add a caption before publishing.'; return; }
      posts = getRecords(KEYS.posts, initialPosts); const existing = id ? posts.find((item) => item.id === id) : null;
      if (existing && !canManage(existing)) { toast('You can only edit your own posts.'); return; }
      let image = safeImage(data.get('imageUrl')) || form.dataset.imageData || existing?.image || '';
      const record = { id: existing?.id || `post-${Date.now()}-${Math.random().toString(36).slice(2)}`, authorId: existing?.authorId || user.id, authorName: existing?.authorName || user.name || user.email, tag: String(data.get('tag')), caption, image, likes: existing?.likes || [], comments: existing?.comments || [], createdAt: existing?.createdAt || Date.now() };
      posts = existing ? posts.map((item) => item.id === existing.id ? record : item) : [record, ...posts];
      try { storeRecords(KEYS.posts, posts); form.dataset.imageData = ''; dialog.close(); render(); }
      catch (storageError) { if (error) error.textContent = 'Could not save this post. Try a smaller image.'; }
    });
    window.addEventListener('storage', (event) => { if (event.key === KEYS.posts) render(); }); render();
  }

  function initShop() {
    const grid = document.querySelector('[data-product-grid]'); if (!grid) return;
    const cartNode = document.querySelector('[data-cart-items]'); const cartTotal = document.querySelector('[data-cart-total]'); const productsEl = document.querySelector('[data-seller-listings]');
    let products = getRecords(KEYS.products, initialProducts); let cart = readJSON(KEYS.cart, {});
    const user = currentUser();
    const persist = () => storeRecords(KEYS.products, products);
    const render = () => {
      products = getRecords(KEYS.products, initialProducts); cart = readJSON(KEYS.cart, {});
      grid.innerHTML = products.filter((p) => p.active !== false).map((p) => `<article class="product-card"><img src="${safeText(safeImage(p.image) || 'https://images.unsplash.com/photo-1589924691995-400dc9ECC119?auto=format&fit=crop&w=800&q=80')}" alt="${safeText(p.name)}" loading="lazy"><div class="product-card-body"><span class="product-category">${safeText(p.category)}</span><h3>${safeText(p.name)}</h3><p>${safeText(p.description)}</p><div class="product-card-bottom"><strong>$${Number(p.price).toFixed(2)}</strong><button class="button button-primary" type="button" data-add-cart="${safeText(p.id)}">Add to cart</button></div><small>Listed by ${safeText(p.sellerName || 'PawLink seller')}</small></div></article>`).join('');
      const own = products.filter((p) => canManage({ authorId: p.sellerId }));
      if (productsEl) productsEl.innerHTML = own.map((p) => `<div class="seller-row"><div><strong>${safeText(p.name)}</strong><small>$${Number(p.price).toFixed(2)} · ${safeText(p.category)}</small></div><div class="owner-actions"><button type="button" class="small-action" data-edit-product="${safeText(p.id)}">Edit</button><button type="button" class="small-action danger" data-delete-product="${safeText(p.id)}">Delist</button></div></div>`).join('') || '<p class="muted-copy">You have not listed any products yet.</p>';
      renderCart();
    };
    const renderCart = () => {
      const entries = Object.entries(cart).filter(([id, quantity]) => quantity > 0 && products.some((p) => p.id === id && p.active !== false));
      if (cartNode) cartNode.innerHTML = entries.map(([id, quantity]) => { const p = products.find((item) => item.id === id); return `<div class="cart-row"><span><strong>${safeText(p.name)}</strong><small>$${Number(p.price).toFixed(2)} each</small></span><div class="qty-control"><button type="button" data-cart-change="${safeText(id)}" data-delta="-1" aria-label="Decrease quantity">−</button><b>${quantity}</b><button type="button" data-cart-change="${safeText(id)}" data-delta="1" aria-label="Increase quantity">+</button></div><strong>$${(p.price * quantity).toFixed(2)}</strong></div>`; }).join('') || '<p class="muted-copy">Your cart is waiting for something lovely.</p>';
      const total = entries.reduce((sum, [id, quantity]) => sum + products.find((p) => p.id === id).price * quantity, 0);
      if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
    };
    grid.addEventListener('click', (event) => { const button = event.target.closest('[data-add-cart]'); if (!button) return; const id = button.dataset.addCart; cart[id] = (cart[id] || 0) + 1; storeRecords(KEYS.cart, cart); renderCart(); toast('Added to your cart.'); });
    cartNode?.addEventListener('click', (event) => { const button = event.target.closest('[data-cart-change]'); if (!button) return; const id = button.dataset.cartChange; cart[id] = Math.max(0, (cart[id] || 0) + Number(button.dataset.delta)); if (!cart[id]) delete cart[id]; storeRecords(KEYS.cart, cart); renderCart(); });
    document.querySelector('[data-checkout]')?.addEventListener('click', () => { if (!Object.values(cart).some((n) => n > 0)) { toast('Your cart is empty. Add an item to continue.'); return; } cart = {}; storeRecords(KEYS.cart, cart); renderCart(); toast('Checkout confirmed! Thanks for supporting the PawLink community.'); });
    const dialog = document.querySelector('[data-product-dialog]'); const form = dialog?.querySelector('form');
    document.querySelector('[data-open-product]')?.addEventListener('click', () => { form.reset(); form.elements.namedItem('productId').value = ''; dialog.showModal(); });
    dialog?.querySelectorAll('[data-close-product]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    productsEl?.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-product]'); const remove = event.target.closest('[data-delete-product]');
      products = getRecords(KEYS.products, initialProducts);
      if (edit) { const p = products.find((item) => item.id === edit.dataset.editProduct); if (!canManage({ authorId: p?.sellerId })) return; form.elements.namedItem('productId').value = p.id; for (const key of ['name', 'description', 'price', 'category', 'image']) form.elements.namedItem(key).value = p[key] ?? ''; dialog.showModal(); }
      if (remove) { const p = products.find((item) => item.id === remove.dataset.deleteProduct); if (!canManage({ authorId: p?.sellerId })) { toast('You can only delist your own items.'); return; } products = products.map((item) => item.id === p.id ? { ...item, active: false } : item); persist(); render(); toast('Your listing has been removed.'); }
    });
    form?.addEventListener('submit', (event) => {
      event.preventDefault(); const data = new FormData(form); const id = String(data.get('productId') || ''); const old = products.find((item) => item.id === id);
      if (old && !canManage({ authorId: old.sellerId })) return;
      const name = String(data.get('name') || '').trim(); const price = Number(data.get('price'));
      if (!name || !Number.isFinite(price) || price <= 0) { form.querySelector('[data-form-error]').textContent = 'Enter a product name and a valid price.'; return; }
      const product = { id: old?.id || `product-${Date.now()}`, sellerId: old?.sellerId || user.id, sellerName: old?.sellerName || user.name || user.email, name, description: String(data.get('description') || '').trim(), price, category: String(data.get('category') || 'Other'), image: safeImage(data.get('image')) || old?.image || '', active: true };
      products = old ? products.map((item) => item.id === old.id ? product : item) : [product, ...products];
      try { persist(); dialog.close(); render(); toast(old ? 'Your listing has been updated.' : 'Your item is now listed.'); } catch (error) { form.querySelector('[data-form-error]').textContent = 'Could not save your listing.'; }
    });
    window.addEventListener('storage', (event) => { if ([KEYS.products, KEYS.cart].includes(event.key)) render(); }); render();
  }

  function initDonation() {
    const form = document.querySelector('[data-donation-form]'); if (!form) return;
    let chosen = '';
    document.querySelectorAll('[data-donation-amount]').forEach((button) => button.addEventListener('click', () => { chosen = button.dataset.donationAmount; document.querySelectorAll('[data-donation-amount]').forEach((item) => item.classList.toggle('is-selected', item === button)); const custom = form.elements.namedItem('customAmount'); if (custom) custom.value = chosen === 'custom' ? '' : chosen; }));
    form.addEventListener('submit', (event) => { event.preventDefault(); const custom = Number(form.elements.namedItem('customAmount').value); const amount = chosen === 'custom' ? custom : Number(chosen); if (!Number.isFinite(amount) || amount < 1) { toast('Please choose or enter a donation of at least $1.'); return; } toast(`Thank you for your $${amount.toFixed(2)} donation! Your kindness helps pets find their way home.`); form.reset(); chosen = ''; document.querySelectorAll('[data-donation-amount]').forEach((item) => item.classList.remove('is-selected')); });
  }

  function initProfile() {
    const profileForm = document.querySelector('[data-profile-form]');
    if (profileForm) {
      const user = currentUser() || {};
      ['name', 'email', 'phone', 'age', 'city'].forEach((key) => { const input = profileForm.elements.namedItem(key); if (input) input.value = user[key] || ''; });
      profileForm.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(profileForm); try { state.saveUser({ name: String(data.get('name')).trim(), email: String(data.get('email')).trim(), phone: String(data.get('phone') || '').trim(), age: String(data.get('age') || ''), city: String(data.get('city') || '').trim() }); toast('Your profile has been saved.'); } catch (error) { profileForm.querySelector('[data-form-error]').textContent = 'Could not save your profile.'; } });
    }
    const contributions = document.querySelector('[data-contributions]'); if (!contributions) return;
    const tabs = [...document.querySelectorAll('[data-profile-tab]')];
    const render = () => {
      const user = currentUser() || {}; const ownPosts = getRecords(KEYS.posts, initialPosts).filter((post) => canManage(post)); const ownProducts = getRecords(KEYS.products, initialProducts).filter((product) => canManage({ authorId: product.sellerId }));
      contributions.innerHTML = `<section class="contribution-section"><h3>My community posts</h3>${ownPosts.length ? ownPosts.map((post) => `<article class="contribution-row"><div><strong>${safeText(post.tag)} · ${safeText(post.caption.slice(0, 100))}${post.caption.length > 100 ? '…' : ''}</strong><small>${post.likes.length} likes · ${post.comments.length} comments</small></div><div class="owner-actions"><button class="small-action" type="button" data-contribution-edit-post="${safeText(post.id)}">Edit</button><button class="small-action danger" type="button" data-contribution-delete-post="${safeText(post.id)}">Delete</button></div></article>`).join('') : '<p class="muted-copy">Your community posts will show up here.</p>'}</section><section class="contribution-section"><h3>My shop listings</h3>${ownProducts.length ? ownProducts.map((p) => `<article class="contribution-row"><div><strong>${safeText(p.name)}</strong><small>${p.active === false ? 'Delisted' : 'Active'} · $${Number(p.price).toFixed(2)}</small></div><div class="owner-actions"><a class="small-action" href="shop.html">Manage</a><button class="small-action danger" type="button" data-contribution-delete-product="${safeText(p.id)}">Delist</button></div></article>`).join('') : '<p class="muted-copy">Your shop listings will show up here.</p>'}</section>`;
      syncUser(user);
    };
    tabs.forEach((tab) => tab.addEventListener('click', () => { tabs.forEach((item) => item.classList.toggle('is-active', item === tab)); document.querySelectorAll('[data-profile-panel]').forEach((panel) => { panel.hidden = panel.dataset.profilePanel !== tab.dataset.profileTab; }); }));
    contributions.addEventListener('click', (event) => {
      const deletePost = event.target.closest('[data-contribution-delete-post]'); const deleteProduct = event.target.closest('[data-contribution-delete-product]');
      if (deletePost) { const posts = getRecords(KEYS.posts, initialPosts); const record = posts.find((item) => item.id === deletePost.dataset.contributionDeletePost); if (!canManage(record)) return; storeRecords(KEYS.posts, posts.filter((item) => item.id !== record.id)); render(); }
      if (deleteProduct) { const products = getRecords(KEYS.products, initialProducts); const record = products.find((item) => item.id === deleteProduct.dataset.contributionDeleteProduct); if (!canManage({ authorId: record?.sellerId })) return; storeRecords(KEYS.products, products.map((item) => item.id === record.id ? { ...item, active: false } : item)); render(); }
      if (event.target.closest('[data-contribution-edit-post]')) location.assign('reports.html');
    });
    window.addEventListener('storage', (event) => { if ([KEYS.posts, KEYS.products].includes(event.key)) render(); }); render();
  }

  function initShell() {
    syncUser(); document.addEventListener('pawlink:userchange', (event) => syncUser(event.detail)); window.addEventListener('storage', (event) => { if (event.key === KEYS.user) syncUser(); });
    document.querySelectorAll('[data-sign-out]').forEach((button) => button.addEventListener('click', () => state.signOut()));
    const sidebar = document.querySelector('.sidebar'), backdrop = document.querySelector('.drawer-backdrop'), toggle = document.querySelector('.menu-toggle');
    const close = () => { sidebar?.classList.remove('is-open'); backdrop?.classList.remove('is-visible'); toggle?.setAttribute('aria-expanded', 'false'); };
    toggle?.addEventListener('click', () => { const open = !sidebar.classList.contains('is-open'); sidebar.classList.toggle('is-open', open); backdrop?.classList.toggle('is-visible', open); toggle.setAttribute('aria-expanded', String(open)); });
    backdrop?.addEventListener('click', close); sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', close)); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  }
  document.addEventListener('DOMContentLoaded', () => {
    initTheme(); if (!guardRoute()) return; ensureUserId(); initAuth(); initShell(); initPetCards(); initInquiryModal(); initReports(); initShop(); initDonation(); initProfile();
    document.querySelectorAll('[data-current-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
  });
  window.PawLink = Object.freeze({ state, pets: Object.freeze(seedPets) });
})();
