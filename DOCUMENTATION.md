# Capacitor JS + React + Android Studio — Todo App Documentation

> Personal reference documentation.  
> First time running a Capacitor JS app on Android Studio (May 21, 2026).  
> Written for future self and as a portfolio/resume reference.

---

## Table of Contents

1. [What is Capacitor JS?](#1-what-is-capacitor-js)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Project Setup — Step by Step](#4-project-setup--step-by-step)
5. [Project Structure Explained](#5-project-structure-explained)
6. [How Capacitor Works (The Bridge)](#6-how-capacitor-works-the-bridge)
7. [Capacitor Preferences Plugin](#7-capacitor-preferences-plugin)
8. [Running on Android Studio](#8-running-on-android-studio)
9. [Errors Encountered & Fixes](#9-errors-encountered--fixes)
10. [Day-to-Day Development Workflow](#10-day-to-day-development-workflow)
11. [Key Concepts Summary](#11-key-concepts-summary)

---

## 1. What is Capacitor JS?

**Capacitor** is an open-source native runtime built by the Ionic team. It lets you take any modern web app (React, Vue, Angular, or plain HTML/JS) and package it as a **native iOS or Android app** — without rewriting anything in Swift or Kotlin.

Think of it as a bridge between your JavaScript code and the native APIs of the device (camera, storage, GPS, notifications, etc.).

### How it compares to alternatives

| Tool | Approach | Native Access |
|---|---|---|
| **Capacitor** | Web app wrapped in native WebView | Yes, via plugins |
| **React Native** | JS compiled to native components | Yes, deep |
| **Cordova** | Same concept as Capacitor (older predecessor) | Yes, via plugins |
| **PWA** | Just a web app pinned to home screen | Limited |

Capacitor is the modern spiritual successor to **Cordova/PhoneGap**. It's maintained actively and integrates cleanly with Vite/React.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Web Framework | React | 19.2.6 |
| Build Tool | Vite | 8.0.12 |
| Native Runtime | Capacitor | 8.3.4 |
| Storage Plugin | @capacitor/preferences | 8.0.1 |
| Android Platform | @capacitor/android | 8.3.4 |
| Node.js | v20.19.5 (via nvm) | — |
| npm | 10.8.2 | — |
| Android Gradle Plugin | 8.7.2 | — |
| ADB | 36.0.2 | — |
| macOS | Sequoia 15.6 | — |

---

## 3. Prerequisites

Before starting a Capacitor + Android project, you need the following installed:

### Node.js (via nvm — recommended)

Using a version manager like `nvm` avoids permission issues and lets you switch Node versions per project.

```bash
# Install nvm (if not yet installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Install and use Node 20
nvm install 20
nvm use 20
```

> **Important:** Vite 8+ requires Node >= 20. Node 16 will fail with a `SyntaxError: styleText` error.

### Android Studio

Download from: https://developer.android.com/studio

After installing, open Android Studio and complete the initial setup wizard — it will install the Android SDK, emulator, and required build tools automatically.

### ADB (Android Debug Bridge)

Can be installed via Homebrew:

```bash
brew install android-platform-tools
```

Or it comes bundled with Android Studio under `~/Library/Android/sdk/platform-tools/`.

### Set ANDROID_HOME environment variable

Capacitor needs to know where your Android SDK is. Add this to your `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

Then reload:

```bash
source ~/.zshrc
```

### CocoaPods (iOS only — not needed for Android-only setup)

```bash
brew install cocoapods
```

---

## 4. Project Setup — Step by Step

### Step 1 — Scaffold React + Vite

```bash
npm create vite@latest todo-app -- --template react
cd todo-app
npm install
```

### Step 2 — Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/preferences   # native storage plugin
npm install @capacitor/android       # android platform
```

### Step 3 — Initialize Capacitor

```bash
npx cap init TodoApp com.personal.todoapp --web-dir dist
```

This creates `capacitor.config.json`:

```json
{
  "appId": "com.personal.todoapp",
  "appName": "TodoApp",
  "webDir": "dist"
}
```

- `appId` — Unique identifier for the app (like a package name). Follows reverse-domain convention.
- `appName` — Display name of the app on the device.
- `webDir` — Where Capacitor looks for the built web files to copy into the native project.

### Step 4 — Configure Vite for Capacitor

In `vite.config.js`, set `base: './'`:

```js
export default defineConfig({
  plugins: [react()],
  base: './',   // required for Capacitor — assets use relative paths
})
```

Without this, the built app uses absolute paths (e.g., `/assets/index.js`) which don't work when loaded from the local filesystem inside a native WebView.

### Step 5 — Build the web app

```bash
npm run build
```

This outputs to the `/dist` folder — the folder Capacitor reads from.

### Step 6 — Add Android platform

```bash
npx cap add android
```

This creates an `/android` folder — a full native Android project (Gradle-based) that embeds your `/dist` files inside it.

### Step 7 — Open in Android Studio

```bash
npx cap open android
```

This opens the `/android` folder directly in Android Studio as a native project.

---

## 5. Project Structure Explained

```
todo-app/
├── src/
│   ├── App.jsx          ← Main React component (todo UI + Capacitor calls)
│   ├── App.css          ← Styles
│   └── main.jsx         ← React entry point
├── dist/                ← Built web output (generated by npm run build)
├── android/             ← Native Android project (generated by cap add android)
│   ├── app/
│   │   └── src/main/
│   │       ├── assets/public/   ← Copy of /dist (synced by cap sync)
│   │       └── java/            ← Native Android code (Capacitor-generated)
│   └── build.gradle     ← Android build config (where we fixed the Kotlin conflict)
├── capacitor.config.json
├── vite.config.js
└── package.json
```

### Key insight: `/android/app/src/main/assets/public/`

This is where your built web files actually live inside the Android project. Every time you change your React code, you need to `npm run build` and `npx cap sync` to update this folder.

---

## 6. How Capacitor Works (The Bridge)

This is the most important concept to understand.

```
┌─────────────────────────────────────────────┐
│              Native Android App              │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │         Android WebView              │   │
│   │                                      │   │
│   │   Your React App runs here           │   │
│   │   (HTML + CSS + JS)                  │   │
│   │                                      │   │
│   │   Preferences.set(...)  ──────────── ┼───┼──► Native Android
│   │                          Capacitor   │   │    SharedPreferences
│   │                          Bridge      │   │
│   └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

1. Your React app runs inside an **Android WebView** (essentially a full browser embedded in a native app)
2. When you call a Capacitor plugin (like `Preferences.set()`), the JavaScript sends a message across the **Capacitor Bridge**
3. The bridge translates that call into a **native Android API call** (e.g., `SharedPreferences.edit().putString(...)`)
4. The result comes back to JavaScript

You write JavaScript. The device runs native code. You never have to touch Kotlin or Java.

---

## 7. Capacitor Preferences Plugin

`@capacitor/preferences` is a key-value storage plugin — the Capacitor equivalent of `localStorage`, but backed by **native storage APIs**.

### Why not just use `localStorage`?

| | `localStorage` | `@capacitor/preferences` |
|---|---|---|
| Web browser | ✅ | ✅ (falls back to localStorage) |
| Android (native) | ❌ unreliable | ✅ SharedPreferences |
| iOS (native) | ❌ unreliable | ✅ UserDefaults |
| Can be cleared by OS | Yes | No |
| Works offline | Yes | Yes |

### Usage in code

```js
import { Preferences } from '@capacitor/preferences'

// Save
await Preferences.set({ key: 'todos', value: JSON.stringify(data) })

// Load
const { value } = await Preferences.get({ key: 'todos' })
const data = JSON.parse(value)

// Delete
await Preferences.remove({ key: 'todos' })

// Clear all
await Preferences.clear()
```

All methods are **async (Promise-based)**.

### In this project (`App.jsx`)

```js
// On app load — read from native storage
useEffect(() => {
  Preferences.get({ key: 'todos' }).then(({ value }) => {
    if (value) setTodos(JSON.parse(value))
  })
}, [])

// On every change — write to native storage
const save = (updated) => {
  setTodos(updated)
  Preferences.set({ key: 'todos', value: JSON.stringify(updated) })
}
```

Todos persist across app restarts — both in browser and on the Android device.

---

## 8. Running on Android Studio

### First-time setup

1. Run `npx cap open android` — opens the `/android` project in Android Studio
2. Android Studio performs **Gradle Sync** automatically — this downloads dependencies and configures the build
3. Wait for sync to finish (bottom status bar shows progress)

### Running on an Emulator

1. In the toolbar, click the device dropdown (shows "Small Phone" or similar)
2. Select your virtual device
3. Click the **▶ Run** button (green play icon)
4. Android Studio builds the APK and installs it on the emulator
5. The app launches automatically

### Running on a Physical Android Device

1. On your Android phone: go to **Settings → About Phone** → tap **Build Number** 7 times (enables Developer Mode)
2. Go to **Settings → Developer Options** → enable **USB Debugging**
3. Connect phone via USB
4. It will appear in the device dropdown in Android Studio
5. Click ▶ Run — the app installs directly on your phone

### Alternatively — run from terminal

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
npx cap run android
```

---

## 9. Errors Encountered & Fixes

### Error 1: `create-vite` fails with `SyntaxError: styleText`

**Cause:** Node.js version too old (v16). `create-vite` v9+ requires Node >= 20.

**Fix:**
```bash
nvm use 20
npm create vite@latest todo-app -- --template react
```

---

### Error 2: `Could not find the android platform`

**Cause:** `@capacitor/android` was not installed before running `npx cap add android`.

**Fix:**
```bash
npm install @capacitor/android
npx cap add android
```

---

### Error 3: Duplicate Kotlin class errors

**Full error pattern:**
```
Duplicate class kotlin.collections.jdk8.CollectionsJDK8Kt found in modules
kotlin-stdlib-1.8.22.jar and kotlin-stdlib-jdk8-1.6.21.jar
```

**Cause:** Starting from Kotlin 1.8, the `kotlin-stdlib-jdk7` and `kotlin-stdlib-jdk8` artifacts were merged into `kotlin-stdlib`. Older Capacitor-generated Gradle configs still pull in the old separate artifacts, causing duplicates at compile time.

**Fix:** In `android/build.gradle`, add a resolution strategy to all configurations:

```groovy
allprojects {
    repositories {
        google()
        mavenCentral()
    }
    configurations.all {
        resolutionStrategy {
            force "org.jetbrains.kotlin:kotlin-stdlib:1.8.22"
            force "org.jetbrains.kotlin:kotlin-stdlib-common:1.8.22"
        }
        exclude group: "org.jetbrains.kotlin", module: "kotlin-stdlib-jdk7"
        exclude group: "org.jetbrains.kotlin", module: "kotlin-stdlib-jdk8"
    }
}
```

Then in Android Studio: **File → Sync Project with Gradle Files**.

---

### Error 4: Xcode requires macOS 26.2+

**Cause:** macOS Sequoia 15.6 is too old for the latest Xcode (which targets macOS Tahoe 26).

**Fix:** Pivot to Android for testing. iOS would require either upgrading macOS or downloading an older Xcode version from `developer.apple.com/download/all/`.

---

## 10. Day-to-Day Development Workflow

Every time you make changes to your React code:

```bash
# 1. Make changes in src/
# 2. Build the web app
npm run build

# 3. Sync the built files into the native Android project
npx cap sync

# 4. Run on device/emulator
npx cap run android
# OR just press ▶ in Android Studio (it uses the already-synced files)
```

### For quick web iteration (browser only)

```bash
npm run dev
# Open http://localhost:5173
```

No build/sync needed for browser testing. Only sync when you want to test on the actual Android device or emulator.

### Capacitor sync vs. copy

| Command | What it does |
|---|---|
| `npx cap sync` | Copies web assets + updates native plugins |
| `npx cap copy` | Copies web assets only (faster, no plugin updates) |
| `npx cap update` | Updates native plugins only |

---

## 11. Key Concepts Summary

| Concept | What it means |
|---|---|
| **WebView** | The browser engine embedded inside the native app that renders your React app |
| **Capacitor Bridge** | The communication layer between JavaScript and native device APIs |
| **Capacitor Plugin** | A package that exposes a native API to JavaScript (e.g., Preferences, Camera, Geolocation) |
| **`cap add android`** | Generates the native Android project structure inside `/android` |
| **`cap sync`** | Copies built web files into the native project and updates plugin configs |
| **`cap open android`** | Opens the native project in Android Studio |
| **`webDir`** | The folder Capacitor reads for built web assets (must match Vite's output folder: `dist`) |
| **`base: './'`** | Vite config that makes asset paths relative — required for Capacitor's file-based loading |
| **`ANDROID_HOME`** | Environment variable pointing to the Android SDK — required for Capacitor CLI |

---

## Skills Demonstrated

- **Capacitor JS** — Setting up a cross-platform mobile app from a web codebase
- **React + Vite** — Modern frontend tooling and component-based UI
- **Android Studio** — Native Android project management, Gradle, emulator setup
- **Mobile-native storage** — Using `@capacitor/preferences` over `localStorage` for reliable persistence
- **Gradle dependency resolution** — Diagnosing and fixing Kotlin stdlib version conflicts
- **nvm** — Node version management for compatibility across tools
- **Cross-platform development** — Single codebase targeting web + Android (iOS-ready)

---

*Built and documented on May 21, 2026 — macOS Sequoia 15.6, Node 20, Capacitor 8, Android Studio.*
