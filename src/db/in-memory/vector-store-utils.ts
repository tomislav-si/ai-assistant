import { Document } from "@langchain/core/documents";
import type { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

/**
 * Logs a sample entry from the vector store for debugging transcript ingestion.
 *
 * @param store - MemoryVectorStore to sample from
 */
export async function logSampleVectorStoreEntry(
  store: MemoryVectorStore
): Promise<void> {
  const [sample] = await store.similaritySearch("meeting", 1);
  if (sample) {
    console.log("[Transcript ingestion] Sample entry:", {
      pageContent: sample.pageContent.slice(0, 150) + "...",
      metadata: sample.metadata,
    });
  }
}

/**
 * Extracts Document chunks from a MemoryVectorStore.
 * Reuses the same chunks used for embeddings (single source of truth).
 *
 * @param store - MemoryVectorStore containing embedded document chunks
 * @returns Array of Document chunks
 */
export function getDocumentsFromVectorStore(store: MemoryVectorStore): Document[] {
  return store.memoryVectors.map(
    (mv) => new Document({ pageContent: mv.content, metadata: mv.metadata })
  );
}
