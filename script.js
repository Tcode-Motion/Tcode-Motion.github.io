/* ==========================================================================
   TechScript Official Website Dynamic Script Engine
   Features:
   - Dynamic GitHub Releases API Fetching & Assets Parsing
   - Version Switcher & Universal Dynamic Version Binding
   - Global Search Command Palette (Ctrl+K)
   - Interactive Code Playground (Run, Copy, Reset, Share) with Simulated VM Output
   - Documentation Portal with Interactive Sidebar Navigation (16 Guides)
   - Dynamic GitHub Contributors Grid & Changelog Timeline
   - Theme Toggle, FAQ Accordion, Terminal Typing Animation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initVersionSwitcher();
  initGitHubApiData();
  initTerminalTyping();
  initPlayground();
  initDocsPortal();
  initFaqAccordion();
  initCopyButtons();
  initScrollManager();
  initMobileNav();
  initSearchPalette();
  
  // Enforce Dark Mode by default
  localStorage.removeItem('theme');
  document.body.classList.remove('light-theme');
});

/* ── REPOSITORY FALLBACK METADATA (Source of Truth) ── */
const REPO_FALLBACK = {
  version: '2.0.0',
  tag: 'v2.0.0',
  date: 'July 2026',
  stars: 120,
  issues: 4,
  winInstaller: 'https://github.com/Tcode-Motion/techscript/releases/latest',
  winPortable: 'https://github.com/Tcode-Motion/techscript/releases/latest',
  sourceZip: 'https://github.com/Tcode-Motion/techscript/archive/refs/heads/main.zip',
  sourceTar: 'https://github.com/Tcode-Motion/techscript/archive/refs/heads/main.tar.gz'
};

/* ── VERSION SWITCHER ── */
function initVersionSwitcher() {
  const versionBtn = document.getElementById('versionBtn');
  const versionDropdown = document.getElementById('versionDropdown');

  if (versionBtn && versionDropdown) {
    versionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = versionDropdown.hasAttribute('hidden');
      if (isHidden) {
        versionDropdown.removeAttribute('hidden');
        versionBtn.setAttribute('aria-expanded', 'true');
      } else {
        versionDropdown.setAttribute('hidden', '');
        versionBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', () => {
      versionDropdown.setAttribute('hidden', '');
      versionBtn.setAttribute('aria-expanded', 'false');
    });
  }
}

/* ── GITHUB RELEASES & REPO DATA ENGINE ── */
async function initGitHubApiData() {
  try {
    // 1. Fetch Latest Release
    const releaseRes = await fetch('https://api.github.com/repos/Tcode-Motion/techscript/releases/latest');
    if (releaseRes.ok) {
      const relData = await releaseRes.json();
      applyReleaseData(relData);
    } else {
      applyReleaseFallback();
    }
  } catch (err) {
    console.warn('GitHub Releases API offline or rate-limited. Applying fallback metadata.', err);
    applyReleaseFallback();
  }

  try {
    // 2. Fetch Repo Metadata (Stars, Issues)
    const repoRes = await fetch('https://api.github.com/repos/Tcode-Motion/techscript');
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      updateElementText('navStarCount', formatCount(repoData.stargazers_count));
      updateElementText('statStars', formatCount(repoData.stargazers_count));
      updateElementText('statIssues', formatCount(repoData.open_issues_count));
    }
  } catch (err) {
    updateElementText('navStarCount', '★');
    updateElementText('statStars', REPO_FALLBACK.stars.toString());
    updateElementText('statIssues', REPO_FALLBACK.issues.toString());
  }

  try {
    // 3. Fetch Contributors
    const contribRes = await fetch('https://api.github.com/repos/Tcode-Motion/techscript/contributors?per_page=12');
    if (contribRes.ok) {
      const contribs = await contribRes.json();
      renderContributors(contribs);
    } else {
      renderContributorsFallback();
    }
  } catch (err) {
    renderContributorsFallback();
  }

  try {
    // 4. Fetch All Releases for Timeline
    const allReleasesRes = await fetch('https://api.github.com/repos/Tcode-Motion/techscript/releases');
    if (allReleasesRes.ok) {
      const releasesList = await allReleasesRes.json();
      renderChangelogTimeline(releasesList);
    } else {
      renderChangelogFallback();
    }
  } catch (err) {
    renderChangelogFallback();
  }
}

function applyReleaseData(data) {
  const tag = data.tag_name || REPO_FALLBACK.tag;
  const ver = tag.replace(/^v/, '');
  const pubDate = new Date(data.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Update badges & text
  updateElementText('heroReleaseBadge', `Latest Release: ${tag} (${pubDate})`);
  updateElementText('btnReleaseVer', tag);
  updateElementText('statVer', tag);
  updateElementText('dlVersionTag', tag);
  updateElementText('dlReleaseDate', pubDate);
  updateElementText('dropLatestVer', `${tag} (GitHub Release)`);
  updateElementText('navVersionTag', tag);
  updateElementText('footerVerTag', tag);

  // Assets matching
  const assets = data.assets || [];
  let winExeAsset = assets.find(a => a.name.endsWith('.exe')) || { browser_download_url: data.html_url, name: 'TechScript_Setup.exe' };
  let winZipAsset = assets.find(a => a.name.endsWith('.zip') && a.name.toLowerCase().includes('portable')) || { browser_download_url: data.html_url, name: 'TechScript_Portable.zip' };

  const winInstallerBtn = document.getElementById('btnWinInstaller');
  const winPortableBtn = document.getElementById('btnWinPortable');
  const winAssetLabel = document.getElementById('winAssetLabel');

  if (winInstallerBtn) winInstallerBtn.href = winExeAsset.browser_download_url;
  if (winPortableBtn) winPortableBtn.href = winZipAsset.browser_download_url;
  if (winAssetLabel) winAssetLabel.textContent = winExeAsset.name;

  const btnSourceZip = document.getElementById('btnSourceZip');
  const btnSourceTar = document.getElementById('btnSourceTar');
  if (btnSourceZip && data.zipball_url) btnSourceZip.href = data.zipball_url;
  if (btnSourceTar && data.tarball_url) btnSourceTar.href = data.tarball_url;
}

function applyReleaseFallback() {
  updateElementText('heroReleaseBadge', `Latest Stable Release: ${REPO_FALLBACK.tag}`);
  updateElementText('btnReleaseVer', REPO_FALLBACK.tag);
  updateElementText('statVer', REPO_FALLBACK.tag);
  updateElementText('dlVersionTag', REPO_FALLBACK.tag);
  updateElementText('dlReleaseDate', REPO_FALLBACK.date);
  updateElementText('dropLatestVer', `${REPO_FALLBACK.tag} (Latest)`);
  updateElementText('navVersionTag', REPO_FALLBACK.tag);
  updateElementText('footerVerTag', REPO_FALLBACK.tag);
}

function renderContributors(list) {
  const container = document.getElementById('contributorsList');
  if (!container) return;

  if (!list || list.length === 0) {
    renderContributorsFallback();
    return;
  }

  container.innerHTML = list.map(c => `
    <a href="${c.html_url}" target="_blank" rel="noopener noreferrer" class="contrib-card" role="listitem">
      <img src="${c.avatar_url}" alt="${c.login} avatar" class="contrib-img" loading="lazy" decoding="async">
      <div>
        <span class="contrib-name">${c.login}</span>
        <span class="contrib-role">${c.contributions} contributions</span>
      </div>
    </a>
  `).join('');
}

function renderContributorsFallback() {
  const container = document.getElementById('contributorsList');
  if (!container) return;

  container.innerHTML = `
    <a href="https://github.com/Tcode-Motion" target="_blank" rel="noopener noreferrer" class="contrib-card" role="listitem">
      <img src="assets/branding/logo-package/source/logo-master-transparent.png" alt="Tanmoy Majumder" class="contrib-img">
      <div>
        <span class="contrib-name">Tanmoy Majumder</span>
        <span class="contrib-role">Lead Architect (@Tcode-Motion)</span>
      </div>
    </a>
    <a href="https://github.com/Tcode-Motion/techscript/graphs/contributors" target="_blank" rel="noopener noreferrer" class="contrib-card" role="listitem">
      <div class="contrib-img" style="display:flex;align-items:center;justify-content:center;background:var(--accent-gradient);color:#000;font-weight:bold;">+</div>
      <div>
        <span class="contrib-name">Community Contributors</span>
        <span class="contrib-role">View all on GitHub ↗</span>
      </div>
    </a>
  `;
}

function renderChangelogTimeline(releases) {
  const container = document.getElementById('releaseChangelogList');
  if (!container) return;

  if (!releases || releases.length === 0) {
    renderChangelogFallback();
    return;
  }

  container.innerHTML = releases.map((r, i) => {
    const isLatest = i === 0;
    const dateStr = new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Strip HTML comments, tags, and markdown formatting
    let rawText = stripMarkdownAndHtml(r.body);
    if (!rawText || rawText.length < 5) {
      rawText = 'Official TechScript release details, installation packages, and binary assets available on GitHub.';
    }
    const cleanBody = escapeHtml(rawText.substring(0, 220)) + (rawText.length > 220 ? '...' : '');
    const releaseTitle = escapeHtml(stripMarkdownAndHtml(r.name || r.tag_name));

    return `
      <div class="rel-card ${isLatest ? 'latest' : ''}" role="listitem">
        <div class="rel-hdr-top">
          <span class="rel-ver">${r.tag_name}</span>
          <span class="rel-badge" style="${isLatest ? '' : 'color:var(--text-secondary);border-color:var(--border-primary);background:none;'}">
            ${isLatest ? 'Latest Release' : 'Stable'}
          </span>
          <span class="rel-date">${dateStr}</span>
        </div>
        <h4 style="margin: 0.5rem 0 0.25rem 0; font-size:1.05rem; color:var(--text-primary);">${releaseTitle}</h4>
        <p class="rel-desc">${cleanBody}</p>
        <div class="rel-footer-links">
          <a href="${r.html_url}" target="_blank" rel="noopener noreferrer" class="rel-dl">View Release Notes &amp; Assets ↗</a>
        </div>
      </div>
    `;
  }).join('');
}

function renderChangelogFallback() {
  const container = document.getElementById('releaseChangelogList');
  if (!container) return;

  container.innerHTML = `
    <div class="rel-card latest" role="listitem">
      <div class="rel-hdr-top">
        <span class="rel-ver">v2.0.0</span>
        <span class="rel-badge">Latest Release</span>
        <span class="rel-date">July 2026</span>
      </div>
      <h4 style="margin: 0.5rem 0 0.25rem 0; font-size:1.05rem;">TechScript 2.0 — Zero Syntax Clutter Release</h4>
      <p class="rel-desc">Complete overhaul introducing Pratt expression parser, custom Rust stack VM with NaN-boxed values, LLVM backend crate, single toolchain driver (tsc), and native AI stdlib module.</p>
      <div class="rel-footer-links">
        <a href="https://github.com/Tcode-Motion/techscript/releases" target="_blank" rel="noopener noreferrer" class="rel-dl">View Release Notes on GitHub ↗</a>
      </div>
    </div>
  `;
}

/* ── TERMINAL TYPING SIMULATION ── */
function initTerminalTyping() {
  const terminalOutput = document.getElementById('terminalOutput');
  if (!terminalOutput) return;

  const lines = [
    { text: '$ tsc run welcome.txs', cls: 'cmd' },
    { text: '[tsc] Tokenizing source file with Logos Lexer...', cls: 'dim' },
    { text: '[tsc] Parsing AST with Pratt Expression Engine...', cls: 'dim' },
    { text: '[tsc] Compiling bytecode for Stack VM target...', cls: 'dim' },
    { text: 'Hello, World! 🌍', cls: 'out-green' },
    { text: 'TechScript reads like plain English. Zero clutter!', cls: 'out-white' },
    { text: '[VM Execution Completed in 0.42ms — Exit Code: 0]', cls: 'dim-green' }
  ];

  let lineIdx = 0;
  terminalOutput.innerHTML = '';

  function printNextLine() {
    if (lineIdx < lines.length) {
      const item = lines[lineIdx];
      const p = document.createElement('div');
      p.className = `tline ${item.cls}`;
      p.textContent = item.text;
      terminalOutput.appendChild(p);
      lineIdx++;
      setTimeout(printNextLine, 280);
    }
  }

  printNextLine();
}

/* ── INTERACTIVE PLAYGROUND SNIPPETS & EXECUTION ENGINE ── */
const PLAYGROUND_DATA = {
  hello: {
    fname: 'hello.txs',
    code: `# TechScript 2.0 - Hello World Example
say "Hello, World! 🌍"
say "TechScript reads like plain English. Zero symbols, zero clutter!"
`,
    stdout: `Hello, World! 🌍
TechScript reads like plain English. Zero symbols, zero clutter!
[VM Output — Completed in 0.31ms — Exit Code: 0]`
  },
  vars: {
    fname: 'variables.txs',
    code: `# Variable assignment & constant definitions
x = 10
y = 20
name = "Dragon"

# 'const' creates immutable bindings
const MAX_HEALTH = 100
const PI = 3.14159

say "Player: " + name
say "Total Score: " + (x + y)
say "Max Health: " + MAX_HEALTH
`,
    stdout: `Player: Dragon
Total Score: 30
Max Health: 100
[VM Output — Completed in 0.28ms — Exit Code: 0]`
  },
  cond: {
    fname: 'conditions.txs',
    code: `# Conditionals with when / else / end
score = 88

when score >= 90
  say "Grade: Excellent! 🏆"
else
  when score >= 75
    say "Grade: Good Job! 👍"
  else
    say "Grade: Keep Practicing! 💪"
  end
end
`,
    stdout: `Grade: Good Job! 👍
[VM Output — Completed in 0.35ms — Exit Code: 0]`
  },
  loops: {
    fname: 'loops.txs',
    code: `# Iterating over collections with 'for' loops
items = ["Rust", "TechScript", "LLVM", "Compiler"]

for tech in items
  say "Learning: " + tech
end

# Range iteration
for i in 0..3
  say "Step index: " + i
end
`,
    stdout: `Learning: Rust
Learning: TechScript
Learning: LLVM
Learning: Compiler
Step index: 0
Step index: 1
Step index: 2
[VM Output — Completed in 0.40ms — Exit Code: 0]`
  },
  funcs: {
    fname: 'functions.txs',
    code: `# Declaring functions with 'do' and returning values with 'send'
do multiply(a, b)
  send a * b
end

do greet(username)
  send "Welcome back, " + username + "!"
end

result = multiply(6, 7)
say "6 x 7 = " + result
say greet("Tanmoy")
`,
    stdout: `6 x 7 = 42
Welcome back, Tanmoy!
[VM Output — Completed in 0.33ms — Exit Code: 0]`
  },
  ai: {
    fname: 'prompt_ai.txs',
    code: `# Native AI integration with Gemini model
use ai

do generate_code_explanation(prompt)
  response = ai.prompt("Explain this code in 1 sentence: " + prompt)
  send response
end

output = generate_code_explanation("tsc run script.txs")
say "AI Explanation: " + output
`,
    stdout: `[AI Module] Initializing Gemini client context...
AI Explanation: The tsc run command compiles the specified TechScript file into VM bytecode and executes it immediately.
[VM Output — Completed in 142.10ms — Exit Code: 0]`
  },
  canvas: {
    fname: 'graphics.txs',
    code: `# 2D Vector Canvas Drawing Engine
use canvas

ctx = canvas.create(800, 600, "TechScript 2D Viewport")
ctx.clear("#0a0a0f")

# Draw glowing rectangle & text
ctx.draw_rect(100, 100, 300, 200, "#0DF28B")
ctx.draw_text("TechScript Canvas", 120, 150, "#FFFFFF", 24)
ctx.render()
say "Viewport rendered successfully!"
`,
    stdout: `[Canvas] Created 800x600 window buffer 'TechScript 2D Viewport'
Viewport rendered successfully!
[VM Output — Completed in 8.45ms — Exit Code: 0]`
  },
  db: {
    fname: 'database.txs',
    code: `# Native SQLite database connector
use sqlite

db = sqlite.connect("app.db")
db.execute("CREATE TABLE IF NOT EXISTS users (id INT, name TEXT)")
db.execute("INSERT INTO users VALUES (1, 'Tanmoy')")

rows = db.query("SELECT * FROM users")
for user in rows
  say "User: " + user.name
end
`,
    stdout: `[SQLite] Opened database app.db
User: Tanmoy
[VM Output — Completed in 2.15ms — Exit Code: 0]`
  },
  async: {
    fname: 'async_task.txs',
    code: `# Concurrent Event Loop with async / await
do async fetch_data(source)
  say "Fetching from " + source + "..."
  await time.sleep(100)
  send "Data packet from " + source
end

say "Starting background tasks..."
res = await fetch_data("https://api.github.com")
say "Received: " + res
`,
    stdout: `Starting background tasks...
Fetching from https://api.github.com...
Received: Data packet from https://api.github.com
[VM Output — Completed in 102.10ms — Exit Code: 0]`
  },
  threads: {
    fname: 'threads.txs',
    code: `# Spawning OS threads via native thread module
use thread

t1 = thread.spawn(do ()
  say "Thread 1 running parallel computation..."
end)

t2 = thread.spawn(do ()
  say "Thread 2 executing task..."
end)

t1.join()
t2.join()
say "All OS threads joined safely."
`,
    stdout: `Thread 1 running parallel computation...
Thread 2 executing task...
All OS threads joined safely.
[VM Output — Completed in 1.85ms — Exit Code: 0]`
  },
  errors: {
    fname: 'error_handling.txs',
    code: `# Exception handling with try / catch / end
do divide(a, b)
  when b == 0
    throw "Division by zero exception!"
  end
  send a / b
end

try
  val = divide(10, 0)
catch err
  say "Caught exception safely: " + err
end

say "Program execution continued normally."
`,
    stdout: `Caught exception safely: Division by zero exception!
Program execution continued normally.
[VM Output — Completed in 0.32ms — Exit Code: 0]`
  }
};

let currentExampleKey = 'hello';

function initPlayground() {
  const playEditor = document.getElementById('playEditor');
  const playStdout = document.getElementById('playStdout');
  const playFname = document.getElementById('playFname');
  const exButtons = document.querySelectorAll('.play-sidebar .exbtn');

  if (!playEditor || !playStdout) return;

  // Load default snippet
  loadExample('hello');

  // Category switching
  exButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      exButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.getAttribute('data-example');
      loadExample(key);
    });
  });

  // Run Button
  const btnRun = document.getElementById('btnRunCode');
  if (btnRun) {
    btnRun.addEventListener('click', () => {
      runSimulatedVmCode();
    });
  }

  // Copy Button
  const btnCopy = document.getElementById('btnCopyCode');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      copyToClipboard(playEditor.value);
      showToast('Code copied to clipboard!');
    });
  }

  // Reset Button
  const btnReset = document.getElementById('btnResetCode');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      loadExample(currentExampleKey);
      showToast('Code snippet reset to default!');
    });
  }

  // Share Button
  const btnShare = document.getElementById('btnShareCode');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.hash = `playground-${currentExampleKey}`;
      copyToClipboard(url.toString());
      showToast('Shareable link copied to clipboard!');
    });
  }
}

function loadExample(key) {
  const data = PLAYGROUND_DATA[key] || PLAYGROUND_DATA.hello;
  currentExampleKey = key;

  const playEditor = document.getElementById('playEditor');
  const playStdout = document.getElementById('playStdout');
  const playFname = document.getElementById('playFname');

  if (playEditor) playEditor.value = data.code;
  if (playStdout) playStdout.textContent = data.stdout;
  if (playFname) playFname.textContent = data.fname;
}

function runSimulatedVmCode() {
  const playEditor = document.getElementById('playEditor');
  const playStdout = document.getElementById('playStdout');
  if (!playEditor || !playStdout) return;

  const userCode = playEditor.value;
  const startTime = performance.now();

  playStdout.textContent = '[tsc] Compiling user code to bytecode VM target...\nExecuting bytecode...';

  setTimeout(() => {
    const elapsed = (performance.now() - startTime).toFixed(2);
    let outputLines = [];

    // Simple line evaluator for 'say' commands in user custom code
    const codeLines = userCode.split('\n');
    codeLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('say ')) {
        let content = trimmed.substring(4).trim();
        content = content.replace(/^["']|["']$/g, '');
        outputLines.push(content);
      }
    });

    if (outputLines.length === 0) {
      const data = PLAYGROUND_DATA[currentExampleKey];
      outputLines.push(data ? data.stdout : 'Program executed cleanly with no stdout.');
    } else {
      outputLines.push(`[VM Output — Executed in ${elapsed}ms — Exit Code: 0]`);
    }

    playStdout.textContent = outputLines.join('\n');
  }, 220);
}

/* ── DOCUMENTATION PORTAL WITH SIDEBAR NAVIGATION (16 GUIDES) ── */
const DOCS_DATABASE = {
  'getting-started': {
    title: 'Quick Start Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/README.md',
    summary: 'Write and run your first TechScript program in under 10 seconds.',
    body: `
### Quick Start with TechScript 2.0

TechScript is designed to eliminate syntax clutter. You can run scripts instantly using the unified \`tsc\` compiler driver.

#### 1. Create a script file:
Create a file named \`hello.txs\`:
\`\`\`txs
say "Hello, World! 🌍"
say "TechScript reads like plain English."
\`\`\`

#### 2. Run the script:
\`\`\`bash
tsc run hello.txs
\`\`\`

#### 3. Output:
\`\`\`text
Hello, World! 🌍
TechScript reads like plain English.
\`\`\`
`
  },
  'installation': {
    title: 'Installation Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/Installation.md',
    summary: 'Detailed installation options for Windows, Linux, macOS, and Android (Termux).',
    body: `
### Installation Methods

#### Windows Setup (Recommended)
Download \`TechScript_Setup.exe\` from GitHub Releases. The setup configures your system \`PATH\` and file associations automatically.

#### Linux / macOS Shell Script
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/Tcode-Motion/techscript/main/scripts/install.sh | bash
\`\`\`

#### PyPI Python Package
\`\`\`bash
pip install techscript
\`\`\`

#### Android (Termux)
\`\`\`bash
pkg update && pkg install curl
curl -fsSL https://raw.githubusercontent.com/Tcode-Motion/techscript/main/scripts/install.sh | bash
\`\`\`
`
  },
  'syntax': {
    title: 'Syntax Guide & Keywords',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/SyntaxGuide.md',
    summary: 'Cheatsheet for TechScript plain English statements, conditionals, and loops.',
    body: `
### Syntax Cheatsheet

| Feature | TechScript 2.0 Syntax |
|---|---|
| **Variable** | \`x = 10\` |
| **Constant** | \`const PI = 3.14159\` |
| **Print** | \`say "Hello"\` |
| **Function** | \`do greet(name)\` ... \`send "Hi " + name\` ... \`end\` |
| **Condition** | \`when x > 5\` ... \`say "Big"\` ... \`else\` ... \`say "Small"\` ... \`end\` |
| **For Loop** | \`for x in list\` ... \`say x\` ... \`end\` |
| **Try / Catch** | \`try\` ... \`catch error\` ... \`say error\` ... \`end\` |
`
  },
  'language': {
    title: 'Language Specification Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/LanguageGuide.md',
    summary: 'Full language specifications for lexical scope, types, and functions.',
    body: `
### Language Specification

TechScript features dynamic typing with static scope checking during Pratt parsing phase.

- **Variables**: Dynamically bound without variable declaration keywords.
- **Functions**: Declared with \`do name(args)\` and concluded with \`end\`.
- **Return Values**: Passed back to callers via the \`send\` keyword.
- **Comments**: Single-line comments start with \`#\`.
`
  },
  'cli': {
    title: 'CLI Commands Reference (tsc)',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/APIReference.md',
    summary: 'Unified toolchain subcommands for the tsc compiler driver.',
    body: `
### Unified \`tsc\` Compiler Driver

All toolchain actions are run via the \`tsc\` executable:

\`\`\`bash
tsc run main.txs        # Compiles and executes a script
tsc build              # Builds project matching package.toml
tsc check              # Checks workspace for compile errors
tsc fmt                # Formats codebase with tsfmt
tsc lint               # Evaluates safety traps and lints
tsc test               # Locates and executes unit tests
tsc repl               # Launches interactive shell REPL
tsc dump-ast file.txs  # Outputs AST representation
tsc emit-llvm file.txs # Generates LLVM IR native target
\`\`\`
`
  },
  'compiler': {
    title: 'Compiler Architecture',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/CompilerArchitecture.md',
    summary: 'Pipeline description from Logos lexer to Rust Stack VM and LLVM backend.',
    body: `
### Compiler Pipeline Architecture

1. **Logos Lexer**: Tokenizes plain-English source files.
2. **Pratt Expression Parser**: Builds the Abstract Syntax Tree (AST).
3. **Semantic Audit**: Validates symbol scopes.
4. **AST Optimizer**: Performs compile-time constant folding.
5. **Bytecode / LLVM Targets**: Compiles into bytecode for the Rust Stack VM (with NaN-boxed values & tracing GC) or LLVM native executables.
`
  },
  'stdlib': {
    title: 'Standard Library Reference',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/StdlibReference.md',
    summary: 'Reference list for all 11 native stdlib modules.',
    body: `
### Standard Library Modules

- \`math\`: Square root, trigonometry, log, and basic math.
- \`collections\`: List manipulation, map keys, filtering.
- \`file\`: File reading, writing, appending, removing.
- \`json\`: Encoding maps to JSON strings and decoding.
- \`http\`: HTTP client GET & POST requests.
- \`sqlite\`: Local relational database connector.
- \`canvas\`: 2D vector viewport rendering.
- \`time\`: Clock timing and thread sleep.
- \`thread\`: Native OS thread spawner and join interfaces.
- \`ai\`: Gemini model prompt & text generation interface.
- \`testing\`: Assertion macros for test suites.
`
  },
  'canvas': {
    title: '2D Canvas Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/CanvasGuide.md',
    summary: 'Creating graphics viewports, drawing rects, circles, and rendering frames.',
    body: `
### 2D Graphics Canvas

\`\`\`txs
use canvas

ctx = canvas.create(800, 600, "Window")
ctx.clear("#0a0a0f")
ctx.draw_rect(100, 100, 300, 200, "#0DF28B")
ctx.render()
\`\`\`
`
  },
  'api': {
    title: 'Compiler API Reference',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/APIReference.md',
    summary: 'In-depth compiler API design specifications.',
    body: `Read full [API Reference specification on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/APIReference.md).`
  },
  'performance': {
    title: 'Performance Reference',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/Performance.md',
    summary: 'VM execution benchmarks and compile flag details.',
    body: `Read full [Performance & Benchmarks Reference on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/Performance.md).`
  },
  'best-practices': {
    title: 'Best Practices',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/BestPractices.md',
    summary: 'Coding layout standards and memory conventions.',
    body: `Read full [Best Practices Guide on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/BestPractices.md).`
  },
  'dsl': {
    title: 'DSL Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/DSLGuide.md',
    summary: 'Designing Domain-Specific layout submodules.',
    body: `Read full [DSL Design Guide on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/DSLGuide.md).`
  },
  'web': {
    title: 'Web Builder Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/WebGuide.md',
    summary: 'Native website compile-generation parameters.',
    body: `Read full [Web Engine Guide on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/WebGuide.md).`
  },
  'examples': {
    title: 'Examples Guide',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/ExamplesGuide.md',
    summary: 'Standard running process for bundled projects in examples/ folder.',
    body: `Read full [Examples Guide on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/ExamplesGuide.md).`
  },
  'faq': {
    title: 'FAQ Reference',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/FAQ.md',
    summary: 'Common troubleshooting and engine setup questions.',
    body: `Read full [FAQ Reference on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/FAQ.md).`
  },
  'migration': {
    title: 'Migration Guide (v1.x to v2.0)',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/MigrationGuide.md',
    summary: 'Migrating legacy scripts to TechScript 2.0 syntax.',
    body: `
### Migration Guide (v1.x -> v2.0)

Use \`tsc migrate\` command to translate legacy scripts automatically:

\`\`\`bash
tsc migrate legacy_script.txs
\`\`\`

- \`make x be 10\` ➔ \`x = 10\`
- \`give x\` ➔ \`send x\`
- \`build foo()\` ➔ \`do foo()\`
`
  },
  'releasenotes': {
    title: 'Release Notes',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/ReleaseNotes.md',
    summary: 'Historical logs of compiled target stable versions.',
    body: `Read full [Release Notes on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/ReleaseNotes.md).`
  },
  'roadmap': {
    title: 'Roadmap',
    repoLink: 'https://github.com/Tcode-Motion/techscript/blob/main/docs/Roadmap.md',
    summary: 'Language development milestones.',
    body: `Read full [Roadmap Document on GitHub](https://github.com/Tcode-Motion/techscript/blob/main/docs/Roadmap.md).`
  }
};

function initDocsPortal() {
  const panel = document.getElementById('docsContentPanel');
  const navItems = document.querySelectorAll('.docs-nav-item');

  if (!panel) return;

  // Render initial doc
  renderDoc('getting-started');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const docKey = item.getAttribute('data-doc');
      renderDoc(docKey);
    });
  });

  // Footer / link click delegation for docs
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.doc-link-btn');
    if (btn) {
      const docKey = btn.getAttribute('data-doc');
      if (docKey) {
        navItems.forEach(n => {
          if (n.getAttribute('data-doc') === docKey) n.classList.add('active');
          else n.classList.remove('active');
        });
        renderDoc(docKey);
      }
    }
  });
}

function renderDoc(key) {
  const panel = document.getElementById('docsContentPanel');
  if (!panel) return;

  const doc = DOCS_DATABASE[key] || DOCS_DATABASE['getting-started'];

  panel.innerHTML = `
    <div class="doc-header">
      <h2 class="doc-title">${doc.title}</h2>
      <p class="doc-summary">${doc.summary}</p>
      <a href="${doc.repoLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px; margin-top: 0.5rem;">
        View Raw Source Document on GitHub ↗
      </a>
    </div>
    <div class="doc-body">
      ${formatMarkdown(doc.body)}
    </div>
  `;
}

function formatMarkdown(md) {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/\`\`\`txs([\s\S]*?)\`\`\`/gim, '<pre class="doc-code"><code class="txs-highlight">$1</code></pre>')
    .replace(/\`\`\`bash([\s\S]*?)\`\`\`/gim, '<pre class="doc-code"><code>$1</code></pre>')
    .replace(/\`\`\`text([\s\S]*?)\`\`\`/gim, '<pre class="doc-code"><code>$1</code></pre>')
    .replace(/\`\`\`([\s\S]*?)\`\`\`/gim, '<pre class="doc-code"><code>$1</code></pre>')
    .replace(/\`([^\`]+)\`/g, '<code class="doc-inline-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/* ── FAQ ACCORDION ── */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-q');

  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const ans = item.querySelector('.faq-a');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        ans.setAttribute('hidden', '');
        item.classList.remove('open');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        ans.removeAttribute('hidden');
        item.classList.add('open');
      }
    });
  });
}

/* ── COPY BUTTONS DELEGATION ── */
function initCopyButtons() {
  document.body.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-btn[data-copy]');
    if (copyBtn) {
      const textToCopy = copyBtn.getAttribute('data-copy');
      if (textToCopy) {
        copyToClipboard(textToCopy);
        const origText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = origText;
        }, 1800);
      }
    }
  });
}

/* ── GLOBAL COMMAND PALETTE SEARCH MODAL (Ctrl+K) ── */
const SEARCH_INDEX = [
  // Docs
  { title: 'Quick Start Guide', category: 'Documentation', desc: 'Write and run your first script in 10 seconds', link: '#docs', docKey: 'getting-started' },
  { title: 'Installation Guide', category: 'Documentation', desc: 'Install TechScript on Windows, Linux, macOS, Android', link: '#docs', docKey: 'installation' },
  { title: 'Syntax Guide & Keywords', category: 'Documentation', desc: 'Variables, functions, loops, conditions', link: '#docs', docKey: 'syntax' },
  { title: 'CLI Commands (tsc)', category: 'Documentation', desc: 'tsc run, build, check, fmt, lint, test, repl', link: '#docs', docKey: 'cli' },
  { title: 'Standard Library Reference', category: 'Documentation', desc: '11 core modules: math, file, json, http, sqlite, ai, canvas', link: '#docs', docKey: 'stdlib' },
  { title: 'Compiler Architecture', category: 'Documentation', desc: 'Logos Lexer, Pratt Parser, Rust Stack VM & LLVM', link: '#docs', docKey: 'compiler' },

  // CLI Commands
  { title: 'tsc run <file.txs>', category: 'CLI Command', desc: 'Compiles and executes a single TechScript script', link: '#docs', docKey: 'cli' },
  { title: 'tsc build', category: 'CLI Command', desc: 'Builds workspace project matching package.toml', link: '#docs', docKey: 'cli' },
  { title: 'tsc test', category: 'CLI Command', desc: 'Executes unit test suite assertions', link: '#docs', docKey: 'cli' },
  { title: 'tsc fmt', category: 'CLI Command', desc: 'Standardizes codebase layout with tsfmt', link: '#docs', docKey: 'cli' },
  { title: 'tsc lint', category: 'CLI Command', desc: 'Evaluates safety traps and warns on deprecated patterns', link: '#docs', docKey: 'cli' },

  // Examples
  { title: 'Hello World Example', category: 'Examples', desc: 'Simple say "Hello, World!" print statement', link: '#playground', exKey: 'hello' },
  { title: 'AI Prompting (use ai)', category: 'Examples', desc: 'Prompting Gemini AI model natively via stdlib', link: '#playground', exKey: 'ai' },
  { title: '2D Graphics Canvas', category: 'Examples', desc: 'Drawing vector shapes and text inside a viewport', link: '#playground', exKey: 'canvas' },
  { title: 'SQLite Database', category: 'Examples', desc: 'Executing SQL queries and inserting rows', link: '#playground', exKey: 'db' },
  { title: 'Async & Await Event Loop', category: 'Examples', desc: 'Non-blocking event loop tasks', link: '#playground', exKey: 'async' }
];

function initSearchPalette() {
  const trigger = document.getElementById('searchTrigger');
  const modal = document.getElementById('searchModal');
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');

  if (!modal || !input) return;

  function openSearch() {
    modal.showModal();
    input.value = '';
    renderSearchResults('');
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    modal.close();
  }

  if (trigger) trigger.addEventListener('click', openSearch);

  // Keyboard shortcut Ctrl+K or Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal.open) closeSearch();
      else openSearch();
    }
  });

  input.addEventListener('input', (e) => {
    renderSearchResults(e.target.value.trim().toLowerCase());
  });

  // Backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });
}

function renderSearchResults(query) {
  const results = document.getElementById('searchResults');
  if (!results) return;

  const filtered = SEARCH_INDEX.filter(item => 
    !query || 
    item.title.toLowerCase().includes(query) || 
    item.desc.toLowerCase().includes(query) || 
    item.category.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    results.innerHTML = `<div class="search-empty">No results found matching "${escapeHtml(query)}"</div>`;
    return;
  }

  results.innerHTML = filtered.map(item => `
    <div class="search-res-item" tabIndex="0" data-link="${item.link}" data-dockey="${item.docKey || ''}" data-exkey="${item.exKey || ''}">
      <div class="s-title">${escapeHtml(item.title)} <span class="s-cat">${escapeHtml(item.category)}</span></div>
      <div class="s-desc">${escapeHtml(item.desc)}</div>
    </div>
  `).join('');

  results.querySelectorAll('.search-res-item').forEach(el => {
    el.addEventListener('click', () => {
      const link = el.getAttribute('data-link');
      const docKey = el.getAttribute('data-dockey');
      const exKey = el.getAttribute('data-exkey');
      const modal = document.getElementById('searchModal');
      if (modal) modal.close();

      if (docKey) {
        const navItem = document.querySelector(`.docs-nav-item[data-doc="${docKey}"]`);
        if (navItem) navItem.click();
      } else if (exKey) {
        const exBtn = document.querySelector(`.play-sidebar .exbtn[data-example="${exKey}"]`);
        if (exBtn) exBtn.click();
      }

      if (link) window.location.href = link;
    });
  });
}

/* ── SCROLLSPY & NAVBAR ── */
function initScrollManager() {
  let scrollScheduled = false;
  const mainNav = document.getElementById('mainNav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const subNavPills = document.querySelectorAll('.sub-nav-pill');

  window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(() => {
        if (mainNav) {
          mainNav.classList.toggle('scrolled', window.scrollY > 40);
        }

        let current = '';
        const scrollPosition = window.scrollY + 140;

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

        subNavPills.forEach(pill => {
          const href = pill.getAttribute('href');
          if (href && href.startsWith('#')) {
            if (href === '#' + current) {
              pill.classList.add('active');
            } else {
              pill.classList.remove('active');
            }
          }
        });

        scrollScheduled = false;
      });
    }
  }, { passive: true });
}

/* ── MOBILE NAV ── */
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



/* ── HELPERS & UTILITIES ── */
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {}
    document.body.removeChild(ta);
  }
}

function showToast(msg) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'toast-box';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function updateElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatCount(num) {
  if (typeof num !== 'number') return num;
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripMarkdownAndHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/<!--[\s\S]*?-->/g, '')        // Remove HTML comments <!-- ... -->
    .replace(/<[^>]*>/g, '')                 // Remove HTML tags <p>, <div>, <img>, etc.
    .replace(/#+\s+/g, '')                   // Remove Markdown headers #, ##, ###
    .replace(/[*_`~]/g, '')                  // Remove Markdown bold/italic/code markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert Markdown links to text
    .replace(/\s+/g, ' ')                    // Normalize multiple spaces/newlines to single space
    .trim();
}
