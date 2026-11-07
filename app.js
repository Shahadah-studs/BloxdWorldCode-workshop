function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    document.getElementById(`tab-${tabName}`).classList.add('active-content');
    
    if (tabName === 'browse') { fetchMods(); }
}

async function fetchMods() {
    const grid = document.getElementById('mods-grid');
    const loading = document.getElementById('mods-loading');
    
    loading.style.display = 'block';
    grid.innerHTML = '';

    try {
        const response = await fetch('/api/get-mods');
        const mods = await response.json();

        loading.style.display = 'none';

        if (mods.error) {
            grid.innerHTML = `<p style="color: red;">Error: ${escapeHTML(mods.error)}</p>`;
            return;
        }

        if (!mods || mods.length === 0) {
            grid.innerHTML = `<p style="color: var(--text-muted);">No mods submitted yet. Be the first!</p>`;
            return;
        }

        mods.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            card.innerHTML = `
                <div>
                    <h3>${escapeHTML(mod.title)}</h3>
                    <div class="author">by ${escapeHTML(mod.creator)}</div>
                    <p>${escapeHTML(mod.description)}</p>
                </div>
                <button class="copy-btn" id="btn-${mod.id}">📋 Copy Code</button>
            `;
            grid.appendChild(card);
            
            document.getElementById(`btn-${mod.id}`).addEventListener('click', function() {
                copyCode(this, mod.code_content);
            });
        });
    } catch (err) {
        grid.innerHTML = `<p style="color: red;">Failed to connect to backend api.</p>`;
    }
}

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
            alert("Error: " + result.error);
        } else {
            alert("Mod securely published!");
            document.getElementById('mod-form').reset();
            switchTab('browse');
        }
    } catch (err) {
        alert("Submission failed.");
    }
});

function copyCode(button, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = "✅ Copied!";
        button.style.borderColor = "var(--success)";
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.borderColor = "var(--border)";
        }, 2000);
    }).catch(() => {
        alert("Clipboard action blocked. Ensure iframe permissions are set.");
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

window.onload = fetchMods;
