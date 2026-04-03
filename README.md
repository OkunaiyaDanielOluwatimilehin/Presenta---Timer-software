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

Run Locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Open the web app from the landing page, or go directly to `/#/app`.

Website (Landing Page)

The landing page is part of the React app (hero, features, FAQ, footer). It includes:

- **Download (.msi)** button (GitHub Releases “latest” by default)
- **Open web app** button (opens the timer app route)

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
