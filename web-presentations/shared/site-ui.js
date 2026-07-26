(() => {
  'use strict';

  const root = document.documentElement;
  const storageKey = 'k189-theme';
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(storageKey); } catch {}
  root.dataset.theme = savedTheme === 'night' ? 'night' : 'day';

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.className = 'theme-toggle';

  const syncThemeButton = () => {
    const isNight = root.dataset.theme === 'night';
    themeButton.innerHTML = isNight
      ? '<span aria-hidden="true">☀</span><b>DAY</b>'
      : '<span aria-hidden="true">☾</span><b>NIGHT</b>';
    themeButton.setAttribute('aria-label', isNight ? 'Включить дневной режим' : 'Включить ночной режим');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isNight ? '#050e13' : '#081720');
  };

  const themeHost = document.querySelector('.site-header .header-cta, .deck-nav .counter');
  if (themeHost) {
    themeHost.insertAdjacentElement('beforebegin', themeButton);
    syncThemeButton();
    themeButton.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'night' ? 'day' : 'night';
      try { localStorage.setItem(storageKey, root.dataset.theme); } catch {}
      syncThemeButton();
    });
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="image-lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Увеличенное изображение">
      <button class="image-lightbox__close" type="button" aria-label="Закрыть изображение">×</button>
      <figure>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="">
        <figcaption></figcaption>
      </figure>
    </div>
  `);

  const lightbox = document.querySelector('.image-lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('figcaption');
  const closeButton = lightbox.querySelector('.image-lightbox__close');
  let previousFocus = null;

  const imageName = image => {
    const container = image.closest('.gallery__image, figure, .slide');
    return container?.querySelector(':scope > span, :scope > figcaption')?.textContent.trim()
      || image.alt.trim()
      || image.closest('.slide')?.dataset.title
      || 'K189';
  };

  const openLightbox = image => {
    previousFocus = document.activeElement;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || imageName(image);
    lightboxCaption.textContent = imageName(image);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    previousFocus?.focus?.();
  };

  document.addEventListener('click', event => {
    const image = event.target.closest('img:not(.image-lightbox img)');
    if (image && !image.closest('.location-map')) {
      event.preventDefault();
      event.stopPropagation();
      openLightbox(image);
      return;
    }

    const photoSlide = event.target.closest('.layout-photo');
    if (photoSlide && !event.target.closest('.slide__inner')) {
      const backgroundImage = photoSlide.querySelector('.slide__bg');
      if (backgroundImage) openLightbox(backgroundImage);
    }
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeLightbox();
    }
  }, true);
})();
