# Presenta Pro - Professional Stage Timer

Presenta Pro is a high-performance, professional-grade stage timing and agenda management application built for live events, conferences, and broadcasts.
Source code: https://github.com/OkunaiyaDanielOluwatimilehin/Presenta---Timer-software




- **Live Controller**: Real-time timer management with millisecond precision.
- **Agenda Management**: Create, save, and load complex event schedules.
- **Display Mode**: Dedicated full-screen output for stage monitors.
- **Custom Branding**: Modern geometric logo and customizable themes.
- **Typography Engine**: Curated professional fonts (offline-ready).
- **Broadcast System**: Send scrolling messages and alerts to the stage display.
- **Offline Ready**: All data is persisted locally via LocalStorage.

---

Download (Windows)

Download and install the latest `.msi` from the GitHub Releases page:
https://github.com/OkunaiyaDanielOluwatimilehin/Presenta---Timer-software/releases/tag/Software

---

App Icon (Windows)

Run `npm run tauri:icon` to generate the Windows app icons in `src-tauri/icons/` from `public/android-chrome-512x512.png`.

---

 Keyboard Shortcuts

- **SPACE**: Play / Pause Timer
- **R**: Reset Current Timer
- **ENTER**: Load Selected Agenda Item
- **UP / DOWN**: Navigate Agenda Items
- **CTRL + S**: Save Agenda to File
- **CTRL + O**: Open Agenda File

---

Tech Stack

- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Desktop**: Tauri (Windows installer via `.msi`)
- **Icons**: Lucide React
- **Fonts**: Fontsource (offline-ready)

---

HDMI / VGA Output Setup

Presenta Pro is designed to work like professional presentation software (e.g., ProPresenter or PowerPoint).

1. **Connect your monitor**: Plug in your HDMI/VGA cable and set your display to "Extend" mode in Windows settings.
2. **One-Click Display**: Click the green **"Send to Display"** button in the app.
3. **Automatic Setup**: A new window will automatically open. Drag this window to your external monitor.
4. **Control Panel**: Keep the main window on your laptop to control the timer, agenda, and messages.
5. **Instant Sync**: Everything you do on your laptop will happen instantly on the stage monitor via the built-in **Real-Time Sync System**.
