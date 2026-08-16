(() => {
  'use strict';
  const data = window.DECK_DATA;
  if (!data || !Array.isArray(data.slides)) throw new Error('Deck data is missing');
  const cinematicLayouts = new Set(['cover','photo','chapter','statement','contact']);

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const img = (src, alt = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="eager" decoding="async" fetchpriority="${data.slides[0]?.image === src ? 'high' : 'auto'}">`;
  const reveal = (html, cls = '') => `<div class="reveal ${cls}">${html}</div>`;
  const heading = s => `${s.eyebrow ? reveal(esc(s.eyebrow),'eyebrow') : ''}${s.title ? reveal(`<h2 class="title">${esc(s.title)}</h2>`) : ''}${s.body ? reveal(`<p class="body">${esc(s.body)}</p>`) : ''}${s.callout ? reveal(`<div class="callout">${esc(s.callout)}</div>`) : ''}`;
  const metrics = values => values?.length ? `<div class="metrics" style="--metric-count:${values.length}">${values.map(m => `<div class="metric reveal"><div class="metric__value">${esc(m.value)}</div><div class="metric__label">${esc(m.label)}</div></div>`).join('')}</div>` : '';
  const items = values => values?.length ? `<div class="items" style="--columns:${values.length > 4 ? 2 : 1}">${values.map(it => {
    const value = Array.isArray(it) ? {title:it[0],desc:it[1]} : (typeof it === 'string' ? {title:it} : it);
    return `<div class="item reveal"><div class="item__title">${esc(value.title)}</div>${value.desc ? `<div class="item__desc">${esc(value.desc)}</div>` : ''}</div>`;
  }).join('')}</div>` : '';
  const chrome = (s, i) => `${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}<div class="page-no">${String(i+1).padStart(2,'0')}</div>`;
  const galleryItems = Array.isArray(data.gallery) ? data.gallery : [];
  const galleryMarkup = galleryItems.map(photo => `<button class="photo-gallery__item" type="button"><figure><img src="${esc(photo.src)}" alt="${esc(photo.label)}" loading="lazy" decoding="async"><figcaption>${esc(photo.label)}</figcaption></figure></button>`).join('');

  function renderSlide(s, i) {
    const darkSurface = s.theme === 'dark' && cinematicLayouts.has(s.layout);
    const classes = ['slide',`layout-${s.layout || 'split'}`,darkSurface ? 'theme-dark' : '',s.reverse ? 'reverse':'',s.align === 'right' ? 'align-right':'',s.compactMedia ? 'media-compact':'',s.spaciousItems ? 'spacious-items':'',s.map ? 'has-map':''].filter(Boolean).join(' ');
    const bg = s.image && ['photo','chapter','contact'].includes(s.layout) ? `<img class="slide__bg" src="${esc(s.image)}" alt="${esc(s.alt || s.title || '')}" decoding="async"><div class="slide__veil"></div>` : '';
    let content = '';
    let overlay = '';
    if (s.layout === 'cover') {
      const coverTitle = esc(s.title).replace(' &amp; ', ' &amp;<br>');
      content = `<div class="cover-copy"><div class="cover-tag">${esc(s.tag || data.label)}</div>${reveal(`<div class="brand">K189</div>`)}${reveal(`<h1 class="cover-title">${coverTitle}</h1>`)}${s.body ? reveal(`<p class="cover-subtitle">${esc(s.body)}</p>`) : ''}</div><figure class="cover-media reveal">${img(s.image,s.alt || 'Фасад комплекса K189')}${s.location ? `<figcaption>${esc(s.location)}</figcaption>`:''}</figure>${metrics(s.metrics)}`;
    } else if (s.layout === 'split') {
      content = `<div class="slide__copy">${heading(s)}${items(s.items)}${metrics(s.metrics)}</div><div class="media-frame reveal">${img(s.image,s.alt || s.title)}</div>`;
    } else if (s.layout === 'photo' || s.layout === 'chapter') {
      content = heading(s);
    } else if (s.layout === 'statement') {
      content = `${s.eyebrow ? reveal(esc(s.eyebrow),'eyebrow'):''}${reveal(`<h2 class="title">${esc(s.title)}</h2>`)}<div class="statement-line reveal"></div>${s.body ? reveal(`<p class="body">${esc(s.body)}</p>`):''}`;
    } else if (s.layout === 'metrics') {
      content = `${heading(s)}${metrics(s.metrics)}`;
    } else if (s.layout === 'gallery') {
      content = `${heading(s)}<div class="gallery" data-count="${s.images.length}">${s.images.map((im,idx)=>`<div class="gallery__image reveal">${img(im.src,im.alt || s.title)}${im.label ? `<span>${esc(im.label)}</span>`:''}</div>`).join('')}</div>`;
    } else if (s.layout === 'stack') {
      content = `${heading(s)}<div class="role-stack">${s.items.map((it,idx)=>`<div class="role reveal"><div class="role__num">${it.num || String(idx+1).padStart(2,'0')}</div><div><div class="role__title">${esc(it.title)}</div><div class="role__desc">${esc(it.desc)}</div></div></div>`).join('')}</div>`;
    } else if (s.layout === 'document') {
      content = `${heading(s)}<div class="doc-columns">${s.groups.map(g=>`<div><div class="doc-heading">${esc(g.title)}</div>${items(g.items)}</div>`).join('')}</div>${s.bottom ? `<div class="bottom-line reveal">${esc(s.bottom)}</div>`:''}`;
    } else if (s.layout === 'contact') {
      overlay = s.map ? `<div class="contact-map reveal"><iframe class="contact-map__frame" title="Карта расположения K189 на Кабардинской, 189" src="https://www.openstreetmap.org/export/embed.html?bbox=43.631925%2C43.498757%2C43.638325%2C43.503357&amp;layer=mapnik&amp;marker=43.501057%2C43.635125" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a href="https://www.openstreetmap.org/?mlat=43.501057&amp;mlon=43.635125#map=17/43.501057/43.635125" target="_blank" rel="noopener">Кабардинская, 189 · открыть карту ↗</a></div>` : '';
      content = `${reveal(`<div class="brand">K189</div>`)}${heading(s)}<div class="contact-links reveal"><a href="tel:+79640330186">+7 964 033-01-86</a><a href="mailto:tomabloom@mail.ru">tomabloom@mail.ru</a></div><div class="contact-meta reveal">WhatsApp &nbsp;•&nbsp; Telegram &nbsp;•&nbsp; Email</div><div class="terms">Коммерческие условия — по запросу</div>`;
    } else {
      content = `${heading(s)}${items(s.items)}${s.bottom ? `<div class="bottom-line reveal">${esc(s.bottom)}</div>`:''}`;
    }
    return `<section class="${classes}" id="slide-${i+1}" data-title="${esc(s.title || 'K189')}">${bg}<div class="slide__inner">${content}</div>${overlay}${chrome(s,i)}</section>`;
  }

  document.body.classList.add(data.slug === 'short' ? 'deck-short' : 'deck-long');
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="progress"><span></span></div>
    <nav class="deck-nav" aria-label="Навигация по презентации">
      <a class="nav-brand" href="../#slide-1" aria-label="К началу презентации">K189</a>
      <span class="nav-label">${esc(data.label)}</span>
      <div class="nav-actions"><button class="nav-text-btn photo-gallery-open" type="button" aria-label="Открыть галерею фотографий">Галерея</button><span class="counter">01 / ${String(data.slides.length).padStart(2,'0')}</span><button class="icon-btn overview-open" aria-label="Открыть обзор">☷</button><button class="icon-btn fullscreen" aria-label="Полный экран">⛶</button></div>
    </nav>
    <main class="deck-shell">${data.slides.map(renderSlide).join('')}</main>
    <div class="deck-arrows"><button class="icon-btn prev" aria-label="Предыдущая страница">↑</button><button class="icon-btn next" aria-label="Следующая страница">↓</button></div>
    <aside class="overview" aria-hidden="true"><div class="overview__head"><h2>Все страницы</h2><button class="icon-btn overview-close" aria-label="Закрыть обзор">×</button></div><div class="overview__grid">${data.slides.map((s,i)=>`<button class="overview-card" data-go="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(s.title || 'K189')}</strong></button>`).join('')}</div></aside>
    <aside class="photo-gallery" aria-hidden="true"><div class="photo-gallery__head"><div><span>Фотографии объекта</span><h2>Галерея</h2></div><button class="icon-btn photo-gallery-close" type="button" aria-label="Закрыть галерею">×</button></div><div class="photo-gallery__grid">${galleryMarkup}</div></aside>
  `);

  const slides = [...document.querySelectorAll('.slide')];
  const progress = document.querySelector('.progress span');
  const counter = document.querySelector('.counter');
  const overview = document.querySelector('.overview');
  const photoGallery = document.querySelector('.photo-gallery');
  const nav = document.querySelector('.deck-nav');
  const motion = window.Motion;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMotion = !reducedMotion && motion && ['animate','inView','scroll'].every(name => typeof motion[name] === 'function');
  let active = -1;
  let slideTops = [];

  const setActive = index => {
    const next = Math.max(0,Math.min(slides.length-1,index));
    if (next === active) return;
    active = next;
    slides.forEach((el,i)=>el.classList.toggle('is-active',i===active));
    counter.textContent = `${String(active+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    document.title = `${data.slides[active].title || 'K189'} — K189`;
  };

  const measureSlides = () => {
    slideTops = slides.map(slide => slide.getBoundingClientRect().top + window.scrollY);
  };

  const activeIndexAtScroll = scrollY => {
    const navHeight = nav?.offsetHeight || 0;
    const anchor = scrollY + navHeight + Math.max(0,window.innerHeight-navHeight) * .36;
    let low = 0;
    let high = slideTops.length-1;
    let result = 0;
    while (low <= high) {
      const middle = (low+high) >> 1;
      if (slideTops[middle] <= anchor) {
        result = middle;
        low = middle+1;
      } else {
        high = middle-1;
      }
    }
    return result;
  };

  const syncScrollState = (ratio,scrollY = window.scrollY) => {
    progress.style.transform = `scaleX(${ratio})`;
    setActive(activeIndexAtScroll(scrollY));
  };

  const syncCurrentScroll = () => {
    const maxScroll = Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    syncScrollState(Math.max(0,Math.min(1,window.scrollY/maxScroll)));
  };

  const revealElements = [...document.querySelectorAll('.reveal')];
  const revealSlide = slide => {
    if (slide.dataset.revealed === 'true') return;
    slide.dataset.revealed = 'true';
    const elements = [...slide.querySelectorAll('.reveal')];
    elements.forEach(element => element.classList.add('is-revealed'));
    if (!hasMotion) return;
    elements.forEach((element,index) => {
      motion.animate(element,
        {opacity:[0,1],y:[18,0]},
        {duration:.5,delay:Math.min(index,4)*.055,ease:[.22,.78,.24,1]}
      );
    });
  };

  if (!hasMotion) {
    document.documentElement.dataset.motion = 'fallback';
    revealElements.forEach(element => element.classList.add('is-revealed'));
  } else {
    document.documentElement.dataset.motion = 'motion';
    document.body.classList.add('motion-powered');
    const navHeight = nav?.offsetHeight || 0;
    slides.forEach(slide => {
      const rect = slide.getBoundingClientRect();
      if (rect.top < window.innerHeight*.94 && rect.bottom > navHeight) revealSlide(slide);
    });
    const unrevealedSlides = slides.filter(slide => slide.dataset.revealed !== 'true');
    if (unrevealedSlides.length) motion.inView(unrevealedSlides,revealSlide,{amount:.04,margin:'0px'});
  }

  const go = index => slides[Math.max(0,Math.min(slides.length-1,index))].scrollIntoView({behavior:'smooth'});
  measureSlides();
  if (hasMotion) {
    motion.scroll((ratio,info) => syncScrollState(ratio,info.y.current),{trackContentSize:true});
  } else {
    let fallbackFrame = 0;
    window.addEventListener('scroll',() => {
      if (fallbackFrame) return;
      fallbackFrame = requestAnimationFrame(() => {
        fallbackFrame = 0;
        syncCurrentScroll();
      });
    },{passive:true});
  }
  const refreshLayout = () => {
    measureSlides();
    syncCurrentScroll();
  };
  window.addEventListener('resize',refreshLayout,{passive:true});
  window.addEventListener('load',refreshLayout,{once:true});
  syncCurrentScroll();

  document.querySelector('.prev').addEventListener('click',()=>go(active-1));
  document.querySelector('.next').addEventListener('click',()=>go(active+1));
  const closePhotoGallery = () => {
    photoGallery.classList.remove('is-open');
    photoGallery.setAttribute('aria-hidden','true');
    document.body.classList.remove('photo-gallery-open');
  };
  document.querySelector('.photo-gallery-open').addEventListener('click',()=>{
    overview.classList.remove('is-open');
    overview.setAttribute('aria-hidden','true');
    photoGallery.classList.add('is-open');
    photoGallery.setAttribute('aria-hidden','false');
    document.body.classList.add('photo-gallery-open');
    photoGallery.scrollTop = 0;
  });
  document.querySelector('.photo-gallery-close').addEventListener('click',closePhotoGallery);
  document.querySelectorAll('.photo-gallery__item').forEach(button => button.addEventListener('click', event => {
    if (event.target.tagName !== 'IMG') button.querySelector('img').click();
  }));
  document.querySelector('.overview-open').addEventListener('click',()=>{closePhotoGallery();overview.classList.add('is-open');overview.setAttribute('aria-hidden','false');});
  document.querySelector('.overview-close').addEventListener('click',()=>{overview.classList.remove('is-open');overview.setAttribute('aria-hidden','true');});
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>{overview.classList.remove('is-open');go(Number(btn.dataset.go));}));
  document.querySelector('.fullscreen').addEventListener('click',()=>document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  document.addEventListener('keydown',e=>{
    if (photoGallery.classList.contains('is-open')) {
      if (e.key === 'Escape') closePhotoGallery();
      return;
    }
    if (overview.classList.contains('is-open') && e.key === 'Escape') { overview.classList.remove('is-open'); return; }
    if (['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)) { e.preventDefault(); go(active+1); }
    if (['ArrowUp','ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); go(active-1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(slides.length-1); }
    if (e.key.toLowerCase() === 'o') document.querySelector('.overview-open').click();
  });
})();
