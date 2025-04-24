![github-submission-banner](https://github.com/user-attachments/assets/a1493b84-e4e2-456e-a791-ce35ee2bcf2f)

# 🚀 Dhidvara

> The future of terminals — AI-native, smart command-line assistance that boosts your productivity.

---

## 📌 Problem Statement

**Problem Statement 1 – Weave AI magic with Groq**

---

## 🎯 Objective

Dhidvara is an AI-powered terminal emulator that augments your command-line experience. It helps developers and engineers work faster by providing:
- Inline command suggestions as you type
- The ability to describe tasks in natural language prefixed with `@`, and let AI translate it into terminal commands
- No more switching to google to find commands. Ask your terminal to help you!

This tool is especially helpful for those who frequently use the terminal and want to streamline repetitive or complex shell operations.

---

## 🧠 Team & Approach

### Team Name:  


### Team Members:  
- Shreehari R Acharya  (Just another developer)
GitHub: [Shreehari Acharya](https://github.com/Shreehari-Acharya)
LinkedIn: [shreehari-acharya](https://www.linkedin.com/in/shreehari-acharya/)
X/Twitter: [06_shreehari](https://x.com/06_Shreehari)   


### Approach:  
- Chose the terminal as the platform due to its daily usage by developers and high potential for productivity enhancement.  
- Integrated AI to suggest commands and execute tasks via `@` triggers, reducing manual typing and lookup.  
- Implemented ghost command suggestions using `xterm.js` with visual overlays that don’t interfere with terminal behavior.  
- Faced challenges in capturing complete terminal output; solved using output markers and smart debouncing.  
- Maintained shell-native feel by avoiding intrusive UI changes and sticking to a clean, minimal design.  
- Built the app using Electron and Vite for fast builds, hot reload, and native desktop integration.  
- Added persistent settings and API key management using `electron-store`.  
- Architected the AI interaction flow to be asynchronous, responsive, and cancelable when needed.  
- Focused on modular code structure to easily add future features like voice control or multiple shells.  

---  


## 🛠️ Tech Stack

### Core Technologies Used:
- Frontend: React (Vite), TailwindCSS, xterm.js  
- Backend: Node.js with Electron  
- Database: electron-store for storing configurations 
- APIs: Groq API for AI suggestions and natural language processing  
- Hosting: Desktop application via Electron

### Sponsor Technologies Used (if any):
- ✅ **Groq:** Used to suggest and execute commands via AI  
- [ ] **Monad:**  
- [ ] **Fluvio:**  
- [ ] **Base:**  
- [ ] **Screenpipe:**  
- [ ] **Stellar:**  

---

## ✨ Key Features

- ✅ **AI Command Suggestions**: Get inline suggestions while typing in your terminal  
- ✅ **@-Based AI Tasks**: Type commands prefixed with `@` to describe what you want in plain English (e.g., `@ make a folder named myCoolProject and init npm with express,react,ts`)  
- ✅ **Tabbed Terminal Sessions**: Manage multiple shell sessions within the same window  
- ✅ **Intelligent Output Display**: Better formatting for AI and terminal responses  
- ✅ **Offline Shell Access**: All actions happen within your local environment (no remote shell)

---

## 📽️ Demo & Deliverables

- **Demo Video Link:** [Link](https://drive.google.com/file/d/1uKukVpVGmuYwPB74H00q4H46JdGeImkZ/view?usp=sharing)  
- **Pitch Deck / PPT Link:** [Link](https://docs.google.com/presentation/d/1Fa7aN564R6VkYzcieYHNFseEV7bYfg3NX0BA8Tib4TY/edit?usp=sharing)

---

## ✅ Tasks & Bonus Checklist

- ✅ **All members of the team completed the mandatory task**  
- [ ] **All members completed Bonus Task 1 - Badge Sharing**  
- ✅ **All members completed Bonus Task 2 - Signed up for Sprint.dev**

---

## 🧪 How to Run the Project

### Requirements:
- Node.js >= 18.x  
- Linux/macOS/WSL recommended for shell compatibility


```bash
# Clone the repo
git clone git@github.com:Shreehari-Acharya/Dhidvara.git
```

### Local Setup:
```bash
# Install dependencies
cd Dhidvara
npm install

# Start the app
npm run dev
```

## OR

### Download the AppImage
[Download Dhidvara for Linux](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/Dhidvara.AppImage)


Go to setting and then add your groq API key and enable AI suggestions and Agent to turn your terminal into a super terminal!

---

## 🧬 Future Scope

- 📈 Add voice support in future for accessibility  
- 🧠 Memory context for multi-step terminal workflows  
- 🧩 Plugin system for community AI agents  
- 🧪 Safer command previews before execution  
- 🌍 Multi-shell support (zsh, PowerShell, fish)

---

## 📎 Resources / Credits

- [Groq API](https://console.groq.com/home)  
- [xterm.js](https://xtermjs.org/)  
- [Electron](https://www.electronjs.org/)  
- Mentors and community feedback

---

## 🏁 Final Words

Dhidvara was built to solve a real need — simplifying terminal work with AI. Instead of replacing the shell, it enhances it. The `@` command format brings natural language into your workflow, without breaking muscle memory. We're excited about what’s next and grateful for the journey!

---
