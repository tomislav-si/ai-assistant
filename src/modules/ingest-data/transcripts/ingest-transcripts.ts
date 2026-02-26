import path from "node:path";
import { Document } from "@langchain/core/documents";
import { JSONLoader } from "@langchain/classic/document_loaders/fs/json";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const OLLAMA_EMBEDDING_MODEL = "bge-m3:latest";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

const TRANSCRIPTS_DIR = path.resolve(process.cwd(), "src", "mock-data", "transcripts");
const TRANSCRIPT_FULL = "meeting-transcript.json";
const TRANSCRIPT_SMALL = "meeting-transcript-small.json";

/**
 * Loads transcript JSON files and splits them into document chunks.
 * Used internally by ingestTranscripts to create the initial document set.
 * Set USE_SMALL_TRANSCRIPT_EXAMPLE=true to use the small file for faster testing.
 *
 * @returns Array of Document chunks
 */
export async function loadTranscriptDocuments(): Promise<Document[]> {
  const useSample = process.env.USE_SMALL_TRANSCRIPT_EXAMPLE === "true";
  console.log(`Using ${useSample ? "small" : "full"} transcript example`);
  const filename = useSample ? TRANSCRIPT_SMALL : TRANSCRIPT_FULL;
  const filePath = path.join(TRANSCRIPTS_DIR, filename);
  const loader = new JSONLoader(filePath);
  const rawDocuments = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  return splitter.splitDocuments(rawDocuments);
}

/**
 * Ingests transcript JSON files from mock-data/transcripts/ using LangChain and Ollama.
 * Loads all .json files, splits them with RecursiveCharacterTextSplitter,
 * embeds with Ollama (bge-m3), and returns an initialized MemoryVectorStore.
 *
 * @returns The initialized MemoryVectorStore containing embedded transcript chunks
 */
export async function ingestTranscripts(): Promise<MemoryVectorStore> {
  const documents = await loadTranscriptDocuments();

  const embeddings = new OllamaEmbeddings({
    model: OLLAMA_EMBEDDING_MODEL,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  return vectorStore;
}
