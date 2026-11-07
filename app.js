let currentActiveModCode = "";
let allDownloadedMods = []; // Global memory array holding items
let visibleCount = 0; // Tracks currently displayed item count
const PAGE_SIZE = 5; // Enforces exactly 5 entries per view slice

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    document.getElementById(`tab-${tabName}`).classList.add('active-content');
    
    if (tabName === 'browse') { 
        // Reset counters and pull fresh data when viewing the browser tab
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

        // Render the first segment batch of 5 items
        renderNextBatch();

    } catch (err) {
        loading.style.display = 'none';
        grid.innerHTML = `<p style="color: red;">Failed to connect to backend api.</p>`;
    }
}

function renderNextBatch() {
    const grid = document.getElementById('mods-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    // Calculate boundaries for slicing the next 5 items
    const nextLimit = Math.min(visibleCount + PAGE_SIZE, allDownloadedMods.length);
    const batchToRender = allDownloadedMods.slice(visibleCount, nextLimit);

    batchToRender.forEach(mod => {
        const card = document.createElement('div');
        card.className = 'mod-card';
        card.innerHTML = `
            <div>
                <h3>${escapeHTML(mod.title)}</h3>
                <div class="author">by ${escapeHTML(mod.creator)}</div>
                <p>${escapeHTML(mod.description)}</p>
            </div>
            <button class="view-btn">🔍 Inspect & Copy</button>
        `;
        
        card.addEventListener('click', () => openModal(mod));
        grid.appendChild(card);
    });

    // Update global tracking index tracker
    visibleCount = nextLimit;

    // Show button if there are more mods left to load, hide if we hit the end
    if (visibleCount < allDownloadedMods.length) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// Bind listener to the Load More button component
document.getElementById('load-more-btn').addEventListener('click', renderNextBatch);

function openModal(mod) {
    currentActiveModCode = mod.code_content;
    document.getElementById('modal-title').innerText = mod.title;
    document.getElementById('modal-creator').innerText = mod.creator;
    document.getElementById('modal-description').innerText = mod.description;
    document.getElementById('modal-code').innerText = mod.code_content;
    document.getElementById('mod-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('mod-modal').classList.remove('open');
}

document.getElementById('modal-copy-btn').addEventListener('click', function() {
    const button = this;
    navigator.clipboard.writeText(currentActiveModCode).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = "✅ Copied Payload!";
        button.style.background = "var(--success)";
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = "var(--accent)";
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
            alert(result.error); // Shows the countdown alert to the user natively
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

