import { createServerFn } from "@tanstack/react-start";
import type { Worker } from "@/data/workers";
import { categoryToSkillSlug, skillSlugToCategory } from "@/lib/workers.shared";

export { categoryToSkillSlug, skillSlugToCategory };

export const searchWorkers = createServerFn({ method: "POST" })
  .inputValidator((d: { category: string; area: string }) => d)
  .handler(async ({ data }): Promise<Worker[]> => {
    const { searchWorkersFromFirestore } = await import("@/lib/workers.firestore.server");
    return searchWorkersFromFirestore(data.category, data.area);
  });

export const getWorkerById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<Worker | null> => {
    const { getWorkerByIdFromFirestore } = await import("@/lib/workers.firestore.server");
    return getWorkerByIdFromFirestore(data.id);
  });

export const saveWorker = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { name: string; skill: string; area: string; experience: number; phone: string }) => d,
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { saveWorkerToFirestore } = await import("@/lib/workers.firestore.server");
    return saveWorkerToFirestore(data);
  });

export const listAllWorkers = createServerFn({ method: "GET" }).handler(async (): Promise<Worker[]> => {
  const { listAllWorkersFromFirestore } = await import("@/lib/workers.firestore.server");
  return listAllWorkersFromFirestore();
});
