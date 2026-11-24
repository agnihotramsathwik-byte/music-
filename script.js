const audio = document.getElementById('audioElement');
const upload = document.getElementById('audioUpload');
const playButton = document.getElementById('playButton');
const seekBar = document.getElementById('seekBar');
const volumeBar = document.getElementById('volumeBar');
const nowTitle = document.getElementById('nowTitle');
const nowArtist = document.getElementById('nowArtist');
const nowCover = document.getElementById('nowCover');
const currentTimeLabel = document.getElementById('currentTime');
const durationLabel = document.getElementById('duration');
const trackRows = [...document.querySelectorAll('.track-row')];

let userTracks = [];
let currentIndex = -1;
let repeat = false;
let shuffle = false;
let objectUrl = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function setCurrentTrack(track, index = -1) {
  currentIndex = index;
  nowTitle.textContent = track.title;
  nowArtist.textContent = track.artist;
  nowCover.className = `now-cover ${track.art || 'cover-purple'}`;
  nowCover.textContent = track.symbol || '♫';
  document.querySelectorAll('.track-row').forEach(row => row.classList.remove('playing'));
}

function selectDemoTrack(row) {
  const track = {
    title: row.dataset.title,
    artist: row.dataset.artist,
    art: row.dataset.art,
    symbol: row.querySelector('.mini-cover').textContent
  };
  setCurrentTrack(track);
  nowArtist.textContent = `${track.artist} · Demo listing`;
  document.getElementById('currentTime').textContent = '0:00';
  document.getElementById('duration').textContent = '—';
  playButton.textContent = '▶';
  // Demo track entries are display examples; no copyrighted audio is bundled.
  alert('This is a sample track listing. Use “Add your music” to play an audio file from your device.');
}

trackRows.forEach(row => {
  row.querySelector('.row-play').addEventListener('click', () => selectDemoTrack(row));
  row.addEventListener('click', event => {
    if (!event.target.closest('button')) selectDemoTrack(row);
  });
});

function loadUserTrack(index, autoplay = true) {
  if (!userTracks.length) return;
  currentIndex = (index + userTracks.length) % userTracks.length;
  const track = userTracks[currentIndex];
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(track.file);
  audio.src = objectUrl;
  setCurrentTrack({ title: track.title, artist: 'Your device · Local audio', art: 'cover-purple', symbol: '♫' }, currentIndex);
  seekBar.value = 0;
  if (autoplay) audio.play().catch(() => {});
}

upload.addEventListener('change', () => {
  const files = [...upload.files].filter(file => file.type.startsWith('audio/'));
  if (!files.length) return;
  userTracks = files.map(file => ({
    file,
    title: file.name.replace(/\.[^/.]+$/, '')
  }));
  loadUserTrack(0);
  upload.value = '';
});

playButton.addEventListener('click', () => {
  if (!audio.src) {
    if (userTracks.length) loadUserTrack(0);
    else {
      alert('First choose an audio file using “Add your music”.');
      return;
    }
  } else if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', () => playButton.textContent = 'Ⅱ');
audio.addEventListener('pause', () => playButton.textContent = '▶');
audio.addEventListener('loadedmetadata', () => durationLabel.textContent = formatTime(audio.duration));
audio.addEventListener('timeupdate', () => {
  if (!Number.isFinite(audio.duration) || !audio.duration) return;
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(audio.duration);
});
audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
});

seekBar.addEventListener('input', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
});
volumeBar.addEventListener('input', () => audio.volume = Number(volumeBar.value));
audio.volume = Number(volumeBar.value);

function playNext() {
  if (!userTracks.length) return;
  const next = shuffle ? Math.floor(Math.random() * userTracks.length) : currentIndex + 1;
  loadUserTrack(next);
}
function playPrevious() {
  if (!userTracks.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  loadUserTrack(currentIndex - 1);
}
document.getElementById('nextButton').addEventListener('click', playNext);
document.getElementById('previousButton').addEventListener('click', playPrevious);

document.getElementById('shuffleButton').addEventListener('click', event => {
  shuffle = !shuffle;
  event.currentTarget.classList.toggle('selected', shuffle);
});
document.getElementById('repeatButton').addEventListener('click', event => {
  repeat = !repeat;
  event.currentTarget.classList.toggle('selected', repeat);
});
document.getElementById('likeButton').addEventListener('click', event => {
  event.currentTarget.classList.toggle('liked');
  event.currentTarget.textContent = event.currentTarget.classList.contains('liked') ? '♥' : '♡';
});

document.getElementById('searchInput').addEventListener('input', event => {
  const query = event.target.value.trim().toLowerCase();
  trackRows.forEach(row => {
    const matches = `${row.dataset.title} ${row.dataset.artist}`.toLowerCase().includes(query);
    row.style.display = matches ? 'grid' : 'none';
  });
});

document.querySelectorAll('.playlist-open').forEach(button => {
  button.addEventListener('click', () => {
    alert(`${button.dataset.playlist} is a sample playlist. Add your own audio files to play music.`);
  });
});

document.getElementById('year').textContent = new Date().getFullYear();
