const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');

// Ensure directories exist
for (const dir of [PUBLIC_DIR, UPLOADS_DIR, DATA_DIR]) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

// Initialize bookmarks storage if not present
if (!fs.existsSync(BOOKMARKS_FILE)) {
	fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify({ bookmarks: [] }, null, 2));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

// Multer storage for uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, UPLOADS_DIR);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

const upload = multer({ storage });

// Helpers
function readBookmarks() {
	try {
		const content = fs.readFileSync(BOOKMARKS_FILE, 'utf-8');
		return JSON.parse(content);
	} catch (err) {
		return { bookmarks: [] };
	}
}

function writeBookmarks(data) {
	fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
	return Math.random().toString(36).slice(2, 10);
}

// Routes: Files
app.get('/api/files', (req, res) => {
	try {
		const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
		const files = entries
			.filter((e) => e.isFile())
			.map((e) => {
				const full = path.join(UPLOADS_DIR, e.name);
				const stat = fs.statSync(full);
				return {
					name: e.name,
					size: stat.size,
					modifiedAt: stat.mtimeMs,
				};
			});
		res.json({ files });
	} catch (err) {
		res.status(500).json({ error: 'Failed to list files' });
	}
});

app.post('/api/upload', upload.single('file'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' });
	}
	res.json({ ok: true, file: { name: req.file.originalname, size: req.file.size } });
});

app.get('/api/files/:name', (req, res) => {
	const filename = req.params.name;
	const full = path.join(UPLOADS_DIR, filename);
	if (!fs.existsSync(full)) return res.status(404).json({ error: 'Not found' });
	res.download(full, filename);
});

app.delete('/api/files/:name', (req, res) => {
	const filename = req.params.name;
	const full = path.join(UPLOADS_DIR, filename);
	if (!fs.existsSync(full)) return res.status(404).json({ error: 'Not found' });
	fs.unlinkSync(full);
    // Cleanup: detach the deleted file from any bookmark attachments
    try {
        const data = readBookmarks();
        let changed = false;
        for (const bm of data.bookmarks) {
            if (Array.isArray(bm.attachments) && bm.attachments.length > 0) {
                const before = bm.attachments.length;
                bm.attachments = bm.attachments.filter((att) => att !== filename);
                if (bm.attachments.length !== before) changed = true;
            }
        }
        if (changed) writeBookmarks(data);
    } catch (_) {
        // ignore cleanup errors
    }
    res.json({ ok: true });
});

// Routes: Bookmarks
app.get('/api/bookmarks', (req, res) => {
	const data = readBookmarks();
	res.json(data);
});

app.post('/api/bookmarks', (req, res) => {
	const { title, url, tags } = req.body;
	if (!title || !url) return res.status(400).json({ error: 'title and url are required' });
	const data = readBookmarks();
	const bookmark = {
		id: generateId(),
		title,
		url,
        tags: Array.isArray(tags) ? tags : [],
        attachments: [],
		createdAt: Date.now(),
	};
	data.bookmarks.push(bookmark);
	writeBookmarks(data);
	res.status(201).json({ bookmark });
});

app.put('/api/bookmarks/:id', (req, res) => {
	const { id } = req.params;
	const { title, url, tags } = req.body;
	const data = readBookmarks();
	const idx = data.bookmarks.findIndex((b) => b.id === id);
	if (idx === -1) return res.status(404).json({ error: 'Not found' });
	const current = data.bookmarks[idx];
	data.bookmarks[idx] = {
		...current,
		title: title ?? current.title,
		url: url ?? current.url,
		tags: Array.isArray(tags) ? tags : current.tags,
	};
	writeBookmarks(data);
	res.json({ bookmark: data.bookmarks[idx] });
});

app.delete('/api/bookmarks/:id', (req, res) => {
	const { id } = req.params;
	const data = readBookmarks();
	const idx = data.bookmarks.findIndex((b) => b.id === id);
	if (idx === -1) return res.status(404).json({ error: 'Not found' });
	data.bookmarks.splice(idx, 1);
	writeBookmarks(data);
	res.json({ ok: true });
});

// Routes: Bookmark Attachments
app.post('/api/bookmarks/:id/attachments', (req, res) => {
    const { id } = req.params;
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename is required' });
    const data = readBookmarks();
    const bm = data.bookmarks.find((b) => b.id === id);
    if (!bm) return res.status(404).json({ error: 'Not found' });
    // Ensure attachments array exists
    bm.attachments = Array.isArray(bm.attachments) ? bm.attachments : [];
    const full = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'File does not exist' });
    if (!bm.attachments.includes(filename)) bm.attachments.push(filename);
    writeBookmarks(data);
    res.status(201).json({ attachments: bm.attachments });
});

app.delete('/api/bookmarks/:id/attachments/:filename', (req, res) => {
    const { id, filename } = req.params;
    const data = readBookmarks();
    const bm = data.bookmarks.find((b) => b.id === id);
    if (!bm) return res.status(404).json({ error: 'Not found' });
    bm.attachments = Array.isArray(bm.attachments) ? bm.attachments : [];
    const before = bm.attachments.length;
    bm.attachments = bm.attachments.filter((att) => att !== filename);
    if (bm.attachments.length === before) return res.status(404).json({ error: 'Attachment not found' });
    writeBookmarks(data);
    res.json({ attachments: bm.attachments });
});

// Fallback to index.html for root
app.get('/', (req, res) => {
	res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Site Manager running on http://localhost:${PORT}`);
});


