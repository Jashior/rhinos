# Rhinos TTS - Firefox Extension

https://addons.mozilla.org/en-US/firefox/addon/rhinos-tts/

<img width="310" height="465" alt="jUQZnVqCSi" src="https://github.com/user-attachments/assets/2d49ab90-84bc-4c4e-afc2-56f1779fd0ac" />

Rhinos is a sophisticated Text-to-Speech extension for Firefox that utilizes the ElevenLabs API to read selected web content aloud with natural-sounding AI voices.

## Features
- **Context Menu Integration**: Right-click any selected text to read it instantly.
- **Audio Controls**: Play, Pause, Stop, Volume, and Speed controls via the browser popup.
- **Customization**: Select from your available ElevenLabs voices (Free tier compatible via `multilingual_v2`).
- **Dark Theme**: A clean, sophisticated Anthropic-style dark UI.

## Privacy & Security Policy

We believe in complete transparency regarding your data.

1. **Local Storage**: Your ElevenLabs API Key is stored using `browser.storage.local`. This means the key resides **locally on your machine** within the browser's sandboxed extension storage. It is not synced to the cloud or accessible by other websites.
2. **Data Transmission**: The extension **only** sends the specific text you highlight and select to the official ElevenLabs API endpoints for audio generation. No other content from the webpage is accessed or transmitted.
3. **No Analytics**: This extension does not collect analytics, track user behavior, or store personal data. No information is transmitted to any third-party servers other than ElevenLabs.
4. **Permission Usage**: We only request the minimum permissions required to read selected text (`activeTab`/`scripting`) and communicate with the API (`host_permissions`).
5. **User Control**: You can delete your API key at any time by clicking the "Disconnect" (X) button in the extension popup, which immediately removes it from local storage.

## Installation (Experimental Add-on)

This extension is currently distributed as an unpacked experimental add-on.

1. **Download/Clone** this repository to a folder on your computer.
2. **Create Icons**: 
   - Create a folder named `icons`.
   - Add two images: `icon.svg` (or .png) inside.
3. **Open Firefox**.
4. Navigate to `about:debugging`.
5. Click on **"This Firefox"** in the sidebar.
6. Click **"Load Temporary Add-on..."**.
7. Select the `manifest.json` file from your project folder.

## Usage

1. **Setup API Key**:
   - Click the **Rhinos** extension icon in the top toolbar.
   - Enter your **ElevenLabs API Key**. (You can find this in your [ElevenLabs Dashboard](https://elevenlabs.io/app/developers/api-keys)).
   - Click **Connect** to verify and load voices.
   - Click **Save Configuration**.

2. **Read Text**:
   - Highlight text on any webpage.
   - Right-click the selection.
   - Select **"Read with Rhinos"**.
   - The audio will begin playing shortly (latency depends on text length).

3. **Control Playback**:
   - Open the extension popup while audio is playing to Pause, Resume, or Stop.
   - Adjust Volume and Speed using the sliders in real-time.

## Project Structure

- `manifest.json`: V3 configuration.
- `background.js`: Handles API calls and context menu events.
- `content.js`: Injects audio playback capabilities into the webpage.
- `popup.html/js`: The settings and control interface.
- `styles.css`: Dark theme styling.

## Tech Stack
- Vanilla JavaScript (ES6+)
- Firefox WebExtensions API
- ElevenLabs REST API
