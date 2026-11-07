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

    } catch (err) {
        loading.style.display = 'none';
        grid.innerHTML = `<p style="color: red;">Failed to connect to backend api.</p>`;
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
        grid.innerHTML = `<p style="color: var(--text-muted); padding: 20px;">No matching workshop items found. <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-x preview-icon"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></p>`;
        loadMoreBtn.style.display = 'none';
        return;
    }

    batchToRender.forEach(mod => {
        // --- Calculate code metrics on the fly ---
        const codePayload = mod.code_content || "";
        
        // 1. Calculate Line Count
        const lineCount = codePayload.split('\n').length;
        
        // 2. Calculate Size in Kilobytes (KB)
        const byteLength = new Blob([codePayload]).size;
        const kbSize = (byteLength / 1024).toFixed(2);

        const card = document.createElement('div');
        card.className = 'mod-card';
        card.innerHTML = `
            <div>
                <h3>${escapeHTML(mod.title)}</h3>
                <div class="author">by ${escapeHTML(mod.creator)}</div>
                
                <!-- On-the-fly metric badges -->
                <div class="mod-meta-badges">
                    <span class="meta-badge">📋 ${lineCount} Line${lineCount !== 1 ? 's' : ''}</span>
                    <span class="meta-badge">💾 ${kbSize} KB</span>
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
    document.getElementById('mod-modal').classList.add('open');
}

function closeModal() { document.getElementById('mod-modal').classList.remove('open'); }

document.getElementById('modal-copy-btn').addEventListener('click', function() {
    navigator.clipboard.writeText(currentActiveModCode).then(() => {
        const originalText = this.innerHTML;
        this.innerHTML = "Copied!";
        this.style.background = "var(--success)";
        setTimeout(() => {
            this.innerHTML = originalText;
            this.style.background = "var(--accent)";
        }, 2000);
    });
});

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

