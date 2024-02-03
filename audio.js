// Get elements
const audio = document.querySelector('audio');
const audioPlayer = document.querySelector('.audio');
const progressRange = document.querySelector('.range--progress');
const volumeRange = document.querySelector('.range--volume');
const currentTime = document.querySelector('.current-time');
const durationTime = document.querySelector('.duration-time');
const playBtn = document.querySelector('.audio__btn--play');
const muteBtn = document.querySelector('.audio__btn--mute');
const backBtn = document.querySelector('.audio__btn--back');
const forwardBtn = document.querySelector('.audio__btn--forward');
let raf = null;

// Functions
function setRangeValue(rangeInput) {
  if(rangeInput === progressRange) {
    audioPlayer.style.setProperty('--progress-before-width', rangeInput.value / rangeInput.max * 100 + '%');
  } else {
    audioPlayer.style.setProperty('--volume-before-width', rangeInput.value / rangeInput.max * 100 + '%');
  }
}
function formatTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
}
function setCurrentTime() {
  currentTime.textContent = formatTime(progressRange.value);
}
function setDurationTime() {
  durationTime.textContent = formatTime(audio.duration);
}
function setProgressMax() {
  progressRange.max = Math.floor(audio.duration);
}
function restartAudio() {
  endAudio();
  audio.currentTime = 0;
  play();
}
function endAudio() {
  cancelAnimationFrame(raf);
  if (!playBtn.classList.contains('is-paused')) {
    playBtn.classList.add('is-paused');
  }
  playBtn.setAttribute('aria-label', 'Play');
}
function play() {
  audio.play();
  requestAnimationFrame(whilePlaying);
  playBtn.classList.remove('is-paused');
  playBtn.setAttribute('aria-label', 'Pause');
}
function pause() {
  audio.pause();
  cancelAnimationFrame(raf);
  playBtn.classList.add('is-paused');
  playBtn.setAttribute('aria-label', 'Play');
}
function togglePlay() {
  if (!audio.paused) {
    pause();
  } 
  else if (audio.ended) {
    restartAudio();
  } 
  else {
    play();
  }
}
function toggleMute() {
  muteBtn.classList.toggle('is-muted');
  if (audio.muted) {
    audio.muted = false;
    muteBtn.setAttribute('aria-pressed', false);
  } else {
    audio.muted = true;
    muteBtn.setAttribute('aria-pressed', true);
  }
}
function back() {
  if (audio.currentTime == audio.duration) {
    audio.currentTime = audio.currentTime - 15;
  } 
  else if (audio.currentTime >= 15) {
    audio.currentTime = audio.currentTime - 15;
  } 
  else {
    audio.currentTime = 0;
  }
  play();
}
function forward() {
  if (audio.currentTime <= audio.duration - 15) {
    audio.currentTime = audio.currentTime + 15;
    play();
  } 
  else {
    audio.currentTime = audio.duration;
    requestAnimationFrame(whilePlaying);
    endAudio();
  }
}
const whilePlaying = () => {
  progressRange.value = Math.floor(audio.currentTime);
  currentTime.textContent = formatTime(progressRange.value);
  audioPlayer.style.setProperty('--progress-before-width', `${progressRange.value / progressRange.max * 100 }%`);
  raf = requestAnimationFrame(whilePlaying);
  if (audio.ended) {
    endAudio();
  }
}

// Event listeners
progressRange.addEventListener('input', (e) => {
  setRangeValue(e.target);
  setCurrentTime();
  if (!audio.paused) {
    cancelAnimationFrame(raf);
  }
});
progressRange.addEventListener('change', () => {
  audio.currentTime = progressRange.value;
  if (!audio.paused) {
    requestAnimationFrame(whilePlaying);
  }
});
volumeRange.addEventListener('input', (e) => {
  setRangeValue(e.target);
  let value = e.target.value;
  audio.volume = value / 100;
});

if (audio.readyState > 0) {
  setDurationTime();
  setProgressMax();
} 
else {
  audio.addEventListener('loadedmetadata', () => {
    setDurationTime();
    setProgressMax();
  });
}