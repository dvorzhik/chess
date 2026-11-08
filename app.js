    // Отображает нужную страницу без изменения истории браузера.
    // anchorId — необязательный id блока внутри раздела: к нему прокручиваем вместо верха страницы.
    function showPage(pageId, anchorId) {
      document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active-page'));
      document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      });
      document.querySelectorAll('.nav-group').forEach(group => {
        group.classList.remove('sub-active', 'open');
        const toggle = group.querySelector('.sub-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });

      const targetPage = document.getElementById('page-' + pageId);
      if (targetPage) {
        targetPage.classList.add('active-page');
      }

      const activeBtn = document.getElementById('btn-nav-' + pageId);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-current', 'page');

        // Пункт внутри выпадающей группы — подсвечиваем и саму группу
        const group = activeBtn.closest('.nav-group');
        if (group) {
          group.classList.add('sub-active');
          const toggle = group.querySelector('.sub-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
      }

      // После перехода по меню мобильная панель закрывается
      toggleNav(false);

      // Раздел «YouTube о шахматах»: при первом открытии подгружаем результаты опроса
      if (pageId === 'youtube') {
        initYoutubePoll();
      }

      // Прямая ссылка на блок внутри раздела, например #beginner/tutorial
      const anchorTarget = anchorId ? document.getElementById(anchorId) : null;
      if (anchorTarget) {
        anchorTarget.scrollIntoView({ block: 'start' });

        // Картинки в разделе догружаются и могут сдвинуть вёрстку — один раз уточняем позицию
        window.setTimeout(() => {
          const rect = anchorTarget.getBoundingClientRect();
          if (rect.top < 0 || rect.top > 110) {
            anchorTarget.scrollIntoView({ block: 'start' });
          }
        }, 700);

        return;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Разбирает хэш вида #beginner или #beginner/tutorial
    function parseHash(hash) {
      const raw = (hash || '').replace(/^#/, '');
      const parts = raw.split('/');
      const pagePart = parts[0];
      const pageId = pagePart && document.getElementById('page-' + pagePart) ? pagePart : 'home';
      return {
        pageId: pageId,
        anchorId: parts[1] ? decodeURIComponent(parts[1]) : ''
      };
    }

    // Читает текущий хэш (#раздел или #раздел/блок) и показывает соответствующую страницу.
    // Если хэша нет или он неизвестен — показывает главную.
    function handleHash() {
      const route = parseHash(location.hash);
      showPage(route.pageId, route.anchorId);
    }

    // Переключает страницу. URL получает хэш вида #beginner, #checkmate и т.д.,
    // поэтому на любой раздел можно дать прямую ссылку.
    // Изменение location.hash само добавляет запись в историю браузера,
    // поэтому кнопка «Назад» продолжает работать.
    function switchPage(pageId) {
      if (location.hash === '#' + pageId) {
        // Уже на этой странице — просто показываем её (например, при повторном клике)
        showPage(pageId);
      } else {
        location.hash = pageId;
      }
    }

    // Обработка браузерной кнопки «Назад»/«Вперёд» и ручного ввода хэша
    window.addEventListener('hashchange', handleHash);

    // Мобильное меню: открыть/закрыть панель навигации
    function toggleNav(force) {
      const nav = document.getElementById('site-nav');
      const btn = document.getElementById('nav-toggle');
      if (!nav || !btn) return;

      const isOpen = typeof force === 'boolean' ? force : !document.body.classList.contains('nav-open');
      document.body.classList.toggle('nav-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    }

    // Выпадающие группы в хедере: работают по клику, Enter и с клавиатуры
    function toggleSub(button) {
      if (!button) return;
      const group = button.closest('.nav-group');
      if (!group) return;

      const willOpen = !group.classList.contains('open');
      document.querySelectorAll('.nav-group.open').forEach(other => {
        other.classList.remove('open');
        const otherToggle = other.querySelector('.sub-toggle');
        if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
      });
      group.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    function closeSubmenus() {
      document.querySelectorAll('.nav-group.open').forEach(group => {
        group.classList.remove('open');
        const toggle = group.querySelector('.sub-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }

    // Клик мимо выпадающего меню или вне мобильной панели закрывает её
    document.addEventListener('click', event => {
      if (!event.target.closest('.nav-group')) {
        closeSubmenus();
      }
      if (document.body.classList.contains('nav-open') && !event.target.closest('.site-header')) {
        toggleNav(false);
      }
    });

    // Esc закрывает меню, а на широких экранах панель не нужна
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        toggleNav(false);
        closeSubmenus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) toggleNav(false);
    });

    // Актуальный год в футере
    (function setFooterYear() {
      const yearEl = document.getElementById('footer-year');
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    })();

    // Кнопка «Наверх» в конце раздела
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // При первой загрузке открываем раздел из хэша (прямая ссылка) или главную.
    // Вызов стоит в самом конце скрипта — после объявления всех функций опроса.

    /* ------------------------------------------------------------------
       Анонимный опрос «какой канал нравится больше всего».
       Голоса хранятся не на нашем сервере, а в открытом анонимном
       счётчике abacus.jasoncameron.dev: у каждого канала свой счётчик.
       Никаких имён, почты и cookies — при голосовании мы только
       прибавляем единицу к выбранным каналам. Защита от повторного
       голоса — только на самом устройстве (localStorage).
       ------------------------------------------------------------------ */
    const YT_POLL_API = 'https://abacus.jasoncameron.dev';
    const YT_POLL_NAMESPACE = 'dvorzhik-chess-yt-poll-2026';
    const YT_POLL_STORAGE_KEY = 'dvorzhik-yt-poll-2026';

    const ytPollState = {
      initialized: false,
      voting: false,
      voted: false,
      resultsLoaded: false,
      votes: {}
    };

    function ytPollInputs() {
      return Array.from(document.querySelectorAll('#yt-poll-form input[type="checkbox"]'));
    }

    function ytPollSetStatus(text) {
      const el = document.getElementById('yt-poll-status');
      if (el) {
        el.textContent = text;
      }
    }

    // 1234 -> "1 234"
    function ytPollFormatNumber(value) {
      return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Подсветка выбранных вариантов — работает во всех браузерах
    function ytPollSyncChecked() {
      ytPollInputs().forEach(input => {
        const option = input.closest('.poll-option');
        if (option) {
          option.classList.toggle('checked', input.checked);
        }
      });
    }

    // Читает один счётчик. Ответ 404 значит «за этот канал ещё не голосовали»
    async function ytPollGet(key) {
      const response = await fetch(`${YT_POLL_API}/get/${YT_POLL_NAMESPACE}/${key}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.status === 404) {
        return 0;
      }
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const data = await response.json();
      return Number(data.value) || 0;
    }

    async function ytPollHit(key) {
      const response = await fetch(`${YT_POLL_API}/hit/${YT_POLL_NAMESPACE}/${key}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return true;
    }

    function ytPollRenderResults() {
      const barsBox = document.getElementById('yt-poll-bars');
      const totalEl = document.getElementById('yt-poll-total');
      if (!barsBox || !totalEl) {
        return;
      }

      const items = ytPollInputs().map(input => {
        const option = input.closest('.poll-option');
        const label = option ? (option.querySelector('.poll-option-name') || option.querySelector('span')) : null;
        return {
          name: label ? label.textContent : input.value,
          count: ytPollState.votes[input.value] || 0
        };
      });

      const total = items.reduce((sum, item) => sum + item.count, 0);
      items.sort((a, b) => b.count - a.count);

      totalEl.textContent = total
        ? 'Всего голосов: ' + ytPollFormatNumber(total) + ' · каналов в опросе: ' + items.length
        : 'Пока никто не голосовал — станьте первым!';

      barsBox.innerHTML = '';

      items.forEach(item => {
        const percent = total ? Math.round((item.count / total) * 100) : 0;

        const row = document.createElement('div');
        row.className = 'poll-row';
        row.innerHTML =
          '<div class="poll-row-top">' +
            '<span class="poll-row-name"></span>' +
            '<span class="poll-row-num"></span>' +
          '</div>' +
          '<div class="poll-bar"><div class="poll-bar-fill"></div></div>';

        row.querySelector('.poll-row-name').textContent = item.name;
        row.querySelector('.poll-row-num').textContent = ytPollFormatNumber(item.count) + ' · ' + percent + '%';
        row.querySelector('.poll-bar-fill').style.width = percent + '%';

        barsBox.appendChild(row);
      });
    }

    async function ytPollLoadResults() {
      const inputs = ytPollInputs();
      if (!inputs.length) {
        return;
      }

      try {
        const values = await Promise.all(inputs.map(input => ytPollGet(input.value)));
        ytPollState.votes = {};
        inputs.forEach((input, index) => {
          ytPollState.votes[input.value] = values[index];
        });
        ytPollState.resultsLoaded = true;
        ytPollRenderResults();
      } catch (error) {
        ytPollSetStatus('Не удалось загрузить результаты опроса. Проверьте интернет и попробуйте ещё раз.');
        if (!ytPollState.resultsLoaded) {
          const totalEl = document.getElementById('yt-poll-total');
          if (totalEl) {
            totalEl.textContent = 'Результаты временно недоступны — попробуйте обновить страницу позже.';
          }
        }
      }
    }

    async function ytPollShowResults(message) {
      const box = document.getElementById('yt-poll-results');
      if (box) {
        box.classList.add('visible');
      }
      await ytPollLoadResults();
      if (message) {
        ytPollSetStatus(message);
      }
    }


    // После голосования фиксируем выбор на этом устройстве
    function ytPollLock(channels) {
      ytPollState.voted = true;
      ytPollInputs().forEach(input => {
        input.checked = channels.indexOf(input.value) !== -1;
        input.disabled = true;
        const option = input.closest('.poll-option');
        if (option) {
          option.classList.add('locked');
        }
      });
      ytPollSyncChecked();

      const button = document.getElementById('yt-poll-submit');
      if (button) {
        button.disabled = true;
        button.textContent = 'Вы уже голосовали';
      }
    }

    async function ytPollSubmit(event) {
      event.preventDefault();
      if (ytPollState.voting || ytPollState.voted) {
        return;
      }

      const selected = ytPollInputs().filter(input => input.checked);
      if (!selected.length) {
        ytPollSetStatus('Отметьте хотя бы один канал — можно выбрать несколько.');
        return;
      }

      const button = document.getElementById('yt-poll-submit');
      ytPollState.voting = true;
      if (button) {
        button.disabled = true;
        button.textContent = 'Отправляем…';
      }
      ytPollSetStatus('');

      try {
        const hadResults = ytPollState.resultsLoaded;

        // Отправляем по одному голосу — так мы не упираемся в лимит счётчика
        for (const input of selected) {
          await ytPollHit(input.value);
        }

        const channels = selected.map(input => input.value);
        ytPollLock(channels);

        try {
          localStorage.setItem(YT_POLL_STORAGE_KEY, JSON.stringify({
            channels: channels,
            date: new Date().toISOString()
          }));
        } catch (error) {
          // Приватный режим браузера может запрещать localStorage — это не критично
        }

        if (typeof gtag === 'function') {
          gtag('event', 'vote_youtube_channel', {
            channels: channels.join(','),
            count: channels.length
          });
        }

        if (button) {
          button.textContent = 'Голос учтён';
        }

        // Итоги уже загружены — просто прибавляем свой голос, без лишних запросов.
        // Если загрузить не успели, читаем счётчики заново.
        if (hadResults) {
          selected.forEach(input => {
            ytPollState.votes[input.value] = (ytPollState.votes[input.value] || 0) + 1;
          });
          ytPollRenderResults();
          const box = document.getElementById('yt-poll-results');
          if (box) {
            box.classList.add('visible');
          }
        } else {
          await ytPollLoadResults();
          const box = document.getElementById('yt-poll-results');
          if (box) {
            box.classList.add('visible');
          }
        }

        ytPollSetStatus('Спасибо! Голос учтён — результаты обновлены.');
      } catch (error) {
        if (button) {
          button.disabled = false;
          button.textContent = 'Отправить голос';
        }
        ytPollSetStatus('Не получилось отправить голос. Проверьте интернет и попробуйте ещё раз.');
      } finally {
        ytPollState.voting = false;
      }
    }

    // Инициализация опроса при первом открытии раздела
    function initYoutubePoll() {
      if (ytPollState.initialized) {
        return;
      }
      ytPollState.initialized = true;

      ytPollInputs().forEach(input => {
        input.addEventListener('change', () => {
          ytPollSyncChecked();
          ytPollSetStatus('');
        });
      });

      const form = document.getElementById('yt-poll-form');
      if (form) {
        form.addEventListener('submit', ytPollSubmit);
      }

      const showButton = document.getElementById('yt-poll-show');
      const resultsBox = document.getElementById('yt-poll-results');
      if (showButton && resultsBox) {
        showButton.addEventListener('click', () => {
          if (resultsBox.classList.contains('visible')) {
            resultsBox.classList.remove('visible');
            showButton.textContent = 'Показать результаты';
          } else {
            showButton.textContent = 'Скрыть результаты';
            ytPollShowResults();
          }
        });
      }

      // Если с этого браузера уже голосовали — восстанавливаем выбор
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(YT_POLL_STORAGE_KEY) || 'null');
      } catch (error) {
        saved = null;
      }

      if (saved && Array.isArray(saved.channels) && saved.channels.length) {
        ytPollLock(saved.channels);
        if (resultsBox) {
          resultsBox.classList.add('visible');
        }
        ytPollLoadResults();
        ytPollSetStatus('Вы уже голосовали с этого устройства — спасибо! Ниже результаты опроса.');
      } else {
        ytPollLoadResults();
      }
    }

    // Стартуем после того, как объявлены все функции, включая опрос
    handleHash();

    const quotes = [
      { text: "Шахматы — это жизнь в миниатюре.", author: "Гарри Каспаров", icon: "♔" },
      { text: "В шахматах можно стать большим мастером, лишь осознав свои ошибки и недостатки.", author: "Александр Алехин", icon: "♕" },
      { text: "Шахматы, прежде всего, учат быть объективным.", author: "Александр Алехин", icon: "♕" },
      { text: "Игра в шахматы — это испытание воли.", author: "Эмануил Ласкер", icon: "♘" },
      { text: "Шахматы — по форме игра, по содержанию — искусство, а по трудности овладения — наука.", author: "Тигран Петросян", icon: "♗" },
      { text: "Шахматы — это прежде всего труд.", author: "Михаил Ботвинник", icon: "♖" },
      { text: "Жизнь слишком коротка для шахмат, но это не вина шахмат.", author: "Вильгельм Стейниц", icon: "♔" },
      { text: "Самый суровый соперник в шахматах — ты сам.", author: "Василий Смыслов", icon: "♔" },
      { text: "Шахматы — это жизнь.", author: "Роберт Фишер", icon: "♔" },
      { text: "Угроза сильнее ее исполнения.", author: "Зигберт Тарраш", icon: "♞" },
      { text: "Никто и никогда не пожалеет о времени, отданном шахматам, ибо они помогут в любой профессии.", author: "Борис Спасский", icon: "♖" },
      { text: "Шахматы воспитывают склонность к самостоятельному мышлению.", author: "Альберт Эйнштейн", icon: "💡" },
      { text: "В шахматах выигрывает тот, кто ошибается предпоследним.", author: "Савелий Тартаковер", icon: "♗" },
      { text: "Пешка — душа шахмат.", author: "Франсуа-Андре Филидор", icon: "♙" },
      { text: "Шахматы — прекрасная забава для ума, но они требуют слишком много серьезности для простой игры.", author: "Блез Паскаль", icon: "🧠" },
      { text: "Шахматы — это гимнастика для ума.", author: "Иоганн Вольфганг Гёте", icon: "🧠" }
    ];

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selectedQuote = quotes[randomIndex];

    document.getElementById("quote-icon").innerText = selectedQuote.icon;
    document.getElementById("quote-text").innerText = `«${selectedQuote.text}»`;
    document.getElementById("quote-author").innerText = selectedQuote.author;
  
