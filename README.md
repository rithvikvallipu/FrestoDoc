# 📄 FrestoDoc

### AI-Powered Document Understanding & Assistant

**Upload. Ask. Understand.**

FrestoDoc is an AI-powered document assistant that allows users to upload PDF documents and interact with their content using natural language.

Instead of manually searching through lengthy documents, users can simply ask questions and receive relevant answers powered by **Google Gemini AI**.

---

## 🚀 Overview

Working with lengthy PDF documents can be time-consuming. Important information may be spread across multiple pages, making it difficult to quickly find specific answers.

**FrestoDoc** provides a simple solution:

> Upload your document → Ask a question → Get an AI-powered answer.

The application processes the uploaded PDF, extracts its content, sends the relevant information to Gemini AI, and displays the generated response through an intuitive web interface.

---

## ✨ Features

* 📄 **PDF Upload**

  * Upload PDF documents directly through the web application.

* 🤖 **AI Document Understanding**

  * Uses Google Gemini to understand the content of uploaded documents.

* 💬 **Natural Language Questions**

  * Ask questions about your document using normal language.

* ⚡ **AI-Powered Answers**

  * Receive relevant responses based on the uploaded document.

* 🖥️ **Simple Dashboard**

  * Clean and easy-to-use interface for document interaction.

* 🔄 **Interactive Q&A**

  * Continue asking questions about the uploaded document.

---

## 🏗️ How It Works

```text
                ┌─────────────────┐
                │   Upload PDF    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ React Frontend  │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Express Backend │
                │    Node.js      │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   PDF Parsing   │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Google Gemini  │
                │       AI        │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  AI Response    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ FrestoDoc UI    │
                └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React 19
* Vite
* JavaScript
* HTML/CSS

### Backend

* Node.js
* Express.js
* Multer
* PDF parsing

### AI

* Google Gemini API
* `@google/genai`

---

## 📂 Project Structure

```text
FrestoDoc/
│
├── bobdocs/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── ...
│
├── README.md
└── ...
```

> The exact folder structure may vary depending on your current repository organization.

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd FrestoDoc
```

---

### 2. Install frontend dependencies

```bash
cd bobdocs
npm install
```

---

### 3. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

---

### 4. Configure Gemini API

Create a `.env` file inside the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace `your_gemini_api_key` with your Google Gemini API key.

**Important:** Never upload your `.env` file or expose your API key publicly.

Add this to `.gitignore`:

```text
.env
node_modules/
```

---

### 5. Start the backend

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

---

### 6. Start the frontend

From the frontend directory:

```bash
npm run dev
```

Open the local URL shown by Vite in your browser.

---

## 💡 Example Use Case

Imagine a student has a 100-page academic PDF and wants to find a specific piece of information.

Instead of:

```text
Open PDF
   ↓
Search manually
   ↓
Read multiple pages
   ↓
Find information
```

With FrestoDoc:

```text
Upload PDF
   ↓
Ask a question
   ↓
Gemini analyzes the document
   ↓
Get the answer
```

This makes document interaction much more convenient.

---

## 🎯 Target Users

FrestoDoc can be useful for:

* 🎓 Students
* 🔬 Researchers
* 💼 Professionals
* 🏢 Businesses
* 📚 Anyone working with lengthy documents

---

## 🔮 Future Scope

The current prototype can be extended with:

* 📚 Multi-document conversations
* 📝 Automatic document summarization
* 🔗 Citations and source references
* 🎙️ Voice-based interaction
* 📁 Support for additional file formats
* 🧠 Personalized document knowledge bases
* 🔍 More advanced document analysis

These are planned improvements and are not necessarily part of the current implementation.

---

The project explores how generative AI can make document-based information more accessible and interactive.

---

## 👨‍💻 Project

**FrestoDoc**

> **Upload. Ask. Understand.**

Built with ❤️ using **React, Node.js, Express and Google Gemini AI**.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
