# Threema Chat HTML Converter

### 🗂️ Read your Threema chat archives easily

When you archive a single Threema chat, it's saved as a **password-protected ZIP file**.
Once you unzip that archive into a clean folder, you'll find a few files:

1. **`messages.txt`** — all your chat messages as plain text  
2. **Media files** — your pictures, videos, voice messages, etc. (but without their original filenames)

This small tool converts your **plain text chat file** into a **formatted HTML file** that you can open in any web browser.
All your messages become readable again, and every media file appears as a **clickable link**.

🛠️ The original `messages.txt` file is never changed.

---

## 🧰 What's included

This project provides:
- **1 NodeJS source file** (for developers or advanced users)
- **3 precompiled executables**:
  - `Windows`  
  - `macOS`  
  - `Linux`
- **1 sample JSON configuration file**

---

## 🚀 How to use

### Option 1 — The easy way (double-click)
1. Download the compiled file for your platform (Windows, macOS, or Linux).  
2. Place it in the same folder as your unzipped Threema archive.  
3. **Double-click** the program.

The program automatically looks for:
- `messages.txt`
- Any media files in the same folder

It will then create an **HTML file** that you can open in your browser.

---

### Option 2 — Command line (advanced use)
You can also run the program from a terminal or command prompt.  
It accepts up to **two optional parameters**:

```bash
threema_chat2html [folder-path [text-filename]]
```

#### Examples
```bash
# Example 1: Default use (current folder and "messages.txt")
threema_chat2html

# Example 2: Specify a folder
threema_chat2html /path/to/chat

# Example 3: Specify a folder and custom text file
threema_chat2html /path/to/chat my_chat.txt
```

If no parameters are given, the program searches for Threema files in the **folder where it sits**.

---

## ⚙️ Configuration

The program uses **built-in default settings**, but you can customize them by providing your own **JSON configuration file**.

You can download a sample config file from this repository (`threema_chat2html.config`).

### Where the program looks for a configuration file
In the following order:

1. The folder path provided on the command line  
2. The current working directory  
3. The folder where the program itself is located  

If no configuration file is found, the program uses its internal defaults.

---

## 💡 Features
- No installation needed — just download and run  
- Converts Threema's `messages.txt` into a **clean, readable HTML file**
- Keeps all media files accessible as **clickable links**  
- Works completely **offline**  
- Supports **Windows, macOS, and Linux**

---

## 🧑‍💻 For developers
The project is written in **NodeJS**.
If you want to compile it yourself, use the [`pkg`](https://github.com/vercel/pkg) tool (not `nexe`) to build standalone executables.

Example:
```bash
npm install -g pkg
pkg threema_chat2html.js --options max_old_space_size=8192
```

This will create platform-specific binaries similar to the precompiled ones provided in the release section.

---

## 📄 License
This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute it — see the [LICENSE](LICENSE) file for details.

---

## 💬 Feedback & Contributions
If you encounter bugs, have suggestions, or want to contribute, please open an **Issue** or **Pull Request** on this repository.
