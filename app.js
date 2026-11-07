let currentActiveModCode = "";
let allDownloadedMods = []; 
let filteredModsList = []; 
let visibleCount = 0; 
const PAGE_SIZE = 5; 

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
    
    document.getElementById(`tab-${tabName}`).classList.add('active-content');
    
    if (tabName === 'browse') { 
        document.getElementById('search-bar').value = ""; 
        visibleCount = 0;
        fetchMods(); 
    } else if (tabName === 'trending') {
        generateSmartTrendingView();
    }
}

async function fetchMods() {
    const grid = document.getElementById('mods-grid');
    const loading = document.getElementById('mods-loading');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    loading.style.display = 'block';
    loadMoreBtn.style.display = 'none';
    grid.innerHTML = '';

    try {
        const response = await fetch('/api/get-mods');
        allDownloadedMods = await response.json();
        loading.style.display = 'none';

        if (allDownloadedMods.error) {
            grid.innerHTML = `<p style="color: red;">Error: ${escapeHTML(allDownloadedMods.error)}</p>`;
            return;
        }

        if (!allDownloadedMods || allDownloadedMods.length === 0) {
            grid.innerHTML = `<p style="color: var(--text-main);">No mods submitted yet. Be the first!</p>`;
            return;
        }

        filteredModsList = allDownloadedMods;
        renderNextBatch();
        checkURLHashForMod();

    } catch (err) {
        loading.style.display = 'none';
        grid.innerHTML = `<p style="color: red;">Failed to connect to backend api.</p>`;
    }
}

function checkURLHashForMod() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#mod-')) {
        const targetId = parseInt(hash.replace('#mod-', ''));
        const targetMod = allDownloadedMods.find(m => m.id === targetId);
        if (targetMod) {
            openModal(targetMod);
        }
    }
}

function filterMods() {
    const query = document.getElementById('search-bar').value.toLowerCase().trim();
    const grid = document.getElementById('mods-grid');
    
    filteredModsList = allDownloadedMods.filter(mod => 
        mod.title.toLowerCase().includes(query) || 
        mod.creator.toLowerCase().includes(query) || 
        mod.description.toLowerCase().includes(query)
    );

    grid.innerHTML = "";
    visibleCount = 0;
    renderNextBatch();
}

function renderNextBatch() {
    const grid = document.getElementById('mods-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    const nextLimit = Math.min(visibleCount + PAGE_SIZE, filteredModsList.length);
    const batchToRender = filteredModsList.slice(visibleCount, nextLimit);

    if (batchToRender.length === 0 && visibleCount === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); padding: 20px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-x preview-icon"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> No matching workshop items found.</p>`;
        loadMoreBtn.style.display = 'none';
        return;
    }

    batchToRender.forEach(mod => {
        const codePayload = mod.code_content || "";
        const lineCount = codePayload.split('
').length;
        const byteLength = new Blob([codePayload]).size;
        const kbSize = (byteLength / 1024).toFixed(2);

        const card = document.createElement('div');
        card.className = 'mod-card';
        card.innerHTML = `
            <div>
                <h3>\${escapeHTML(mod.title)}</h3>
                <div class="author">by \${escapeHTML(mod.creator)}</div>
                
                <div class="mod-meta-badges">
                    <span class="meta-badge">📋 \${lineCount} Line\${lineCount !== 1 ? 's' : ''}</span>
                    <span class="meta-badge">💾 \${kbSize} KB</span>
                </div>

                <p>\${escapeHTML(mod.description)}</p>
            </div>
            <button class="view-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-code preview-icon"><path d="m13 13.5 2-2.5-2-2.5"/><path d="m21 21-4.3-4.3"/><path d="M9 8.5 7 11l2 2.5"/><circle cx="11" cy="11" r="8"/></svg> Inspect & Copy</button>
        `;
        
        card.addEventListener('click', () => openModal(mod));
        grid.appendChild(card);
    });

    visibleCount = nextLimit;
    loadMoreBtn.style.display = (visibleCount < filteredModsList.length) ? 'block' : 'none';
}

function generateSmartTrendingView() {
    const trendingGrid = document.getElementById('trending-grid');
    trendingGrid.innerHTML = '';

    if (!allDownloadedMods || allDownloadedMods.length === 0) {
        trendingGrid.innerHTML = `<p style="color: var(--text-body);">No items available for discovery right now.</p>`;
        return;
    }

    let shuffledList = [...allDownloadedMods];
    
    for (let i = shuffledList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
    }

    const trendingCount = Math.min(3, shuffledList.length);
    const selectedTrendingMods = shuffledList.slice(0, trendingCount);

    selectedTrendingMods.forEach(mod => {
        const codePayload = mod.code_content || "";
        const lineCount = codePayload.split('
').length;
        const byteLength = new Blob([codePayload]).size;
        const kbSize = (byteLength / 1024).toFixed(2);

        const card = document.createElement('div');
        card.className = 'mod-card';
        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3>\${escapeHTML(mod.title)}</h3>
                    <span style="border: 2px solid var(--text-main); color: var(--text-main); font-size: 0.65rem; font-weight: bold; padding: 2px 8px; letter-spacing: 0.5px;">🔥 Trending</span>
                </div>
                <div class="author">by \${escapeHTML(mod.creator)}</div>
                
                <div class="mod-meta-badges">
                    <span class="meta-badge">📋 \${lineCount} Lines</span>
                    <span class="meta-badge">💾 \${kbSize} KB</span>
                </div>

                <p>\${escapeHTML(mod.description)}</p>
            </div>
            <button class="view-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-code preview-icon"><path d="m13 13.5 2-2.5-2-2.5"/><path d="m21 21-4.3-4.3"/><path d="M9 8.5 7 11l2 2.5"/><circle cx="11" cy="11" r="8"/></svg> Inspect & Copy</button>
        `;
        
        card.addEventListener('click', () => openModal(mod));
        trendingGrid.appendChild(card);
    });
}

if (document.getElementById('load-more-btn')) {
    document.getElementById('load-more-btn').addEventListener('click', renderNextBatch);
}

function openModal(mod) {
    currentActiveModCode = mod.code_content;
    document.getElementById('modal-title').innerText = mod.title;
    document.getElementById('modal-creator').innerText = mod.creator;
    document.getElementById('modal-description').innerText = mod.description;
    document.getElementById('modal-code').innerText = mod.code_content;
    
    window.location.hash = `mod-\${mod.id}`;
    document.getElementById('mod-modal').classList.add('open');
}

function closeModal() { 
    document.getElementById('mod-modal').classList.remove('open');
    history.replaceState(null, null, ' ');
}

if (document.getElementById('modal-copy-btn')) {
    document.getElementById('modal-copy-btn').addEventListener('click', function() {
        const button = this;
        const textToCopy = currentActiveModCode;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                handleCopySuccess(button);
            }).catch(() => {
                executeFallbackCopy(textToCopy, button);
            });
        } else {
            executeFallbackCopy(textToCopy, button);
        }
    });
}

function executeFallbackCopy(text, button) {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (successful) {
            handleCopySuccess(button);
        } else {
            alert("Copy operation failed.");
        }
    } catch (err) {
        alert("Clipboard action blocked.");
    }
}

function handleCopySuccess(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = "Copied!";
    button.style.background = "var(--success)";
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.background = "var(--bg-input)";
    }, 2000);
}

if (document.getElementById('mod-modal')) {
    document.getElementById('mod-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('mod-modal')) { closeModal(); }
    });
}

if (document.getElementById('mod-form')) {
    document.getElementById('mod-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById('title').value,
            creator: document.getElementById('creator').value,
            description: document.getElementById('description').value,
            code_content: document.getElementById('code').value
        };

        try {
            const response = await fetch('/api/submit-mod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.error) {
                alert(result.error);
            } else {
                alert("Mod securely published!");
                document.getElementById('mod-form').reset();
                switchTab('browse');
            }
        } catch (err) {
            alert("Submission failed.");
        }
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

window.onload = fetchMods;