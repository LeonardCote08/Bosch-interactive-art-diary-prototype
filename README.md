# Bosch Interactive Art Diary Prototype

A high-performance interactive viewer for exploring detailed artwork with rich media hotspots. This prototype demonstrates the framework for a digital illustrated diary project where visitors can zoom into high-resolution artwork, trigger audio narrations, view rollover images, and follow external links through interactive hotspots.

## 🎬 Demo

[Watch Video Demonstration](https://youtu.be/kMz_AXEsem4)

## ✨ Features

- **High-Resolution Image Rendering**: Smoothly display and navigate artwork up to 100MB in size
- **Advanced Polygon-Based Hotspots**: Precisely outline areas of interest with vector paths
- **Interactive Hotspot System**: Five distinct hotspot types with different behaviors:
  - 🔵 **Type 1** (Blue): Audio narration only
  - 🟡 **Type 2** (Yellow): Audio + External link
  - 🔴 **Type 3** (Red): Audio + Rollover image
  - 🟠 **Type 4** (Orange): Audio + Rollover image + External link
  - 🟢 **Type 5** (Green): External link only
- **Custom Audio Player**: Elegant interface with play/pause controls
- **Narrative Navigation**: "Previous" and "Next" buttons for sequential exploration
- **Visual Feedback**: Hotspot highlighting on hover with descriptive tooltips
- **Optimized Zoom Behavior**: Automatically frames each hotspot with appropriate zoom level
- **Non-Disruptive External Links**: "View external source" button respects user experience

## 🛠️ Technologies Used

- **React**: Component-based architecture
- **react-zoom-pan-pinch**: High-performance image zoom and pan
- **Howler.js**: Advanced audio playback
- **SVG Polygon Rendering**: Vector-based hotspot visualization
- **Emotion Styled Components**: Clean, maintainable UI styling
- **JSON Structure**: Flexible data format for hotspot information

## 📋 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/interactive-art-diary-prototype.git
cd interactive-art-diary-prototype

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🖼️ High-Resolution Artwork
For this prototype to work properly, you'll need to download the high-resolution artwork:
1. Download "The Garden of Earthly Delights" (30,000 × 17,078 pixels) by Hieronymus Bosch from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution.jpg)
2. Save it to `/public/images/garden.jpg`
This file exceeds GitHub's size limits and must be downloaded separately.

## 🔍 Project Structure

```
/src
  /components       # React components
  /data
    hotspots.json   # Hotspot definitions
  /assets           # Static assets
  App.jsx           # Main application component
/public
  /images           # Artwork and detail images
  /audio            # Audio narration files
```

## 📄 JSON Structure

The project uses a structured JSON format to define interactive hotspots:

```json
{
  "id": "1",
  "type": 1,
  "color": "#0000FF",
  "coords": [
    [x1, y1],
    [x2, y2],
    ...
  ],
  "page_id": "artwork-identifier",
  "label": "Hotspot Label",
  "narration": "path/to/audio.mp3",
  "image": "path/to/image.jpg", // For types 3 and 4
  "link": "https://example.com", // For types 2, 4, and 5
  "hover_text": "Descriptive text shown on hover"
}
```

## 📝 Development Notes

The polygon hotspots in this prototype were created using Inkscape (similar to Affinity Designer) to demonstrate the exact conversion process that would be used in the full implementation. The coordinates were extracted to create a JSON structure compatible with what an Affinity Designer conversion tool would generate.

