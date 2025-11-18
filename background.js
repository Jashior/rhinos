/**
 * Rhinos TTS - Background Service
 */

// Create Context Menu on Install
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "rhinos-read-selection",
    title: "Read with Rhinos",
    contexts: ["selection"]
  });
});

// Handle Context Menu Click
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "rhinos-read-selection") {
    const selectedText = info.selectionText;
    if (selectedText) {
      processTTS(selectedText, tab.id);
    }
  }
});

// Main Processing Function
async function processTTS(text, tabId) {
  try {
    // 1. Get Settings
    const data = await browser.storage.local.get(['apiKey', 'voiceId', 'modelId']);
    const apiKey = data.apiKey;
    const voiceId = data.voiceId || "JBFqnCBsd6RMkjVDRZzb"; // Default: Adam
    
    // Logic to handle Free Tier Model compatibility
    // If user has old deprecated model stored, force update to v2
    let modelId = data.modelId || "eleven_multilingual_v2";
    if (modelId === "eleven_monolingual_v1" || modelId === "eleven_multilingual_v1") {
        console.log("Migrating deprecated model to eleven_multilingual_v2");
        modelId = "eleven_multilingual_v2";
        await browser.storage.local.set({ modelId: modelId });
    }

    if (!apiKey) {
      console.error("No API Key found");
      browser.tabs.sendMessage(tabId, { action: "ERROR", message: "Please set API Key in extension popup." });
      return;
    }

    // Notify user processing started
    browser.tabs.sendMessage(tabId, { action: "STATUS_UPDATE", status: "generating" });

    // 2. Call ElevenLabs API
    // We use the REST API here as it's more robust for extensions than WebSockets
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail?.message || "API Error");
    }

    // 3. Convert Blob to Data URL (Base64) to pass to Content Script
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onloadend = function() {
      const base64data = reader.result;
      
      // 4. Send Audio to Content Script
      browser.tabs.sendMessage(tabId, {
        action: "PLAY_AUDIO",
        audioData: base64data
      });
    }
    reader.readAsDataURL(blob);

  } catch (error) {
    console.error("TTS Error:", error);
    browser.tabs.sendMessage(tabId, { action: "ERROR", message: error.message });
  }
}