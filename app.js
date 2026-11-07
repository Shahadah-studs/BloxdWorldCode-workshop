let currentActiveModCode = "";
let allDownloadedMods = []; 
let filteredModsList = []; 
let visibleCount = 0; 
const PAGE_SIZE = 5; 

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    document.getElementById(`tab-${tabName}`).classList.add('active-content');
    
    if (tabName === 'browse') { 
        document.getElementById('search-bar').value = ""; 
        visibleCount = 0;
        fetchMods(); 
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
        grid.innerHTML = `<p style="color: var(--text-muted); padding: 20px;">No matching workshop items found.</p>`;
        loadMoreBtn.style.display = 'none';
        return;
    }

    batchToRender.forEach(mod => {
        const codePayload = mod.code_content || "";
        const lineCount = codePayload.split('\n').length;
        const byteLength = new Blob([codePayload]).size;
        const kbSize = (byteLength / 1024).toFixed(2);

        const card = document.createElement('div');
        card.className = 'mod-card';
        card.innerHTML = `
            <div>
                <h3>${escapeHTML(mod.title)}</h3>
                <div class="author">by ${escapeHTML(mod.creator)}</div>
                
                <div class="mod-meta-badges">
                    <span class="meta-badge"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list preview-icon"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg> ${lineCount} Line${lineCount !== 1 ? 's' : ''}</span>
                    <span class="meta-badge"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file preview-icon"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/></svg> ${kbSize} KB</span>
                </div>

                <p>${escapeHTML(mod.description)}</p>
            </div>
            <button class="view-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-code preview-icon"><path d="m13 13.5 2-2.5-2-2.5"/><path d="m21 21-4.3-4.3"/><path d="M9 8.5 7 11l2 2.5"/><circle cx="11" cy="11" r="8"/></svg> Inspect & Copy</button>
        `;
        
        card.addEventListener('click', () => openModal(mod));
        grid.appendChild(card);
    });

    visibleCount = nextLimit;
    loadMoreBtn.style.display = (visibleCount < filteredModsList.length) ? 'block' : 'none';
}

document.getElementById('load-more-btn').addEventListener('click', renderNextBatch);

function openModal(mod) {
    currentActiveModCode = mod.code_content;
    document.getElementById('modal-title').innerText = mod.title;
    document.getElementById('modal-creator').innerText = mod.creator;
    document.getElementById('modal-description').innerText = mod.description;
    document.getElementById('modal-code').innerText = mod.code_content;
    
    window.location.hash = `mod-${mod.id}`;
    
    document.getElementById('mod-modal').classList.add('open');
}

function closeModal() { 
    document.getElementById('mod-modal').classList.remove('open');
    // Nettoie l'URL quand on ferme le pop-up en enlevant le hashtag
    history.replaceState(null, null, ' ');
}

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
            alert("Copying failed.");
        }
    } catch (err) {
        alert("Clipboard action blocked.");
    }
}

function handleCopySuccess(button) {
    const originalText = button.innerHTML;
    button.innerHTML = "<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-check preview-icon"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg> Copied!";
    button.style.background = "var(--success)";
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = "var(--bg-input)";
    }, 2000);
}

document.getElementById('mod-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('mod-modal')) { closeModal(); }
});

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

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

window.onload = fetchMods;
