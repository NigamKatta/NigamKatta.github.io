(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Theme toggle ----------
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ---------- Hero typewriter ----------
  var typeEl = document.getElementById('typewriter');
  var words = [];
  try { words = JSON.parse(typeEl.getAttribute('data-words')) || []; } catch (e) {}
  if (words.length > 1 && !reduceMotion) {
    var wordIndex = 0;
    var charCount = words[0].length;
    var deleting = true;
    var tick = function () {
      var word = words[wordIndex];
      charCount += deleting ? -1 : 1;
      typeEl.textContent = word.slice(0, charCount);
      var delay = deleting ? 50 : 70;
      if (!deleting && charCount === word.length) {
        deleting = true;
        delay = 1200;
      } else if (deleting && charCount === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 300;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }

  // ---------- Reveal on scroll ----------
  var reveals = document.querySelectorAll('.fade-in-section');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---------- Projects: show featured first ----------
  var extras = document.querySelectorAll('.extra-project');
  var projectsToggle = document.getElementById('projects-toggle');
  var setProjectsExpanded = function (expanded) {
    extras.forEach(function (card) { card.hidden = !expanded; });
    projectsToggle.setAttribute('aria-expanded', String(expanded));
    projectsToggle.textContent = expanded ? 'Show Fewer Projects' : 'View All Projects';
  };
  setProjectsExpanded(false);
  projectsToggle.addEventListener('click', function () {
    var expanded = projectsToggle.getAttribute('aria-expanded') === 'true';
    setProjectsExpanded(!expanded);
    if (expanded) document.getElementById('projects').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  // ---------- Detail modal (Experience / Education cards) ----------
  var modal = document.getElementById('detail-modal');
  var group = [];
  var current = 0;

  var render = function () {
    var data = group[current];
    modal.querySelector('.modal-org').textContent = data.dataset.org || '';
    modal.querySelector('#modal-role').textContent = data.dataset.role || '';
    modal.querySelector('.modal-date').textContent = data.dataset.date || '';

    var summary = data.content.querySelector('p');
    modal.querySelector('.modal-summary').textContent = summary ? summary.textContent : '';

    var list = modal.querySelector('.modal-highlights ol');
    list.innerHTML = '';
    data.content.querySelectorAll('li').forEach(function (source) {
      // One wrapper so mixed text + <b> stays a single grid cell next to the number
      var li = document.createElement('li');
      var text = document.createElement('span');
      text.innerHTML = source.innerHTML;
      li.appendChild(text);
      list.appendChild(li);
    });

    var body = modal.querySelector('.modal-body');
    var img = modal.querySelector('.modal-media img');
    if (data.dataset.media) {
      img.src = data.dataset.media;
      img.alt = data.dataset.role || '';
      body.classList.remove('no-media');
    } else {
      img.removeAttribute('src');
      body.classList.add('no-media');
    }

    modal.querySelector('.modal-counter').textContent = group.length > 1 ? (current + 1) + ' / ' + group.length : '';
    modal.querySelector('[data-step="-1"]').disabled = current === 0;
    modal.querySelector('[data-step="1"]').disabled = current === group.length - 1;
    modal.querySelector('.modal-footer').hidden = group.length < 2;
  };

  var openModal = function (cardGroup, index) {
    group = Array.prototype.slice.call(cardGroup.querySelectorAll('template.modal-data'));
    current = index;
    render();
    document.body.classList.add('modal-open');
    modal.showModal();
  };

  document.querySelectorAll('[data-group]').forEach(function (cardGroup) {
    cardGroup.querySelectorAll('.explore-btn').forEach(function (btn, index) {
      btn.addEventListener('click', function () { openModal(cardGroup, index); });
    });
  });

  var step = function (delta) {
    var next = current + delta;
    if (next >= 0 && next < group.length) {
      current = next;
      render();
    }
  };

  modal.querySelectorAll('.modal-nav').forEach(function (btn) {
    btn.addEventListener('click', function () { step(Number(btn.dataset.step)); });
  });
  modal.querySelector('.modal-close').addEventListener('click', function () { modal.close(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  modal.addEventListener('close', function () { document.body.classList.remove('modal-open'); });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
