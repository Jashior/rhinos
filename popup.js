document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const apiKeyInput = document.getElementById('apiKey');
  const voiceSelect = document.getElementById('voiceSelect');
  const volSlider = document.getElementById('volume');
  const speedSlider = document.getElementById('speed');
  const btnSave = document.getElementById('saveSettings');
  const btnRefresh = document.getElementById('refreshVoices');
  const messageArea = document.getElementById('messageArea');
  
  // Playback Controls
  const btnPlayPause = document.getElementById('btnPlayPause');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const btnStop = document.getElementById('btnStop');
  const nowPlaying = document.getElementById('nowPlaying');
  const statusDot = document.getElementById('statusDot');

  // Load stored settings
  const data = await browser.storage.local.get(['apiKey', 'voiceId', 'volume', 'speed']);
  
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.volume) volSlider.value = data.volume;
  if (data.speed) speedSlider.value = data.speed;

  // Initial Voice Load
  if (data.apiKey) {
    await loadVoices(data.apiKey, data.voiceId);
  }

  // --- Event Listeners ---

  // Save Settings
  btnSave.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const voice = voiceSelect.value;
    const vol = parseFloat(volSlider.value);
    const spd = parseFloat(speedSlider.value);

    await browser.storage.local.set({
      apiKey: key,
      voiceId: voice,
      volume: vol,
      speed: spd
    });
    
    showMessage("Configuration Saved");
    
    // Update active tab immediately
    sendMessageToActiveTab({ 
      action: "UPDATE_SETTINGS", 
      volume: vol, 
      speed: spd 
    });

    if (key) loadVoices(key, voice);
  });

  // Refresh Voices
  btnRefresh.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if(!key) {
      showMessage("Please enter API Key");
      return;
    }
    await loadVoices(key, voiceSelect.value);
  });

  // Live Slider Updates
  volSlider.addEventListener('input', () => {
    sendMessageToActiveTab({ action: "UPDATE_SETTINGS", volume: parseFloat(volSlider.value) });
  });
  speedSlider.addEventListener('input', () => {
    sendMessageToActiveTab({ action: "UPDATE_SETTINGS", speed: parseFloat(speedSlider.value) });
  });

  // Playback Controls
  btnPlayPause.addEventListener('click', () => {
    sendMessageToActiveTab({ action: "CONTROL_PAUSE" });
    togglePlayIcon(); // Optimistic toggle
  });

  btnStop.addEventListener('click', () => {
    sendMessageToActiveTab({ action: "CONTROL_STOP" });
    setPlayState(false);
    nowPlaying.innerText = "Stopped";
  });

  // --- Functions ---

  async function loadVoices(apiKey, currentVoiceId) {
    voiceSelect.disabled = true;
    voiceSelect.innerHTML = '<option>Loading voices...</option>';
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey }
      });

      if (!response.ok) throw new Error("Failed to fetch voices");

      const json = await response.json();
      voiceSelect.innerHTML = ''; // Clear loading

      // Add default/free voices
      json.voices.forEach(voice => {
        const opt = document.createElement('option');
        opt.value = voice.voice_id;
        opt.text = voice.name + (voice.labels?.accent ? ` (${voice.labels.accent})` : '');
        if (voice.voice_id === currentVoiceId) opt.selected = true;
        voiceSelect.appendChild(opt);
      });
      
      voiceSelect.disabled = false;
      showMessage("Voices loaded");
      statusDot.classList.add('active');

    } catch (e) {
      voiceSelect.innerHTML = '<option>Error loading voices</option>';
      console.error(e);
      showMessage("Check API Key");
    }
  }

  function sendMessageToActiveTab(msg) {
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, msg).catch(() => {
             nowPlaying.innerText = "No active player found";
        });
      }
    });
  }

  function showMessage(msg) {
    messageArea.innerText = msg;
    setTimeout(() => messageArea.innerText = '', 2000);
  }

  function togglePlayIcon() {
    if (iconPause.classList.contains('hidden')) {
        setPlayState(true);
    } else {
        setPlayState(false);
    }
  }

  function setPlayState(isPlaying) {
    if (isPlaying) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        nowPlaying.innerText = "Playing...";
    } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
    }
  }

  // Listen for state updates from content script
  browser.runtime.onMessage.addListener((req) => {
      if (req.action === "PLAYER_STATE") {
          if (req.state === "playing") setPlayState(true);
          if (req.state === "paused") setPlayState(false);
          if (req.state === "ended" || req.state === "stopped") {
              setPlayState(false);
              nowPlaying.innerText = "Finished";
          }
      }
  });
});
