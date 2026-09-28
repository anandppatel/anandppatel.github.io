/* The reference itself is static HTML. JavaScript only helps navigation. */
(() => {
  'use strict';
  const index = document.querySelector('.tool-nav details');
  if (matchMedia('(max-width: 850px)').matches && index) index.open = false;
  const status = document.getElementById('copy-status');
  if (!navigator.clipboard?.writeText) return;
  for (const button of document.querySelectorAll('.copy-link')) {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.hash = button.dataset.tool;
      url.search = '';
      try {
        await navigator.clipboard.writeText(url.href);
        status.textContent = `Link to ${button.dataset.tool.toUpperCase()} copied.`;
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = 'Copy link'; }, 1800);
      } catch {
        location.hash = button.dataset.tool;
        status.textContent = 'The tool link is now in the address bar; copy it from there.';
      }
    });
  }
})();
