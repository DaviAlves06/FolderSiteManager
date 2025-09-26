async function fetchJSON(url, options) {
	const res = await fetch(url, options);
	if (!res.ok) throw new Error('Request failed');
	return res.json();
}

// Files UI
async function refreshFiles() {
	const data = await fetchJSON('/api/files');
	const list = document.getElementById('fileList');
	list.innerHTML = '';
	for (const f of data.files) {
		const li = document.createElement('li');
		const left = document.createElement('div');
		left.className = 'row';
		left.innerHTML = `<strong>${f.name}</strong> <span class="muted">(${(f.size/1024).toFixed(1)} KB)</span>`;
		const right = document.createElement('div');
		right.className = 'row';
		const dl = document.createElement('a');
		dl.textContent = 'Baixar';
		dl.href = `/api/files/${encodeURIComponent(f.name)}`;
		dl.className = 'button';
		const del = document.createElement('button');
		del.textContent = 'Excluir';
		del.onclick = async () => {
			await fetch(`/api/files/${encodeURIComponent(f.name)}`, { method: 'DELETE' });
			refreshFiles();
		};
		right.append(dl, del);
		li.append(left, right);
		list.appendChild(li);
	}
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	const input = document.getElementById('fileInput');
	if (!input.files || !input.files[0]) return;
	const form = new FormData();
	form.append('file', input.files[0]);
	await fetch('/api/upload', { method: 'POST', body: form });
	input.value = '';
	refreshFiles();
});

// Bookmarks UI
async function refreshBookmarks() {
	const data = await fetchJSON('/api/bookmarks');
	const list = document.getElementById('bookmarkList');
	list.innerHTML = '';
	for (const b of data.bookmarks) {
		const li = document.createElement('li');
		const left = document.createElement('div');
		left.className = 'row';
		const tags = (b.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ');
		left.innerHTML = `<a href="${b.url}" target="_blank" rel="noopener">${b.title}</a> <span class="muted">${new URL(b.url).hostname}</span> ${tags}`;
		const right = document.createElement('div');
		right.className = 'row';
		const edit = document.createElement('button');
		edit.textContent = 'Editar';
		edit.onclick = async () => {
			const newTitle = prompt('Título:', b.title) ?? b.title;
			const newUrl = prompt('URL:', b.url) ?? b.url;
			const newTags = prompt('Tags (vírgulas):', (b.tags||[]).join(',')) ?? (b.tags||[]).join(',');
			await fetch(`/api/bookmarks/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, url: newUrl, tags: newTags.split(',').map(s=>s.trim()).filter(Boolean) }) });
			refreshBookmarks();
		};
		const del = document.createElement('button');
		del.textContent = 'Excluir';
		del.onclick = async () => {
			await fetch(`/api/bookmarks/${b.id}`, { method: 'DELETE' });
			refreshBookmarks();
		};
		right.append(edit, del);
		li.append(left, right);
		list.appendChild(li);
	}
}

document.getElementById('bookmarkForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	const title = document.getElementById('bmTitle').value.trim();
	const url = document.getElementById('bmUrl').value.trim();
	const tags = document.getElementById('bmTags').value.split(',').map(s=>s.trim()).filter(Boolean);
	if (!title || !url) return;
	await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, url, tags }) });
	document.getElementById('bmTitle').value = '';
	document.getElementById('bmUrl').value = '';
	document.getElementById('bmTags').value = '';
	refreshBookmarks();
});

// Initial load
refreshFiles();
refreshBookmarks();


