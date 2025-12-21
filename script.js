/* ========= SELECTORS & STATE ========= */
const taskForm = document.getElementById('taskForm');
const taskName = document.getElementById('taskName');
const taskDate = document.getElementById('taskDate');
const taskCategory = document.getElementById('taskCategory');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const catButtons = document.querySelectorAll('.cat-btn');

const todayEl = document.getElementById('today');
const quoteEl = document.getElementById('quote');
const doneCountEl = document.getElementById('doneCount');
const totalCountEl = document.getElementById('totalCount');
const progressFill = document.getElementById('progressFill');

const upcomingList = document.getElementById('upcomingList');
const dailyNote = document.getElementById('dailyNote');
const clearNoteBtn = document.getElementById('clearNote');
const vibeLink = document.getElementById('vibeLink');

const localTimeEl = document.getElementById('localTime');

const greetingEl = document.getElementById('greeting');
const editNameBtn = document.getElementById('editNameBtn');

const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const modalBody = document.getElementById('modalBody');

const emptyHint = document.getElementById('emptyHint');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let activeCategory = 'All';
let pendingDeleteId = null;

/* Pomodoro */
const pomStart = document.getElementById('pomStart');
const pomStop = document.getElementById('pomStop');
const pomTimerEl = document.getElementById('pomodoroTimer');
const pomModeEl = document.getElementById('pomMode');
let pomInterval = null;
let pomSeconds = Number(localStorage.getItem('pomSeconds')) || 25 * 60;
let pomMode = localStorage.getItem('pomMode') || 'Work';

/* QUOTES */
const quotes = [
  "Aku sih masih kuat, yang gak kuat itu sinyal",
  "Lagi cari yang serius, serius sayang sama aku maksudnya",
  "Bangun pagi itu susah, tapi tidur lagi itu bakat",
  "Target hari ini: hidup",
  "Hidup itu keras, tapi aku lebih keras",
  "Gue tuh bukan pemalas, gue cuma hemat energi",
  "Tuhan, kalo rezeki gue nyasar ke yang lain, semoga orangnya jujur balikinnya.",
  "Otak: pengen produktif. Badan: rebahan dulu gak sih."
];

/* ========= UTIL ========= */
function saveTasks(){ localStorage.setItem('tasks', JSON.stringify(tasks)); renderTasks(); }
function formatDateDisplay(iso){ if(!iso) return ''; const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')} - ${String(d.getMonth()+1).padStart(2,'0')} - ${d.getFullYear()}`; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&','<':'<','>':'>','"':'"',"'":'&apos;'})[c]); }

/* ========= RENDER TASKS ========= */
function renderTasks(){
  taskList.innerHTML = '';

  // filter + search
  const q = (searchInput.value || '').toLowerCase();
  const filtered = tasks
    .filter(t => (activeCategory === 'All' ? true : t.category === activeCategory))
    .filter(t => t.name.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q)));

  // sort by date
  filtered.sort((a,b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    return (sortSelect.value === 'asc') ? (da - db) : (db - da);
  });

  // stats
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  totalCountEl.textContent = total;
  doneCountEl.textContent = done;
  const percent = total === 0 ? 0 : Math.round((done/total)*100);
  progressFill.style.width = percent + '%';

  // empty hint
  if(filtered.length === 0){
    emptyHint.classList.remove('hidden');
  } else {
    emptyHint.classList.add('hidden');
  }

  // render
  filtered.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'task-card ' + (t.category.toLowerCase() || '');
    card.dataset.id = t.id;

    const left = document.createElement('div'); left.className='task-left';
    const label = document.createElement('label');

    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = t.done;
    cb.addEventListener('change', () => { t.done = cb.checked; saveTasks(); });

    const txt = document.createElement('div');
    txt.innerHTML = `<div class="title">${escapeHtml(t.name)}</div><div class="meta">${formatDateDisplay(t.date)}</div>`;

    label.appendChild(cb); label.appendChild(txt);
    left.appendChild(label);

    const actions = document.createElement('div'); actions.className='task-actions';
    const editBtn = document.createElement('button'); editBtn.className='icon-btn'; editBtn.title='Edit'; editBtn.innerHTML='✏️';
    editBtn.addEventListener('click', () => openEditDialog(t.id));
    const delBtn = document.createElement('button'); delBtn.className='icon-btn'; delBtn.title='Delete'; delBtn.innerHTML='🗑️';
    delBtn.addEventListener('click', () => openDeleteModal(t.id, t.name));

    actions.appendChild(editBtn); actions.appendChild(delBtn);

    card.appendChild(left); card.appendChild(actions);
    taskList.appendChild(card);
  });

  renderUpcoming(); // update right panel
}

/* ========= FORM HANDLING ========= */
taskForm.addEventListener('submit', () => {
  const name = taskName.value.trim();
  const date = taskDate.value;
  const category = taskCategory.value;
  if(!name || !date) return alert('Fill name and date');
  const newTask = { id: Date.now(), name, date, category, done:false };
  tasks.push(newTask);
  saveTasks();
  taskName.value=''; taskDate.value=''; taskCategory.value='Study';
});

/* ========= SEARCH / SORT / CATEGORY ========= */
searchInput.addEventListener('input', renderTasks);
sortSelect.addEventListener('change', renderTasks);
catButtons.forEach(b => b.addEventListener('click', () => {
  catButtons.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  activeCategory = b.dataset.cat;
  renderTasks();
}));

/* ========= EDIT ========= */
function openEditDialog(id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  const newName = prompt('Edit task name:', t.name);
  if(newName === null) return;
  const newDate = prompt('Edit date (YYYY-MM-DD):', t.date);
  if(newDate === null) return;
  t.name = newName.trim() || t.name;
  t.date = newDate || t.date;
  saveTasks();
}

/* ========= DELETE MODAL (custom) ========= */
function openDeleteModal(id, name){
  pendingDeleteId = id;
  modalBody.textContent = `Apakah kamu yakin ingin menghapus tugas "${name}"?`;
  deleteModal.classList.remove('hidden');
}
function closeDeleteModal(){ pendingDeleteId = null; deleteModal.classList.add('hidden'); }

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', () => {
  if(pendingDeleteId === null) return closeDeleteModal();
  const idx = tasks.findIndex(t => t.id === pendingDeleteId);
  if(idx >= 0) tasks.splice(idx,1);
  saveTasks();
  closeDeleteModal();
});
/* close modal on backdrop click */
deleteModal.addEventListener('click', (e) => {
  if(e.target.classList.contains('modal-backdrop')) closeDeleteModal();
});

/* ========= UPCOMING (right panel) ========= */
function renderUpcoming(){
  upcomingList.innerHTML = '';
  // pick 3 nearest upcoming tasks (not done)
  const upcoming = tasks
    .filter(t => !t.done)
    .slice() // copy
    .sort((a,b)=> new Date(a.date) - new Date(b.date))
    .slice(0,3);

  if(upcoming.length === 0){
    upcomingList.innerHTML = '<div class="muted">No upcoming tasks 🎉</div>';
    return;
  }

  upcoming.forEach(t => {
    const it = document.createElement('div'); it.className='upcoming-item';
    it.innerHTML = `<div class="up-left"><strong>${escapeHtml(t.name)}</strong><div class="muted">${formatDateDisplay(t.date)}</div></div>`;
    upcomingList.appendChild(it);
  });
}

/* ========= DAILY NOTE ========= */
dailyNote.value = localStorage.getItem('dailyNote') || '';
dailyNote.addEventListener('input', () => {
  localStorage.setItem('dailyNote', dailyNote.value);
  document.getElementById('noteSaved').textContent = 'Saved locally';
});
clearNoteBtn.addEventListener('click', () => {
  if(confirm('Clear daily note?')){
    dailyNote.value = '';
    localStorage.removeItem('dailyNote');
  }
});

/* ========= VIBE LINK (placeholder) ========= */
vibeLink.href = 'https://open.spotify.com/playlist/66ZEBaxqAIufBoSKoQIUCM?si=7ba5b5425896479c';

/* ========= LOCAL TIME & ICON (PERBAIKAN LOGIKA) ========= */
function updateLocalTime(){
  const now = new Date();
  const hour = now.getHours();
  const minute = String(now.getMinutes()).padStart(2,'0');

  localTimeEl.textContent = `${String(hour).padStart(2,'0')}:${minute}`;

  const skyBox = document.getElementById('skyBox');
  if (!skyBox) return;

  // Reset semua class
  skyBox.className = 'sky-box';
  
  // Tentukan Waktu & Posisi Teks
  let positionLeft = '50%'; // Default

  if (hour >= 5 && hour < 11) {
    skyBox.classList.add('morning');
    positionLeft = '20%'; // Pagi: Teks di kiri
  } 
  else if (hour >= 11 && hour < 15) {
    skyBox.classList.add('noon');
    positionLeft = '50%'; // Siang: Teks di tengah
  } 
  else if (hour >= 15 && hour < 18) {
    skyBox.classList.add('afternoon');
    positionLeft = '80%'; // Sore: Teks di kanan
  } 
  else if (hour >= 18 && hour < 20) {
    skyBox.classList.add('sunset');
    positionLeft = '50%'; // Sunset: Balik tengah
  } 
  else {
    skyBox.classList.add('night');
    positionLeft = '50%'; // Malam: Tengah
  }

  // Terapkan posisi ke teks jam (style.left)
  localTimeEl.style.left = positionLeft;
}
// Jalankan tiap detik
setInterval(updateLocalTime, 1000);
updateLocalTime();

/* ========= QUOTES (auto change) ========= */
function setQuotePeriodically(){
  let idx = Math.floor(Math.random()*quotes.length);
  quoteEl.textContent = quotes[idx];
  setInterval(() => {
    quoteEl.classList.add('fade-out');
    setTimeout(() => {
      idx = (idx + 1) % quotes.length;
      quoteEl.textContent = quotes[idx];
      quoteEl.classList.remove('fade-out');
    }, 600);
  }, 120000); // every 2 minutes
}

/* ========= PROFILE NAME ========= */
const storedName = localStorage.getItem('profileName');
if(storedName){
  greetingEl.textContent = `Hi, ${storedName}!`;
} else {
  greetingEl.textContent = 'Hi, Farees!';
}
editNameBtn.addEventListener('click', () => {
  const name = prompt('Your name:', localStorage.getItem('profileName') || '');
  if(name !== null){
    localStorage.setItem('profileName', name);
    greetingEl.textContent = `Hi, ${name || 'Friend'}!`;
  }
});

/* ========= POMODORO (persist) ========= */
function formatTime(s){ const m = Math.floor(s/60); const sec = s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
function startPomodoro(){
  clearInterval(pomInterval);
  pomInterval = setInterval(() => {
    pomSeconds--;
    localStorage.setItem('pomSeconds', pomSeconds);
    localStorage.setItem('pomMode', pomMode);
    if(pomSeconds <= 0){
      if(pomMode === 'Work'){ pomMode='Break'; pomSeconds=5*60; alert('Work session done! Time for a break 🙂'); }
      else { pomMode='Work'; pomSeconds=25*60; alert('Break over! Back to work 💪'); }
      pomModeEl.textContent = pomMode;
    }
    pomTimerEl.textContent = formatTime(pomSeconds);
  }, 1000);
}
function stopPomodoro(){ clearInterval(pomInterval); }
pomStart.addEventListener('click', () => { if(pomMode==='Work'&&pomSeconds<=0) pomSeconds=25*60; if(pomMode==='Break'&&pomSeconds<=0) pomSeconds=5*60; startPomodoro(); });
pomStop.addEventListener('click', () => stopPomodoro());
pomTimerEl.textContent = formatTime(pomSeconds);
pomModeEl.textContent = pomMode;

/* ========= INIT ========= */
function setToday(){
  const d = new Date();
  const opts = { weekday:'long', day:'numeric', month:'long', year:'numeric' };
  todayEl.textContent = d.toLocaleDateString(undefined, opts);
}
setToday();
setQuotePeriodically();
renderTasks();

/* ========= THEME SWITCHER ========= */
const themeSelect = document.getElementById('themeSelect');
const root = document.documentElement;

// 1. Cek local storage saat load
const savedTheme = localStorage.getItem('appTheme') || 'default';
root.setAttribute('data-theme', savedTheme);
if(themeSelect) themeSelect.value = savedTheme;

// 2. Event Listener saat ganti pilihan
if(themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    root.setAttribute('data-theme', val); // Set atribut ke tag <html>
    localStorage.setItem('appTheme', val); // Simpan
  });
}