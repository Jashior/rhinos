/**
 * RHINOS TTS - Content Script
 * Handles audio playback within the context of the webpage.
 */

let audioPlayer = null;

// Initialize Audio Player
function initPlayer() {
  if (!audioPlayer) {
    audioPlayer = new Audio();
    audioPlayer.onended = () => {
        notifyStatus("ended");
    };
    audioPlayer.onplay = () => {
        notifyStatus("playing");
    };
    audioPlayer.onpause = () => {
        notifyStatus("paused");
    };
  }
}

// Listen for messages from Background or Popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  initPlayer();

  switch (request.action) {
    case "PLAY_AUDIO":
      if (request.audioData) {
        audioPlayer.src = request.audioData;
        
        // Apply stored settings if available
        browser.storage.local.get(['volume', 'speed']).then((res) => {
            audioPlayer.volume = res.volume !== undefined ? res.volume : 1.0;
            audioPlayer.playbackRate = res.speed !== undefined ? res.speed : 1.0;
            audioPlayer.play().catch(e => console.error("Playback failed", e));
        });
      }
      break;

    case "CONTROL_PAUSE":
      if (!audioPlayer.paused) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
      break;

    case "CONTROL_STOP":
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      notifyStatus("stopped");
      break;

    case "UPDATE_SETTINGS":
      if (request.volume !== undefined) audioPlayer.volume = request.volume;
      if (request.speed !== undefined) audioPlayer.playbackRate = request.speed;
      break;

    case "STATUS_UPDATE":
      // Used to show loading notifications if we built a UI overlay
      // console.log("Rhinos Status:", request.status);
      break;
      
    case "ERROR":
      alert(`Rhinos TTS Error: ${request.message}`);
      break;
  }
});

function notifyStatus(state) {
    // Send status back to popup if it's open
    browser.runtime.sendMessage({ action: "PLAYER_STATE", state: state }).catch(() => {
        // Popup likely closed, ignore
    });
}
