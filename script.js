// ── THROTTLED SCROLL MANAGER ──

let scrollScheduled = false;

const mainNav = document.getElementById('mainNav');

const sections = document.querySelectorAll('section[id]');

const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {

  if (!scrollScheduled) {

    scrollScheduled = true;

    requestAnimationFrame(() => {

      // 1. Toggle scrolled class

      if (mainNav) {

        mainNav.classList.toggle('scrolled', window.scrollY > 50);

      }

      

      // 2. Active nav link highlighting

      let current = '';

      sections.forEach(s => {

        // Offset check

        if (window.scrollY >= s.offsetTop - 120) {

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

// ── MOBILE NAV ──

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

// ── THEME TOGGLE ──

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

// ── COPY TEXT ──

function copyText(text, btn) {

  navigator.clipboard.writeText(text).then(() => {

    const orig = btn.textContent;

    btn.textContent = '✓ Copied!';

    btn.style.background = 'rgba(13,242,139,.25)';

    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1800);

  }).catch(() => {

    const ta = document.createElement('textarea');

    ta.value = text;ta.style.cssText='position:fixed;opacity:0;';

    document.body.appendChild(ta);ta.select();

    try{document.execCommand('copy');}catch(e){}

    document.body.removeChild(ta);

    btn.textContent = '✓ Copied!';

    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);

  });

}

// ── PLAYGROUND ──

const EX = {

  hello: {

    file: 'hello.txs',

    code: `<span class="cmt">// Your first TechScript program</span><br>

<span class="cmt">// 'say' prints text to screen</span><br><br>

<span><span class="kw">say</span> <span class="str">"Hello, World!"</span></span><br>

<span><span class="kw">say</span> <span class="str">"TechScript is easy! 🐉"</span></span><br><br>

<span class="cmt">// 'ask' reads user input</span><br>

<span><span class="kw2">make</span> name <span class="op">be</span> <span class="kw">ask</span> <span class="str">"Your name? "</span></span><br>

<span><span class="kw">say</span> <span class="str">f"Nice to meet you, {name}!"</span></span>`,

    out: `<span class="out-ln">Hello, World!</span><span class="out-ln">TechScript is easy! 🐉</span><span class="out-ln">Your name? <span class="out-dim">Alex</span></span><span class="out-ln">Nice to meet you, Alex!</span>`

  },

  vars: {

    file: 'variables.txs',

    code: `<span class="cmt">// 'make' creates a variable</span><br>

<span><span class="kw2">make</span> name <span class="op">be</span> <span class="str">"Alice"</span></span><br>

<span><span class="kw2">make</span> age <span class="op">be</span> <span class="num">25</span></span><br>

<span><span class="kw2">make</span> scores <span class="op">be</span> [<span class="num">88</span>, <span class="num">94</span>, <span class="num">77</span>]</span><br><br>

<span class="cmt">// 'keep' creates a constant — cannot be changed</span><br>

<span><span class="kw2">keep</span> PI <span class="op">be</span> <span class="num">3.14159</span></span><br><br>

<span><span class="kw">say</span> <span class="str">f"Name: {name}, Age: {age}"</span></span><br>

<span><span class="kw">say</span> <span class="str">f"Pi is always {PI}"</span></span><br>

<span><span class="kw">say</span> scores</span>`,

    out: `<span class="out-ln">Name: Alice, Age: 25</span><span class="out-ln">Pi is always 3.14159</span><span class="out-ln">[88, 94, 77]</span>`

  },

  cond: {

    file: 'conditions.txs',

    code: `<span class="cmt">// 'when' is TechScript's if statement</span><br>

<span class="cmt">// 'or when' = else if, 'else' = else</span><br><br>

<span><span class="kw2">make</span> age <span class="op">be</span> <span class="num">20</span></span><br><br>

<span><span class="kw2">when</span> age >= <span class="num">18</span> {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">"You are an adult!"</span></span><br>

<span>} <span class="kw2">or when</span> age >= <span class="num">13</span> {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">"You are a teenager!"</span></span><br>

<span>} <span class="kw2">else</span> {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">"You are a child!"</span></span><br>

<span>}</span>`,

    out: `<span class="out-ln">You are an adult!</span>`

  },

  loops: {

    file: 'loops.txs',

    code: `<span class="cmt">// 'each' loop over a numeric range</span><br>

<span><span class="kw2">each</span> i <span class="op">in</span> <span class="num">1</span>..<span class="num">5</span> {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">f"Count: {i}"</span></span><br>

<span>}</span><br><br>

<span class="cmt">// Loop through a list</span><br>

<span><span class="kw2">each</span> fruit <span class="op">in</span> [<span class="str">"apple"</span>, <span class="str">"mango"</span>, <span class="str">"kiwi"</span>] {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">f"I like {fruit}!"</span></span><br>

<span>}</span>`,

    out: `<span class="out-ln">Count: 1</span><span class="out-ln">Count: 2</span><span class="out-ln">Count: 3</span><span class="out-ln">Count: 4</span><span class="out-ln">Count: 5</span><span class="out-ln">I like apple!</span><span class="out-ln">I like mango!</span><span class="out-ln">I like kiwi!</span>`

  },

  funcs: {

    file: 'functions.txs',

    code: `<span class="cmt">// 'build' defines a reusable function</span><br>

<span class="cmt">// 'give' returns a value</span><br><br>

<span><span class="fn-c">build</span> greet(name, greeting <span class="op">=</span> <span class="str">"Hello"</span>) {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">f"{greeting}, {name}!"</span></span><br>

<span>}</span><br><br>

<span><span class="fn-c">build</span> add(a, b) {</span><br>

<span>&nbsp;&nbsp;<span class="kw">give</span> a + b</span><br>

<span>}</span><br><br>

<span>greet(<span class="str">"Alice"</span>)</span><br>

<span>greet(<span class="str">"Bob"</span>, <span class="str">"Hey"</span>)</span><br>

<span><span class="kw">say</span> add(<span class="num">10</span>, <span class="num">20</span>)</span>`,

    out: `<span class="out-ln">Hello, Alice!</span><span class="out-ln">Hey, Bob!</span><span class="out-ln">30</span>`

  },

  classes: {

    file: 'classes.txs',

    code: `<span class="cmt">// 'model' defines a class (OOP)</span><br>

<span><span class="kw2">model</span> Dog {</span><br>

<span>&nbsp;&nbsp;<span class="fn-c">build</span> init(self, name, breed) {</span><br>

<span>&nbsp;&nbsp;&nbsp;&nbsp;self.name <span class="op">=</span> name</span><br>

<span>&nbsp;&nbsp;&nbsp;&nbsp;self.breed <span class="op">=</span> breed</span><br>

<span>&nbsp;&nbsp;}</span><br>

<span>&nbsp;&nbsp;<span class="fn-c">build</span> speak(self) {</span><br>

<span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">say</span> <span class="str">f"{self.name} ({self.breed}): Woof! 🐕"</span></span><br>

<span>&nbsp;&nbsp;}</span><br>

<span>}</span><br><br>

<span><span class="kw2">make</span> rex <span class="op">be</span> Dog(<span class="str">"Rex"</span>, <span class="str">"Shepherd"</span>)</span><br>

<span>rex.speak()</span>`,

    out: `<span class="out-ln">Rex (Shepherd): Woof! 🐕</span>`

  },

  errors: {

    file: 'error_handling.txs',

    code: `<span class="cmt">// 'attempt' = try safely</span><br>

<span class="cmt">// 'catch err' handles the error</span><br><br>

<span><span class="kw2">attempt</span> {</span><br>

<span>&nbsp;&nbsp;<span class="kw2">make</span> result <span class="op">be</span> <span class="num">10</span> / <span class="num">0</span></span><br>

<span>} <span class="op">catch</span> err {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">f"Caught: {err.message}"</span></span><br>

<span>}</span><br><br>

<span><span class="kw">say</span> <span class="str">"Program continues normally ✓"</span></span>`,

    out: `<span class="out-ln">Caught: division by zero</span><span class="out-ln">Program continues normally ✓</span>`

  },

  web: {

    file: 'my_website.txs',

    code: `<span class="cmt">// Build a website — zero HTML needed!</span><br>

<span><span class="kw2">use</span> web</span><br><br>

<span><span class="kw2">make</span> page <span class="op">be</span> WebPage(<span class="str">"My First Site"</span>)</span><br><br>

<span>page.style(<span class="str">"body"</span>, {</span><br>

<span>&nbsp;&nbsp;<span class="str">"background"</span>: <span class="str">"#04060f"</span>,</span><br>

<span>&nbsp;&nbsp;<span class="str">"color"</span>: <span class="str">"#0df28b"</span>,</span><br>

<span>&nbsp;&nbsp;<span class="str">"font-family"</span>: <span class="str">"sans-serif"</span></span><br>

<span>})</span><br><br>

<span>page.body([</span><br>

<span>&nbsp;&nbsp;page.h1(<span class="str">"Hello from TechScript! 🐉"</span>),</span><br>

<span>&nbsp;&nbsp;page.p(<span class="str">"No HTML. No CSS files. Just .txs"</span>)</span><br>

<span>])</span><br>

<span>page.run()</span>`,

    out: `<span class="out-ln">🌐 Server running on http://localhost:5000</span><span class="out-ln">✓ Browser opened automatically</span><span class="out-dim">[Ctrl+C to stop]</span>`

  },

  fib: {

    file: 'fibonacci.txs',

    code: `<span class="cmt">// Classic Fibonacci — clean recursion</span><br>

<span><span class="fn-c">build</span> fib(n) {</span><br>

<span>&nbsp;&nbsp;<span class="kw2">when</span> n &lt;= <span class="num">1</span> { <span class="kw">give</span> n }</span><br>

<span>&nbsp;&nbsp;<span class="kw">give</span> fib(n-<span class="num">1</span>) + fib(n-<span class="num">2</span>)</span><br>

<span>}</span><br><br>

<span><span class="kw2">each</span> i <span class="op">in</span> <span class="num">0</span>..<span class="num">9</span> {</span><br>

<span>&nbsp;&nbsp;<span class="kw">say</span> <span class="str">f"fib({i}) = {fib(i)}"</span></span><br>

<span>}</span>`,

    out: `<span class="out-ln">fib(0) = 0</span><span class="out-ln">fib(1) = 1</span><span class="out-ln">fib(2) = 1</span><span class="out-ln">fib(3) = 2</span><span class="out-ln">fib(4) = 3</span><span class="out-ln">fib(5) = 5</span><span class="out-ln">fib(6) = 8</span><span class="out-ln">fib(7) = 13</span><span class="out-ln">fib(8) = 21</span><span class="out-ln">fib(9) = 34</span>`

  },

  crypto: {

    file: 'cryptography.txs',

    code: `<span class="cmt">// Built-in cryptography — no imports needed!</span><br>

<span><span class="kw2">make</span> msg <span class="op">be</span> <span class="str">"TechScript is awesome"</span></span><br><br>

<span class="cmt">// SHA-256 hash</span><br>

<span><span class="kw2">make</span> hash <span class="op">be</span> sha256(msg)</span><br>

<span><span class="kw">say</span> <span class="str">f"SHA-256: {hash}"</span></span><br><br>

<span class="cmt">// Base64 encode and decode</span><br>

<span><span class="kw2">make</span> encoded <span class="op">be</span> base64_encode(msg)</span><br>

<span><span class="kw">say</span> <span class="str">f"Base64: {encoded}"</span></span><br><br>

<span><span class="kw2">make</span> decoded <span class="op">be</span> base64_decode(encoded)</span><br>

<span><span class="kw">say</span> <span class="str">f"Decoded: {decoded}"</span></span>`,

    out: `<span class="out-ln">SHA-256: a3f8b2c1d4...</span><span class="out-ln">Base64: VGVjaFNjcmlwdCBpcyBhd2Vzb21l</span><span class="out-ln">Decoded: TechScript is awesome</span>`

  }

};

function showEx(key, btn) {

  const ex = EX[key]; if (!ex) return;

  document.getElementById('play-code').innerHTML = ex.code;

  document.getElementById('play-out').innerHTML = ex.out;

  document.getElementById('play-fname').textContent = ex.file;

  document.querySelectorAll('.exbtn').forEach(b => {

    b.classList.remove('active');

    b.removeAttribute('aria-current');

  });

  btn.classList.add('active');

  btn.setAttribute('aria-current', 'true');

}

showEx('hello', document.querySelector('.exbtn.active'));

// ── FAQ ACCORDION ──

function toggleFaq(btn) {

  const item = btn.closest('.faq-item');

  const answer = item.querySelector('.faq-a');

  const isOpen = item.classList.toggle('open');

  btn.setAttribute('aria-expanded', isOpen);

  answer.hidden = !isOpen;

}

// ── SCROLL REVEAL ──

if ('IntersectionObserver' in window) {

  const io = new IntersectionObserver(entries => {

    entries.forEach(e => {

      if (e.isIntersecting) {

        e.target.style.opacity = '1';

        e.target.style.transform = 'translateY(0)';

        io.unobserve(e.target);

      }

    });

  }, { threshold: 0.06, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.feat-card, .rel-card, .ccard, .faq-item, .rcard, .install-card, .steps-card').forEach(el => {

    el.style.cssText += 'opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease;';

    io.observe(el);

  });

}

// ── FIRST IMPRESSION WELCOME SCREEN & INTERACTIONS ──

// 1. Splash Screen Hide & Terminal Reveal

window.addEventListener('load', () => {

  const splash = document.getElementById('splash');

  if (splash) {

    setTimeout(() => {

      splash.classList.add('fade-out');

      // Initialize terminal animations and orb tracking once splash starts fading

      setTimeout(() => {

        splash.remove();

        initOrbFollow();

        initTerminalTyping();

        initPillsStagger();

      }, 800);

    }, 1600);

  } else {

    // Fallback if splash screen is missing

    initOrbFollow();

    initTerminalTyping();

    initPillsStagger();

  }

});

// 2. Interactive Mouse Follow Orbs

function initOrbFollow() {

  const orbs = [

    { el: document.querySelector('.orb-1'), factorX: -0.05, factorY: -0.05, currentX: 0, currentY: 0, targetX: 0, targetY: 0 },

    { el: document.querySelector('.orb-2'), factorX: 0.04, factorY: 0.04, currentX: 0, currentY: 0, targetX: 0, targetY: 0 },

    { el: document.querySelector('.orb-3'), factorX: 0.03, factorY: -0.03, currentX: 0, currentY: 0, targetX: 0, targetY: 0 }

  ];

  window.addEventListener('mousemove', (e) => {

    const mx = e.clientX - window.innerWidth / 2;

    const my = e.clientY - window.innerHeight / 2;

    

    orbs[0].targetX = mx * orbs[0].factorX;

    orbs[0].targetY = my * orbs[0].factorY;

    

    orbs[1].targetX = mx * orbs[1].factorX;

    orbs[1].targetY = my * orbs[1].factorY;

    

    orbs[2].targetX = mx * orbs[2].factorX;

    orbs[2].targetY = my * orbs[2].factorY;

  });

  function animateOrbs() {

    orbs.forEach(orb => {

      if (!orb.el) return;

      // Linear interpolation (Lerp) for ultra-smooth movement lag

      orb.currentX += (orb.targetX - orb.currentX) * 0.05;

      orb.currentY += (orb.targetY - orb.currentY) * 0.05;

      orb.el.style.transform = `translate(${orb.currentX}px, ${orb.currentY}px)`;

    });

    requestAnimationFrame(animateOrbs);

  }

  animateOrbs();

}

// 3. Staggered Terminal Line Reveal Animation

function initTerminalTyping() {

  const lines = document.querySelectorAll('.terminal .tbody > span');

  lines.forEach((line, idx) => {

    line.style.opacity = '0';

    line.style.transform = 'translateY(6px)';

    line.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    

    setTimeout(() => {

      line.style.opacity = '1';

      line.style.transform = 'translateY(0)';

    }, idx * 150);

  });

}

// 4. Stagger reveal hero pills

function initPillsStagger() {

  const pills = document.querySelectorAll('.kw-pills span');

  pills.forEach((pill, idx) => {

    pill.style.opacity = '0';

    pill.style.transform = 'scale(0.8) translateY(6px)';

    pill.style.transition = 'opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    

    setTimeout(() => {

      pill.style.opacity = '1';

      pill.style.transform = 'scale(1) translateY(0)';

    }, idx * 100);

  });

}

