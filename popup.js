document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const apiKeyInput = document.getElementById('apiKey');
  const voiceSelect = document.getElementById('voiceSelect');
  const volSlider = document.getElementById('volume');
  const speedSlider = document.getElementById('speed');
  const btnSave = document.getElementById('saveSettings');
  const btnValidate = document.getElementById('validateBtn');
  const btnRemoveKey = document.getElementById('removeKeyBtn');
  const messageArea = document.getElementById('messageArea');
  const getKeyLink = document.getElementById('getKeyLink');
  
  // Playback Controls
  const btnPlayPause = document.getElementById('btnPlayPause');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const btnStop = document.getElementById('btnStop');
  const nowPlaying = document.getElementById('nowPlaying');
  const statusDot = document.getElementById('statusDot');

  // Load stored settings
  const data = await browser.storage.local.get(['apiKey', 'voiceId', 'volume', 'speed']);
  
  // UI State Initialization
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
    lockKeyInput(true);
    await loadVoices(data.apiKey, data.voiceId);
  } else {
    lockKeyInput(false);
  }
  
  // Set defaults if not present
  volSlider.value = (data.volume !== undefined) ? data.volume : 0.5;
  speedSlider.value = (data.speed !== undefined) ? data.speed : 1.0;

  // Check if audio is currently playing on the active tab
  sendMessageToActiveTab({ action: "GET_PLAYER_STATE" });

  // --- Event Listeners ---

  // External Link Handler
  getKeyLink.addEventListener('click', (e) => {
      e.preventDefault();
      browser.tabs.create({ url: "https://elevenlabs.io/app/developers/api-keys" });
  });

  // Save Configuration Button (Explicit Save)
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
  });

  // Validate & Connect
  btnValidate.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if(!key) {
      showMessage("Please enter API Key");
      return;
    }
    await loadVoices(key, voiceSelect.value);
  });

  // Remove Key
  btnRemoveKey.addEventListener('click', async () => {
    await browser.storage.local.remove(['apiKey', 'voiceId']);
    apiKeyInput.value = '';
    lockKeyInput(false);
    
    // Reset Voice Select
    voiceSelect.innerHTML = '<option>Connect API Key first...</option>';
    voiceSelect.disabled = true;
    
    statusDot.classList.remove('active', 'error');
    showMessage("Key Removed");
  });

  // Live Slider Updates & Auto-Persistence
  volSlider.addEventListener('input', () => {
    const val = parseFloat(volSlider.value);
    // Save immediately so it persists for the next track/browser restart
    browser.storage.local.set({ volume: val });
    sendMessageToActiveTab({ action: "UPDATE_SETTINGS", volume: val });
  });

  speedSlider.addEventListener('input', () => {
    const val = parseFloat(speedSlider.value);
    // Save immediately so it persists for the next track/browser restart
    browser.storage.local.set({ speed: val });
    sendMessageToActiveTab({ action: "UPDATE_SETTINGS", speed: val });
  });

  // Auto-save Voice Selection
  voiceSelect.addEventListener('change', () => {
    browser.storage.local.set({ voiceId: voiceSelect.value });
  });

  // Playback Controls
  btnPlayPause.addEventListener('click', () => {
    sendMessageToActiveTab({ action: "CONTROL_PAUSE" });
  });

  btnStop.addEventListener('click', () => {
    sendMessageToActiveTab({ action: "CONTROL_STOP" });
    setPlayState(false);
    nowPlaying.innerText = "Stopped";
  });

  // --- Functions ---

  function lockKeyInput(isLocked) {
    if (isLocked) {
      apiKeyInput.disabled = true;
      btnValidate.classList.add('hidden');
      btnRemoveKey.classList.remove('hidden');
    } else {
      apiKeyInput.disabled = false;
      btnValidate.classList.remove('hidden');
      btnValidate.textContent = "Connect";
      btnRemoveKey.classList.add('hidden');
    }
  }

  async function loadVoices(apiKey, currentVoiceId) {
    voiceSelect.disabled = true;
    // Only show "Connecting" if we are explicitly validating
    if (!apiKeyInput.disabled) {
        voiceSelect.innerHTML = '<option>Connecting...</option>';
        btnValidate.textContent = "Checking...";
    }
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey }
      });

      if (!response.ok) throw new Error("Failed to fetch voices");

      const json = await response.json();
      voiceSelect.innerHTML = ''; 

      // Add default/free voices
      json.voices.forEach(voice => {
        const opt = document.createElement('option');
        opt.value = voice.voice_id;
        opt.text = voice.name + (voice.labels?.accent ? ` (${voice.labels.accent})` : '');
        if (voice.voice_id === currentVoiceId) opt.selected = true;
        voiceSelect.appendChild(opt);
      });
      
      voiceSelect.disabled = false;
      lockKeyInput(true); 
      
      statusDot.classList.add('active');
      statusDot.classList.remove('error');
      
      // Auto-save key
      browser.storage.local.set({ apiKey: apiKey });

    } catch (e) {
      voiceSelect.innerHTML = '<option>Connection Failed</option>';
      console.error(e);
      showMessage("Invalid Key or Network Error");
      btnValidate.textContent = "Retry";
      statusDot.classList.add('error');
      statusDot.classList.remove('active');
    }
  }

  function sendMessageToActiveTab(msg) {
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, msg).catch(() => {
             nowPlaying.innerText = "No text selected";
        });
      }
    });
  }

  function showMessage(msg) {
    messageArea.innerText = msg;
    setTimeout(() => messageArea.innerText = '', 2000);
  }

  function setPlayState(isPlaying) {
    if (isPlaying) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        // Add glow/pulse animation class
        btnPlayPause.classList.add('playing');
        nowPlaying.innerText = "Reading...";
    } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        // Remove glow/pulse animation class
        btnPlayPause.classList.remove('playing');
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
          if (req.state === "generating") {
              nowPlaying.innerText = "Generating Audio...";
          }
      }
  });
});