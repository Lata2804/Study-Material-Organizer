let materials = JSON.parse(localStorage.getItem('materials') || '[]');

function saveMaterials() { localStorage.setItem('materials', JSON.stringify(materials)); }

function addMaterial(file=null) {
  const subject = document.getElementById('subject').value;
  const title = document.getElementById('title').value;
  let url = document.getElementById('url').value;
  const timestamp = document.getElementById('timestamp').value;
  const notes = document.getElementById('notes').value;
  const fileInput = document.getElementById('fileUpload');
  let fileData = null;

  if (!subject && !file) return alert("Please add subject or drop a file");

  if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
    if (timestamp) {
      const [mm, ss] = timestamp.split(":").map(Number);
      const totalSec = (mm || 0) * 60 + (ss || 0);
      url += (url.includes("?")) ? `&t=${totalSec}s` : `?t=${totalSec}s`;
    }
  }

  if (file || fileInput.files[0]) {
    const f = file || fileInput.files[0];
    fileData = { name: f.name, url: URL.createObjectURL(f) };
  }

  const item = { id: Date.now(), subject, title, url, notes, favorite:false, completed:false, file:fileData };
  materials.unshift(item);
  saveMaterials(); renderMaterials();

  document.getElementById('subject').value = "";
  document.getElementById('title').value = "";
  document.getElementById('url').value = "";
  document.getElementById('timestamp').value = "";
  document.getElementById('notes').value = "";
  document.getElementById('fileUpload').value = "";
}

function renderMaterials() {
  const search = document.getElementById('search').value.toLowerCase();
  const filterSubject = document.getElementById('filterSubject').value;
  const sortBy = document.getElementById('sortBy').value;
  let list = [...materials];
  if (search) list = list.filter(m => (m.title||'').toLowerCase().includes(search) || (m.notes||'').toLowerCase().includes(search));
  if (filterSubject) list = list.filter(m => m.subject === filterSubject);
  if (sortBy === 'favorites') list = list.filter(m => m.favorite);
  if (sortBy === 'completed') list = list.filter(m => m.completed);

  const grouped = {};
  list.forEach(m => { if (!grouped[m.subject]) grouped[m.subject] = []; grouped[m.subject].push(m); });

  let html = '';
  Object.keys(grouped).forEach(sub => {
    const total = grouped[sub].length;
    const completed = grouped[sub].filter(x => x.completed).length;
    const progressPercent = total ? Math.round((completed/total)*100) : 0;

    html += `<div class="folder">
      <div class="folder-header" onclick="toggleFolder(this)">📂 ${sub} <span>${progressPercent}% completed</span></div>
      <div class="folder-content">`;

    grouped[sub].forEach(m => {
      html += `<div class="material ${m.completed ? 'completed' : ''}">`+
        `<b>${m.title || ''}</b><br/>`+
        (m.url ? `<a href="${m.url}" target="_blank">${m.url}</a><br/>` : '')+
        (m.file ? `<a href="${m.file.url}" download="${m.file.name}" class="file-link">📂 ${m.file.name}</a>` : '')+
        `<i>${m.notes || ''}</i><br/>`+
        `<button onclick="toggleFavorite(${m.id})">${m.favorite ? '★' : '☆'}</button>`+
        `<button onclick="toggleCompleted(${m.id})">${m.completed ? 'Undo' : 'Done'}</button>`+
        `<button onclick="deleteMaterial(${m.id})">Delete</button>`+
        `</div>`;
    });

    html += `</div>
      <div class="progress-container"><div class="progress-bar" style="width:${progressPercent}%"></div></div>
    </div>`;
  });
  document.getElementById('materials').innerHTML = html;

  const subjects = [...new Set(materials.map(m => m.subject))];
  document.getElementById('filterSubject').innerHTML = '<option value="">All Subjects</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
}

function toggleFolder(header) { const content = header.nextElementSibling; content.style.display = (content.style.display === 'block') ? 'none' : 'block'; }
function toggleFavorite(id){ const m = materials.find(x => x.id===id); m.favorite = !m.favorite; saveMaterials(); renderMaterials(); }
function toggleCompleted(id){ const m = materials.find(x => x.id===id); m.completed = !m.completed; saveMaterials(); renderMaterials(); }
function deleteMaterial(id){ materials = materials.filter(x => x.id!==id); saveMaterials(); renderMaterials(); }
function exportData(){ const blob = new Blob([JSON.stringify(materials)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'materials.json'; a.click(); }
function importData(event){ const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = e => { materials = JSON.parse(e.target.result); saveMaterials(); renderMaterials(); }; reader.readAsText(file); }
function toggleTheme(){ document.body.classList.toggle('dark'); }

const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e)=>{ e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', ()=> dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e)=>{ e.preventDefault(); dropZone.classList.remove('dragover'); const files = e.dataTransfer.files; if (files.length > 0) { document.getElementById('subject').value = document.getElementById('subject').value || 'General'; for (let file of files) addMaterial(file); } });

renderMaterials();
