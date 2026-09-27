
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const multer  = require("multer");
const { PDFParse } = require("pdf-parse");
const mammoth  = require("mammoth");
const { GoogleGenAI } = require("@google/genai");
const { MongoClient,ObjectId } = require("mongodb");

// ──────────────────────────────────────────────────────────
// GEMINI MODEL CONFIGURATION
// Change model names here only — nowhere else in the file.
// ──────────────────────────────────────────────────────────

const GEMINI_PRIMARY_MODEL  = "gemini-3.8-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";

// Status codes that are temporary and worth retrying
const RETRYABLE_CODES = new Set([408, 429, 500, 502, 503, 504]);

// Status codes that indicate a configuration/auth problem — never retry
const FATAL_CODES = new Set([400, 401, 403, 404]);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app  = express();
const PORT = 5000;

// ──────────────────────────────────────────────────────────
// MONGODB CONFIGURATION
// ──────────────────────────────────────────────────────────

const mongoClient = new MongoClient(process.env.MONGODB_URI);

let db;
let documentsCollection;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }  // 20 MB max
});


// ──────────────────────────────────────────────────────────
// HELPER — Single Gemini request (no retry)
// ──────────────────────────────────────────────────────────

async function geminiRequest(model, prompt) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  const raw = response.text;
  if (!raw || !raw.trim()) throw new Error("Gemini returned an empty response");
  return raw.trim();
}


// ──────────────────────────────────────────────────────────
// HELPER — Call Gemini with retry + fallback
//
// Flow:
//   Primary model × 3 attempts (exponential backoff: 2s, 4s, 8s)
//   ↓ still failing with retryable error
//   Fallback model × 1 attempt
//   ↓ still failing
//   Throw — caller returns clean error to frontend
// ──────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const MAX_ATTEMPTS = 3;

  // ── Attempt primary model with exponential backoff ──
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`Gemini model: ${GEMINI_PRIMARY_MODEL} — attempt ${attempt}/${MAX_ATTEMPTS}`);
      return await geminiRequest(GEMINI_PRIMARY_MODEL, prompt);

    } catch (err) {
      lastError = err;
      const code = err.status ?? err.code;
      console.error(`Gemini request failed: ${code ?? "?"} ${err.message?.slice(0, 120)}`);

      // Fatal errors — do not retry
      if (FATAL_CODES.has(code)) {
        console.error("Fatal Gemini error — not retrying (check API key or request format).");
        throw err;
      }

      // Retryable errors — wait then retry
      if (RETRYABLE_CODES.has(code) || code == null) {
        if (attempt < MAX_ATTEMPTS) {
          const wait = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Retrying Gemini request (${attempt}/${MAX_ATTEMPTS - 1})... waiting ${wait / 1000}s`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
      }

      // Non-retryable but non-fatal — break immediately
      break;
    }
  }

  // ── Primary model exhausted — try fallback once ──
  const fallbackCode = lastError?.status ?? lastError?.code;
  if (RETRYABLE_CODES.has(fallbackCode) || fallbackCode == null) {
    console.log(`Primary model unavailable. Trying fallback: ${GEMINI_FALLBACK_MODEL}`);
    try {
      const result = await geminiRequest(GEMINI_FALLBACK_MODEL, prompt);
      console.log(`✓ Fallback model succeeded: ${GEMINI_FALLBACK_MODEL}`);
      return result;
    } catch (fallbackErr) {
      console.error(`Fallback model also failed: ${fallbackErr.status ?? fallbackErr.code} ${fallbackErr.message?.slice(0, 80)}`);
    }
  }

  // ── Both models failed ──
  throw lastError;
}


// ──────────────────────────────────────────────────────────
// HELPER — Strip markdown fences and parse JSON safely
// ──────────────────────────────────────────────────────────

function parseGeminiJSON(raw) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse Gemini JSON response");
  }
}


// ──────────────────────────────────────────────────────────
// POST /api/upload — extract text from PDF / DOCX / TXT
// ──────────────────────────────────────────────────────────

app.post("/api/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No document uploaded" });
    }

    const { mimetype, originalname, buffer } = req.file;
    let text = "";

    if (mimetype === "application/pdf") {
      let parser;
      try {
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        text = result.text ?? "";
      } catch (pdfErr) {
        return res.status(400).json({
          error: "Unable to read this PDF. The file may be corrupted, password-protected, or image-only.",
          code: "PDF_PARSE_ERROR",
        });
      } finally {
        if (parser) await parser.destroy().catch(() => {});
      }

    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;

    } else if (mimetype === "text/plain") {
      text = buffer.toString("utf-8");

    } else {
      return res.status(400).json({
        error: "Only PDF, DOCX and TXT files are supported"
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "No text could be extracted from this document. If it is a scanned or image-only PDF, text extraction is not supported.",
        code: "NO_TEXT_EXTRACTED",
      });
    }

    // Limit text sent to Gemini to ~60k chars to stay within token budget
    const truncated = text.length > 60000 ? text.slice(0, 60000) + "\n[... document truncated ...]" : text;

    console.log(`✓ Processed: ${originalname} (${text.length} chars)`);

    res.json({
      message:    "Document processed successfully",
      filename:   originalname,
      text:       truncated,
      characters: text.length,
    });

  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Failed to process document. Please try again." });
  }
});


// ──────────────────────────────────────────────────────────
// POST /api/analyze — full structured document analysis
// ──────────────────────────────────────────────────────────

app.post("/api/analyze", async (req, res) => {
  try {
        console.log("\n========== /api/analyze REQUEST ==========");
    console.log("Filename:", req.body?.filename);
    console.log("Text length:", req.body?.text?.length);
    const { text, filename } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No document text provided" });
    }

    const prompt = `
You are FrestoDoc, an expert AI document intelligence system.

Analyze the provided document and return a comprehensive structured analysis.

DOCUMENT TYPES (pick the best fit):
contract, employment_agreement, rental_agreement, invoice, academic_syllabus,
assignment, research_paper, policy_document, legal_document, financial_document,
resume, report, government_document, meeting_notes, project_document, other

RETURN ONLY VALID JSON. NO markdown. NO code fences. NO extra text.

Use exactly this structure:

{
  "documentType": "contract",
  "documentTitle": "Document title if found, else null",
  "summary": "3-5 sentence executive summary",

  "keyPoints": ["point 1", "point 2"],

  "importantTopics": ["topic 1", "topic 2"],

  "risks": [
    {
      "title": "Short risk title",
      "severity": "high",
      "description": "What the risk is",
      "whyItMatters": "Why this could affect the user",
      "evidence": "Exact or near-exact quote from the document",
      "recommendation": "What the user should consider doing"
    }
  ],

  "missingInformation": [
    {
      "item": "Name of the missing item",
      "reason": "Why this would normally be expected",
      "importance": "high",
      "confidence": "high"
    }
  ],

  "actions": [
    {
      "task": "What needs to be done",
      "deadline": "YYYY-MM-DD or null",
      "deadlineText": "Human readable deadline or null",
      "responsibleParty": "Who is responsible or null",
      "priority": "high",
      "evidence": "Relevant document text",
      "completed": false
    }
  ],

  "importantDates": [
    {
      "date": "YYYY-MM-DD or null",
      "dateText": "Human readable date",
      "event": "Event name",
      "description": "What this date means",
      "importance": "high"
    }
  ],

  "keyInformation": [
    {
      "label": "Field name",
      "value": "Field value"
    }
  ],

  "actionItems": ["Action item 1", "Action item 2"],

  "availableActions": ["ask_document", "risk_scan", "find_gaps", "extract_actions"]
}

SEVERITY levels: "high", "medium", "low"
PRIORITY levels: "high", "medium", "low"
IMPORTANCE levels: "high", "medium", "low"

CRITICAL RULES:
- NEVER invent facts, names, dates, amounts or people not in the document
- Use "Potential issue", "Requires attention", "Possible risk" — never absolute legal/financial claims
- If no risks found: return []
- If no missing info found: return []
- If no dates found: return []
- If no actions found: return []
- Only extract evidence from the actual document text
- Return valid JSON only

DOCUMENT (filename: ${filename || "unknown"}):

${text}
`;

    console.log("Sending to Gemini for full analysis...");
        console.log("========== CALLING GEMINI ==========");
    const raw = await callGemini(prompt);
const analysis = parseGeminiJSON(raw);

// ─────────────────────────────────────────────
// SAVE DOCUMENT + ANALYSIS TO MONGODB
// ─────────────────────────────────────────────

const savedDocument = {
  filename: filename || "unknown",
  text,
  analysis,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mongoResult = await documentsCollection.insertOne(savedDocument);

console.log("✓ Analysis complete");
console.log("✓ Saved to MongoDB:", mongoResult.insertedId.toString());

res.json({
  success: true,
  analysis,
  documentId: mongoResult.insertedId.toString(),
});

  }  catch (error) {
    console.error("========================================");
    console.error("ANALYSIS ERROR");
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("Message:", error?.message);
    console.error("Full error:", error);
    console.error("========================================");

    const code = error?.status ?? error?.code;
    const isTemporary = RETRYABLE_CODES.has(code);

    res.status(500).json({
      error: isTemporary
        ? "AI analysis is temporarily unavailable. Please try again in a moment."
        : `AI analysis failed: ${error?.message || "Unknown backend error"}`,
      code: code ?? null,
    });
  }
});


// ──────────────────────────────────────────────────────────
// POST /api/ask — Document Q&A with evidence
// ──────────────────────────────────────────────────────────

app.post("/api/ask", async (req, res) => {
  try {
    const { question, text, filename } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "No question provided" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No document text provided" });
    }

    const prompt = `
You are FrestoDoc, an AI document assistant.

The user has a question about the document below.

Answer ONLY based on what is in the document. 
If the answer cannot be found, say exactly: "I couldn't find a reliable answer to this question in the uploaded document."
Do NOT invent information.
Do NOT hallucinate.

After the answer, provide the source evidence as a direct quote or near-quote from the document.

RETURN ONLY VALID JSON. NO markdown. NO code fences.

{
  "answer": "The direct answer to the question",
  "found": true,
  "evidence": "Relevant text from the document that supports this answer, or null",
  "confidence": "high"
}

CONFIDENCE: "high", "medium", "low"

Question: ${question}

Document (${filename || "unknown"}):
${text}
`;

    const raw = await callGemini(prompt);
    const result = parseGeminiJSON(raw);
    res.json({ success: true, result });

  } catch (error) {
    console.error("Q&A error:", error.status ?? error.code, error.message?.slice(0, 200));
    const isTemporary = RETRYABLE_CODES.has(error.status ?? error.code);
    res.status(500).json({
      error: isTemporary
        ? "AI is temporarily unavailable. Please try again in a moment."
        : "Q&A failed. Please try again.",
    });
  }
});


// ──────────────────────────────────────────────────────────
// POST /api/compare — Cross-document contradiction + diff
// ──────────────────────────────────────────────────────────

app.post("/api/compare", upload.fields([
  { name: "doc1", maxCount: 1 },
  { name: "doc2", maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files;

    if (!files || !files.doc1 || !files.doc2) {
      return res.status(400).json({ error: "Two documents are required for comparison" });
    }

    const extractText = async (file) => {
      if (file.mimetype === "application/pdf") {
        let parser;
        try {
          parser = new PDFParse({ data: file.buffer });
          const result = await parser.getText();
          return result.text ?? "";
        } finally {
          if (parser) await parser.destroy().catch(() => {});
        }
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const r = await mammoth.extractRawText({ buffer: file.buffer });
        return r.value;
      } else if (file.mimetype === "text/plain") {
        return file.buffer.toString("utf-8");
      }
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    };

    const [text1, text2] = await Promise.all([
      extractText(files.doc1[0]),
      extractText(files.doc2[0]),
    ]);

    const name1 = files.doc1[0].originalname;
    const name2 = files.doc2[0].originalname;

    // Truncate for token budget
    const t1 = text1.slice(0, 30000);
    const t2 = text2.slice(0, 30000);

    const prompt = `
You are FrestoDoc, an expert at comparing documents.

Compare the two documents below and identify:
1. Potential contradictions (conflicting information between the two documents)
2. Key differences (information that changed or differs)
3. Items only in Document A
4. Items only in Document B
5. Items that appear in both documents

RETURN ONLY VALID JSON. NO markdown. NO code fences.

{
  "doc1Name": "${name1}",
  "doc2Name": "${name2}",

  "contradictions": [
    {
      "topic": "What is in conflict",
      "doc1Value": "What Document A says",
      "doc2Value": "What Document B says",
      "doc1Evidence": "Relevant quote from Document A",
      "doc2Evidence": "Relevant quote from Document B",
      "severity": "high",
      "whyItMatters": "Why this conflict matters"
    }
  ],

  "changes": [
    {
      "topic": "What changed",
      "previousValue": "Value in Document A",
      "currentValue": "Value in Document B",
      "changeType": "modified",
      "significance": "Why this change may matter"
    }
  ],

  "onlyInDoc1": ["Item only in Document A"],
  "onlyInDoc2": ["Item only in Document B"],
  "inBoth": ["Item present in both documents"],

  "summary": "2-3 sentence summary of the key differences"
}

CHANGE TYPES: "added", "removed", "modified"
SEVERITY: "high", "medium", "low"

RULES:
- Only report genuine conflicts, not just different wording
- Include evidence quotes for contradictions
- Do not invent differences that are not there
- If no contradictions found, return []
- If no changes found, return []

DOCUMENT A (${name1}):
${t1}

DOCUMENT B (${name2}):
${t2}
`;

    console.log(`Comparing: ${name1} vs ${name2}`);
    const raw = await callGemini(prompt);
    const comparison = parseGeminiJSON(raw);
    res.json({ success: true, comparison });

  } catch (error) {
    console.error("Compare error:", error.status ?? error.code, error.message?.slice(0, 200));
    const isTemporary = RETRYABLE_CODES.has(error.status ?? error.code);
    res.status(500).json({
      error: isTemporary
        ? "AI comparison is temporarily unavailable. Please try again in a moment."
        : "Document comparison failed. Please check your files and try again.",
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/documents — get saved documents
// ──────────────────────────────────────────────────────────

app.get("/api/documents", async (req, res) => {
  try {
    const documents = await documentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .project({
        text: 0
      })
      .toArray();

    res.json({
      success: true,
      documents,
    });

  } catch (error) {
    console.error("MongoDB fetch error:", error);

    res.status(500).json({
      error: "Failed to load saved documents",
    });
  }
});
app.get("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid document ID",
      });
    }

    const document = await documentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!document) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    res.json({
      success: true,
      document,
    });

  } catch (error) {
    console.error("MongoDB document fetch error:", error);

    res.status(500).json({
      error: "Failed to load document",
    });
  }
});
// ──────────────────────────────────────────────────────────
// PUT /api/documents/:id/actions — save document actions
// ──────────────────────────────────────────────────────────

app.put("/api/documents/:id/actions", async (req, res) => {
  try {
    const { id } = req.params;
    const { actions } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid document ID",
      });
    }

    if (!Array.isArray(actions)) {
      return res.status(400).json({
        error: "Actions must be an array",
      });
    }

    const result = await documentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "analysis.actions": actions,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    console.log(
      `✓ Actions saved for document: ${id} (${actions.length} actions)`
    );

    res.json({
      success: true,
      message: "Actions saved successfully",
      actions,
    });

  } catch (error) {
    console.error("MongoDB action update error:", error);

    res.status(500).json({
      error: "Failed to save actions",
    });
  }
});
// ──────────────────────────────────────────────────────────
// GET / — health check
// ──────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ message: "FrestoDoc backend is running", version: "2.0" });
});


// ──────────────────────────────────────────────────────────
// START
// ──────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────
// START SERVER + CONNECT TO MONGODB
// ──────────────────────────────────────────────────────────

async function startServer() {
  try {
    await mongoClient.connect();

    db = mongoClient.db("FrestoDoc");
    documentsCollection = db.collection("documents");

    console.log("✓ MongoDB connected");
    console.log("✓ Database: FrestoDoc");
    console.log("✓ Collection: documents");

    app.listen(PORT, () => {
      console.log(`\n🚀 FrestoDoc server running on http://localhost:${PORT}`);
      console.log(
        `   GEMINI_API_KEY: ${
          process.env.GEMINI_API_KEY
            ? "✓ loaded"
            : "✗ MISSING — set in server/.env"
        }`
      );
      console.log(
        `   MONGODB_URI: ${
          process.env.MONGODB_URI
            ? "✓ loaded"
            : "✗ MISSING — set in server/.env"
        }\n`
      );
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
