import { type Collection, deepEquals } from "@tanstack/react-db";

export const CURRENT = "current";

type CurrentRow = { id: string };

export async function writeCurrentRow<T extends CurrentRow>(
  collection: Collection<T, string, any>,
  data: Omit<T, "id"> | null,
) {
  const existing = collection.get(CURRENT);

  if (data === null) {
    if (existing) await collection.delete(CURRENT).when("settled");
    return;
  }

  if (!existing) {
    await collection.insert({ id: CURRENT, ...data } as T).when("settled");
    return;
  }

  const unchanged = Object.entries(data).every(([key, value]) =>
    deepEquals(existing[key as keyof typeof existing], value),
  );
  if (unchanged) return;

  await collection
    .update(CURRENT, (draft) => {
      Object.assign(draft, data);
    })
    .when("settled");
}
