/* ==========================================================================
   TechScript Interactive JavaScript Logic
   Includes: ScrollSpy, Search Modal, Theme Switcher, Typing Engine,
             Playground, FAQ Accordion, Parallax Orbs, Scroll Reveal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initScrollManager();
  initMobileNav();
  initThemeToggle();
  initPlayground();
  initFaqAccordion();
  initCopyButtons();
  initOrbFollow();
  initScrollReveal();
  initTerminalTyping();
  initSearchPalette();
});

/* ── THROTTLED SCROLL MANAGER (Scrollspy & Sticky Nav) ── */
function initScrollManager() {
  let scrollScheduled = false;
  const mainNav = document.getElementById('mainNav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(() => {
        // 1. Toggle sticky background
        if (mainNav) {
          mainNav.classList.toggle('scrolled', window.scrollY > 40);
        }

        // 2. Active nav link tracking
        let current = '';
        const scrollPosition = window.scrollY + 120;

        sections.forEach(s => {
          if (scrollPosition >= s.offsetTop) {
            current = s.id;
          }
        });

        navLinks.forEach(a => {
          const href = a.getAttribute('href');
          if (href && href.startsWith('#')) {
            if (href === '#' + current) {
              a.classList.add('active-nav');
            } else {
              a.classList.remove('active-nav');
            }
          }
        });

        scrollScheduled = false;
      });
    }
  }, { passive: true });
}

/* ── MOBILE NAVBAR ── */
function initMobileNav() {
  const hamBtn = document.getElementById('hamBtn');
  const mobMenu = document.getElementById('mobMenu');

  if (hamBtn && mobMenu) {
    hamBtn.addEventListener('click', () => {
      const isOpen = mobMenu.classList.toggle('open');
      hamBtn.classList.toggle('open', isOpen);
      hamBtn.setAttribute('aria-expanded', isOpen);
    });

    mobMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        hamBtn.classList.remove('open');
        hamBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ── THEME SWITCHER ── */
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
      document.body.classList.add('light-theme');
    }

    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }
}

/* ── INTERACTIVE PLAYGROUND ── */
const PLAYGROUND_EXAMPLES = {
  hello: {
    file: 'hello.txs',
    code: `<span class="cmt">// TechScript - The world's easiest syntax</span>
<span><span class="kw">say</span> <span class="str">"Hello, World!"</span></span>
<span><span class="kw">say</span> <span class="str">"TechScript reads like plain English 🐉"</span></span>

<span class="cmt">// Reading terminal input</span>
<span><span class="kw2">make</span> username <span class="op">be</span> <span class="kw">ask</span> <span class="str">"What is your name? "</span></span>
<span><span class="kw">say</span> <span class="str">f"Welcome, {username}! Enjoy coding."</span></span>`,
    out: `Hello, World!\nTechScript reads like plain English 🐉\nWhat is your name? \u001b[36mTanmoy\u001b[0m\nWelcome, Tanmoy! Enjoy coding.`
  },
  vars: {
    file: 'variables.txs',
    code: `<span class="cmt">// 'make' declares a variable</span>
<span><span class="kw2">make</span> score <span class="op">be</span> <span class="num">100</span></span>
<span><span class="kw2">make</span> player <span class="op">be</span> <span class="str">"DragonSlayer"</span></span>
<span><span class="kw2">make</span> coordinates <span class="op">be</span> [<span class="num">34.2</span>, <span class="num">-118.4</span>]</span>

<span class="cmt">// 'keep' declares constants (immutable)</span>
<span><span class="kw2">keep</span> VERSION <span class="op">be</span> <span class="str">"1.0.8"</span></span>

<span><span class="kw">say</span> <span class="str">f"Player: {player} has score {score}"</span></span>
<span><span class="kw">say</span> <span class="str">f"System Version: {VERSION}"</span></span>`,
    out: `Player: DragonSlayer has score 100\nSystem Version: 1.0.8`
  },
  cond: {
    file: 'conditions.txs',
    code: `<span class="cmt">// Conditions using 'when', 'or when', 'else'</span>
<span><span class="kw2">make</span> points <span class="op">be</span> <span class="num">85</span></span>

<span><span class="kw2">when</span> points >= <span class="num">90</span> {</span>
<span>  <span class="kw">say</span> <span class="str">"Grade: Excellent! 🏆"</span></span>
<span>} <span class="kw2">or when</span> points >= <span class="num">75</span> {</span>
<span>  <span class="kw">say</span> <span class="str">"Grade: Good Job! 👍"</span></span>
<span>} <span class="kw2">else</span> {</span>
<span>  <span class="kw">say</span> <span class="str">"Grade: Keep Practicing! 💪"</span></span>
<span>}</span>`,
    out: `Grade: Good Job! 👍`
  },
  loops: {
    file: 'loops.txs',
    code: `<span class="cmt">// Repeating actions using 'each' range loops</span>
<span><span class="kw2">each</span> step <span class="op">in</span> <span class="num">1</span>..<span class="num">4</span> {</span>
<span>  <span class="kw">say</span> <span class="str">f"Action Step: {step}"</span></span>
<span>}</span>

<span class="cmt">// Looping over a list of items</span>
<span><span class="kw2">make</span> colors <span class="op">be</span> [<span class="str">"Cyan"</span>, <span class="str">"Blue"</span>, <span class="str">"Purple"</span>]</span>
<span><span class="kw2">each</span> color <span class="op">in</span> colors {</span>
<span>  <span class="kw">say</span> <span class="str">f"Setting color to {color}"</span></span>
<span>}</span>`,
    out: `Action Step: 1\nAction Step: 2\nAction Step: 3\nAction Step: 4\nSetting color to Cyan\nSetting color to Blue\nSetting color to Purple`
  },
  funcs: {
    file: 'functions.txs',
    code: `<span class="cmt">// Define reusable functions with 'build'</span>
<span><span class="fn-c">build</span> calculate_bonus(score, multiplier <span class="op">=</span> <span class="num">1.5</span>) {</span>
<span>  <span class="kw">give</span> score * multiplier</span>
<span>}</span>

<span><span class="fn-c">build</span> display_alert(msg) {</span>
<span>  <span class="kw">say</span> <span class="str">f"[ALERT]: {msg}"</span></span>
<span>}</span>

<span><span class="kw2">make</span> final_score <span class="op">be</span> calculate_bonus(<span class="num">120</span>)</span>
<span>display_alert(<span class="str">f"Your final score is {final_score}"</span>)</span>`,
    out: `[ALERT]: Your final score is 180.0`
  },
  classes: {
    file: 'classes.txs',
    code: `<span class="cmt">// Creating structured blueprints with 'model'</span>
<span><span class="kw2">model</span> Character {</span>
<span>  <span class="fn-c">build</span> init(self, name, hp) {</span>
<span>    self.name <span class="op">=</span> name</span>
<span>    self.hp <span class="op">=</span> hp</span>
<span>  }</span>
<span>  </span>
<span>  <span class="fn-c">build</span> check_status(self) {</span>
<span>    <span class="kw">say</span> <span class="str">f"Hero {self.name} has {self.hp} Health Points"</span></span>
<span>  }</span>
<span>}</span>

<span><span class="kw2">make</span> warrior <span class="op">be</span> Character(<span class="str">"Thorin"</span>, <span class="num">150</span>)</span>
<span>warrior.check_status()</span>`,
    out: `Hero Thorin has 150 Health Points`
  },
  errors: {
    file: 'error_handling.txs',
    code: `<span class="cmt">// Prevent crashes with 'attempt' & 'catch'</span>
<span><span class="kw2">attempt</span> {</span>
<span>  <span class="kw2">make</span> bad_calculation <span class="op">be</span> <span class="num">50</span> / <span class="num">0</span></span>
<span>} <span class="op">catch</span> err {</span>
<span>  <span class="kw text-muted">say</span> <span class="str">f"Safely handled exception: {err.message}"</span></span>
<span>}</span>

<span><span class="kw">say</span> <span class="str">"System stabilized and continues execution."</span></span>`,
    out: `Safely handled exception: division by zero\nSystem stabilized and continues execution.`
  },
  web: {
    file: 'webpage.txs',
    code: `<span class="cmt">// Create a responsive running website</span>
<span><span class="kw2">use</span> web</span>

<span><span class="kw2">make</span> main_page <span class="op">be</span> WebPage(<span class="str">"Interactive Dashboard"</span>)</span>

<span>main_page.style(<span class="str">"h1"</span>, {</span>
<span>  <span class="str">"color"</span>: <span class="str">"#00f2fe"</span>,</span>
<span>  <span class="str">"text-align"</span>: <span class="str">"center"</span></span>
<span>})</span>

<span>main_page.body([</span>
<span>  main_page.h1(<span class="str">"TechScript Web Builder Server 🚀"</span>),</span>
<span>  main_page.p(<span class="str">"Render elements without editing HTML files!"</span>)</span>
<span>])</span>

<span>main_page.run()</span>`,
    out: `🌐 Local server hosting WebPage on http://localhost:5000\n✓ Browser opened automatically\n[Press Ctrl+C to terminate server]`
  },
  crypto: {
    file: 'cryptography.txs',
    code: `<span class="cmt">// Native hashing and encoding capabilities</span>
<span><span class="kw2">make</span> raw_text <span class="op">be</span> <span class="str">"TechScriptSecurity"</span></span>

<span class="cmt">// SHA-256 secure hash</span>
<span><span class="kw2">make</span> hashed_val <span class="op">be</span> sha256(raw_text)</span>
<span><span class="kw">say</span> <span class="str">f"SHA-256 Output: {hashed_val}"</span></span>

<span class="cmt">// Base64 translation</span>
<span><span class="kw2">make</span> cipher_base <span class="op">be</span> base64_encode(raw_text)</span>
<span><span class="kw">say</span> <span class="str">f"Base64 Format: {cipher_base}"</span></span>`,
    out: `SHA-256 Output: 6e9e4fcf6a8a7db3c80ff6cfc53adcfde9ad8a38\nBase64 Format: VGVjaFNjcmlwdFNlY3VyaXR5`
  }
};

function initPlayground() {
  const playCode = document.getElementById('play-code');
  const playOut = document.getElementById('play-out');
  const playFname = document.getElementById('play-fname');
  const exButtons = document.querySelectorAll('.exbtn');

  if (playCode && playOut && playFname) {
    function showEx(key, clickedBtn) {
      const data = PLAYGROUND_EXAMPLES[key];
      if (!data) return;

      playCode.innerHTML = data.code;
      playOut.textContent = data.out;
      playFname.textContent = data.file;

      exButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      });

      if (clickedBtn) {
        clickedBtn.classList.add('active');
        clickedBtn.setAttribute('aria-current', 'true');
      }
    }

    exButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-example');
        showEx(key, btn);
      });
    });

    // Load initial example
    const defaultBtn = document.querySelector('.exbtn[data-example="hello"]');
    if (defaultBtn) {
      showEx('hello', defaultBtn);
    }
  }
}

/* ── FAQ ACCORDION ── */
function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-q');
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const answer = item.querySelector('.faq-a');
      const isOpen = item.classList.toggle('open');

      button.setAttribute('aria-expanded', isOpen);
      answer.hidden = !isOpen;
    });
  });
}

/* ── DECOUPLED COPY TO CLIPBOARD BUTTONS ── */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-btn[data-copy]');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.textContent;
          btn.textContent = "✓ Copied!";
          btn.style.background = "rgba(16, 185, 129, 0.2)";
          btn.style.borderColor = "#10b981";
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "";
            btn.style.borderColor = "";
          }, 1500);
        }).catch(() => {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            btn.textContent = "✓ Copied!";
          } catch(e) {}
          document.body.removeChild(textarea);
          setTimeout(() => { btn.textContent = "Copy"; }, 1500);
        });
      }
    });
  });
}

/* ── MOUSE PARALLAX ORB INTERACTION ── */
function initOrbFollow() {
  const orbs = [
    { el: document.querySelector('.orb-1'), factorX: -0.04, factorY: -0.04, currentX: 0, currentY: 0, targetX: 0, targetY: 0 },
    { el: document.querySelector('.orb-2'), factorX: 0.03, factorY: 0.03, currentX: 0, currentY: 0, targetX: 0, targetY: 0 },
    { el: document.querySelector('.orb-3'), factorX: 0.02, factorY: -0.02, currentX: 0, currentY: 0, targetX: 0, targetY: 0 }
  ];

  window.addEventListener('mousemove', (e) => {
    const mx = e.clientX - window.innerWidth / 2;
    const my = e.clientY - window.innerHeight / 2;

    orbs.forEach(o => {
      o.targetX = mx * o.factorX;
      o.targetY = my * o.factorY;
    });
  }, { passive: true });

  function renderLoop() {
    orbs.forEach(o => {
      if (o.el) {
        o.currentX += (o.targetX - o.currentX) * 0.08;
        o.currentY += (o.targetY - o.currentY) * 0.08;
        o.el.style.transform = `translate(${o.currentX}px, ${o.currentY}px)`;
      }
    });
    requestAnimationFrame(renderLoop);
  }
  renderLoop();
}

/* ── SCROLL REVEAL (Intersection Observer) ── */
function initScrollReveal() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    const classesToReveal = '.feat-card, .rel-card, .ccard, .faq-item, .rcard, .install-card, .steps-card, .pipeline-step, .roadmap-phase, .test-card';
    document.querySelectorAll(classesToReveal).forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
      observer.observe(el);
    });
  }
}

/* ── HERO IDE TERMINAL AUTO-TYPING SIMULATION ── */
function initTerminalTyping() {
  const terminalBody = document.querySelector('.terminal .tbody');
  if (!terminalBody) return;

  const lines = [
    { type: 'comment', text: '// TechScript - Reads exactly like English' },
    { type: 'code', text: 'say "Write code like a sentence"' },
    { type: 'code', text: 'make language be "TechScript"' },
    { type: 'code', text: 'say f"Welcome to {language}! 🐉"' },
    { type: 'command', text: '$ tech run main.txs' },
    { type: 'output', text: 'Write code like a sentence' },
    { type: 'output', text: 'Welcome to TechScript! 🐉' }
  ];

  terminalBody.innerHTML = ''; // Clear initial static contents
  let lineIdx = 0;

  function typeNextLine() {
    if (lineIdx >= lines.length) {
      // Finished all lines, add a flashing cursor
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      terminalBody.appendChild(cursor);
      return;
    }

    const currentLine = lines[lineIdx];
    const lineElement = document.createElement('div');
    terminalBody.appendChild(lineElement);

    if (currentLine.type === 'comment') {
      lineElement.className = 'cmt';
      typeString(lineElement, currentLine.text, 0, 30, () => {
        lineIdx++;
        setTimeout(typeNextLine, 600);
      });
    } else if (currentLine.type === 'code') {
      // Apply simple syntax coloring on the fly
      lineElement.style.color = '#e2e8f0';
      typeString(lineElement, currentLine.text, 0, 45, () => {
        // Post-process highlight
        highlightInlineElements(lineElement);
        lineIdx++;
        setTimeout(typeNextLine, 600);
      });
    } else if (currentLine.type === 'command') {
      lineElement.style.color = 'var(--text-muted)';
      typeString(lineElement, currentLine.text, 0, 40, () => {
        lineIdx++;
        setTimeout(typeNextLine, 800);
      });
    } else if (currentLine.type === 'output') {
      lineElement.className = 'out-ln';
      lineElement.textContent = currentLine.text;
      lineIdx++;
      setTimeout(typeNextLine, 400);
    }
  }

  function typeString(element, text, charIdx, speed, callback) {
    if (charIdx >= text.length) {
      callback();
      return;
    }
    element.textContent += text[charIdx];
    setTimeout(() => {
      typeString(element, text, charIdx + 1, speed, callback);
    }, speed);
  }

  function highlightInlineElements(el) {
    let html = el.textContent;
    // Highlight strings first (before adding HTML tags with quotes)
    html = html.replace(/(f?".*?")/g, '<span class="str">$1</span>');
    // Highlight keywords
    html = html.replace(/\b(say)\b/g, '<span class="kw">$1</span>');
    html = html.replace(/\b(make)\b/g, '<span class="kw2">$1</span>');
    html = html.replace(/\b(be)\b/g, '<span class="op">$1</span>');
    el.innerHTML = html;
  }

  // Start typing slightly after load
  setTimeout(typeNextLine, 1000);
}

/* ── COMMAND PALETTE SEARCH ── */
const SEARCH_INDEX = [
  { title: "Home", category: "Navigation", desc: "Welcome section, header branding, and CTAs.", link: "#hero" },
  { title: "Why TechScript?", category: "Navigation", desc: "Readability comparisons and main benefits.", link: "#features" },
  { title: "Ecosystem Tools", category: "Navigation", desc: "Studio IDE, CLI packages, and the ZeroHTML framework.", link: "#features" },
  { title: "Installation & CLI Setup", category: "Navigation", desc: "Windows graphical installers and Python pip instructions.", link: "#install" },
  { title: "Syntax Comparisons", category: "Navigation", desc: "TechScript compared directly with Python and JavaScript.", link: "#compare" },
  { title: "Compiler Pipeline", category: "Navigation", desc: "Stages: Lexer ➔ Parser ➔ AST ➔ Bytecode VM.", link: "#compiler" },
  { title: "Development Roadmap 2.0", category: "Navigation", desc: "Phase timeline including LLVM, JIT, and LSP.", link: "#roadmap" },
  { title: "FAQ", category: "Navigation", desc: "Interactive answers to frequently asked questions.", link: "#faq" },
  { title: "Contributing Guide", category: "Navigation", desc: "Forking repositories and reporting bugs on GitHub.", link: "#contribute" },
  { title: "tech run", category: "CLI Commands", desc: "Execute a TechScript file: tech run app.txs", link: "#features" },
  { title: "tech repl", category: "CLI Commands", desc: "Launch interactive shell repl environment.", link: "#features" },
  { title: "tech transpile", category: "CLI Commands", desc: "Convert TechScript files into Python code.", link: "#features" },
  { title: "Web Builder Example", category: "Playground", desc: "use web library to create local HTTP servers.", link: "#playground" },
  { title: "Classes (OOP) Example", category: "Playground", desc: "Define OOP blueprints using the model keyword.", link: "#playground" }
];

function initSearchPalette() {
  const trigger = document.getElementById('searchTrigger');
  const modal = document.getElementById('searchModal');
  const input = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');

  if (!trigger || !modal || !input || !resultsContainer) return;

  function openSearch() {
    try {
      modal.showModal();
    } catch (e) {
      // Fallback for older browsers
    }
    modal.classList.add('open');
    input.focus();
    renderResults("");
    document.body.style.overflow = "hidden"; // disable background scroll
  }

  function closeSearch() {
    if (modal.hasAttribute('open')) {
      try {
        modal.close();
      } catch (e) {}
    }
    modal.classList.remove('open');
    input.value = "";
    document.body.style.overflow = "";
  }

  trigger.addEventListener('click', openSearch);
  
  // Close when clicking outside the box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSearch();
    }
  });

  // Track native dialog close event (e.g. Escape key)
  modal.addEventListener('close', closeSearch);

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  input.addEventListener('keydown', (e) => {
    const results = resultsContainer.querySelectorAll('.search-res-item');
    if (results.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      results[0].focus();
    }
  });

  resultsContainer.addEventListener('keydown', (e) => {
    const results = Array.from(resultsContainer.querySelectorAll('.search-res-item'));
    const currentIdx = results.indexOf(document.activeElement);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (currentIdx + 1) % results.length;
      results[nextIdx].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIdx === 0) {
        input.focus();
      } else {
        const prevIdx = (currentIdx - 1 + results.length) % results.length;
        results[prevIdx].focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  });

  input.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  function renderResults(query) {
    resultsContainer.innerHTML = "";
    const filtered = SEARCH_INDEX.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">No matches found for "${query}"</div>`;
      return;
    }

    filtered.forEach(item => {
      const el = document.createElement('a');
      el.href = item.link;
      el.className = "search-res-item";
      el.setAttribute('role', 'option');
      el.setAttribute('tabindex', '0');
      el.innerHTML = `
        <span class="search-res-cat">${item.category}</span>
        <span class="search-res-title">${item.title}</span>
        <span class="search-res-desc">${item.desc}</span>
      `;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeSearch();
        window.location.hash = item.link;
        // Adjust for sticky header
        const targetElement = document.querySelector(item.link);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
      // Handle activation via Enter key
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          el.click();
        }
      });
      resultsContainer.appendChild(el);
    });
  }
}
