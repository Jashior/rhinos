# RHINOS TTS - Firefox Extension

Rhinos is a sophisticated Text-to-Speech extension for Firefox that utilizes the ElevenLabs API to read selected web content aloud with natural-sounding AI voices.

## Features
- **Context Menu Integration**: Right-click any selected text to read it instantly.
- **Audio Controls**: Play, Pause, Stop, Volume, and Speed controls via the browser popup.
- **Customization**: Select from your available ElevenLabs voices (Free tier compatible).
- **Dark Theme**: A clean, sophisticated Anthropic-style dark UI.

## Installation (Developer Mode)

Since this is a private developer build, you need to load it as a temporary add-on.

1. **Download/Clone** this repository to a folder on your computer.
2. **Create Icons**: 
   - Create a folder named `icons`.
   - Add two PNG images: `icon.png` (48x48px) and `icon-128.png` (128x128px).
3. **Open Firefox**.
4. Navigate to `about:debugging`.
5. Click on **"This Firefox"** in the sidebar.
6. Click **"Load Temporary Add-on..."**.
7. Select the `manifest.json` file from your project folder.

## Usage

1. **Setup API Key**:
   - Click the **RHINOS** extension icon in the top toolbar.
   - Enter your **ElevenLabs API Key**. (You can find this in your ElevenLabs Profile Settings).
   - Click **Refresh Voices** to load available voices.
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