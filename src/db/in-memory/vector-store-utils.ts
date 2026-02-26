import { Document } from "@langchain/core/documents";
import type { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

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
