/**
 * RHINOS TTS - Content Script
 * Handles audio playback within the context of the webpage.
 */

let audioPlayer = null;
let isPlaying = false;

// Initialize Audio Player
function initPlayer() {
  if (!audioPlayer) {
    audioPlayer = new Audio();
    
    audioPlayer.onended = () => {
        isPlaying = false;
        notifyStatus("ended");
    };
    
    audioPlayer.onplay = () => {
        isPlaying = true;
        notifyStatus("playing");
    };
    
    audioPlayer.onpause = () => {
        // Only notify paused if we didn't just switch sources immediately
        // (The PLAY_AUDIO handler will override this if it's a track switch)
        isPlaying = false;
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
        // Force state to playing immediately to prevent UI flickering
        // if the previous track triggers a 'pause' event on source switch.
        isPlaying = true; 
        notifyStatus("playing");

        audioPlayer.src = request.audioData;
        
        // Apply stored settings if available, DEFAULT TO 0.5 Volume
        browser.storage.local.get(['volume', 'speed']).then((res) => {
            audioPlayer.volume = res.volume !== undefined ? res.volume : 0.5;
            audioPlayer.playbackRate = res.speed !== undefined ? res.speed : 1.0;
            
            audioPlayer.play().catch(e => {
                console.error("Playback failed", e);
                isPlaying = false;
                notifyStatus("error");
            });
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
      isPlaying = false;
      notifyStatus("stopped");
      break;

    case "UPDATE_SETTINGS":
      if (request.volume !== undefined) audioPlayer.volume = request.volume;
      if (request.speed !== undefined) audioPlayer.playbackRate = request.speed;
      break;

    case "GET_PLAYER_STATE":
        // Popup requesting current state on open
        if (isPlaying && !audioPlayer.paused) {
            notifyStatus("playing");
        } else {
            notifyStatus("stopped");
        }
        break;

    case "STATUS_UPDATE":
      // Used to show loading notifications
      if (request.status === 'generating') {
        notifyStatus("generating");
      }
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