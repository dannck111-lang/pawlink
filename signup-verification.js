(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('[data-auth-form="signup"]');
    const file = form?.elements.namedItem('idVerification');
    const error = form?.querySelector('[data-id-verification-error]');
    if (!form || !file || !error) return;

    file.addEventListener('change', () => {
      error.textContent = '';
      const image = file.files?.[0];
      if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024)) {
        error.textContent = 'Choose a JPG, PNG, or WebP image smaller than 5 MB.';
        file.value = '';
      }
    });

    // Validate before app.js handles signup. Never put the ID image in localStorage.
    document.addEventListener('submit', (event) => {
      if (event.target !== form) return;
      const image = file.files?.[0];
      if (!image) {
        event.preventDefault();
        event.stopImmediatePropagation();
        error.textContent = 'Upload an image of a valid ID to continue.';
        file.focus();
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024) {
        event.preventDefault();
        event.stopImmediatePropagation();
        error.textContent = 'Choose a JPG, PNG, or WebP image smaller than 5 MB.';
        file.value = '';
        file.focus();
        return;
      }
      // app.js saves account fields to localStorage; disable the sensitive file during its FormData read.
      file.disabled = true;
      queueMicrotask(() => { file.disabled = false; });
    }, true);
  });
})();
