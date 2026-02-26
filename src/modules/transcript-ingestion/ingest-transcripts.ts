import path from "node:path";
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { JSONLoader } from "@langchain/classic/document_loaders/fs/json";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const OLLAMA_EMBEDDING_MODEL = "bge-m3:latest";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Resolves the transcripts directory path for Node.js.
 * Works from both project root (npm run) and when running via ts-node.
 */
function getTranscriptsPath(): string {
  const cwd = process.cwd();
  const transcriptsPath = path.join(cwd, "src", "mock-data", "transcripts");
  return path.resolve(transcriptsPath);
}

/**
 * Ingests transcript JSON files from mock-data/transcripts/ using LangChain and Ollama.
 * Loads all .json files, splits them with RecursiveCharacterTextSplitter,
 * embeds with Ollama (qwen3:8b), and returns an initialized MemoryVectorStore.
 *
 * @returns The initialized MemoryVectorStore containing embedded transcript chunks
 */
export async function ingestTranscripts(): Promise<MemoryVectorStore> {
  const transcriptsDir = getTranscriptsPath();

  const loader = new DirectoryLoader(transcriptsDir, {
    ".json": (filePath: string) => new JSONLoader(filePath),
  });

  const rawDocuments = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const documents = await splitter.splitDocuments(rawDocuments);

  const embeddings = new OllamaEmbeddings({
    model: OLLAMA_EMBEDDING_MODEL,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  return vectorStore;
}
