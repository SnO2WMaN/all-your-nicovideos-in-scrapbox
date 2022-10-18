import { Application, Router } from "oak/mod.ts";

const app = new Application();
const router = new Router();

const fetchFromScrapbox = async (query: string, project: string) => {
  const result = (
    await fetch(
      `https://scrapbox.io/api/pages/${project}/search/query?skip=0&limit=100&q="${query}"`,
    ).then((res) => res.json())
  );
  const lines: string[] = result.pages.map(({ lines }: { lines: string[] }) => lines).flat();
  const count: number = result.count;
  return { lines, count };
};

const fetchRecursive = async (base: string, project: string, id: string): Promise<string[]> => {
  if (id.length === 9) return [];
  if (id.startsWith("0")) return [];

  const { count, lines } = await fetchFromScrapbox(`${base}${id}`, project);
  if (count < 100) return lines;

  return [
    ...(await fetchRecursive(base, project, id + "0")),
    ...(await fetchRecursive(base, project, id + "1")),
    ...(await fetchRecursive(base, project, id + "2")),
    ...(await fetchRecursive(base, project, id + "3")),
    ...(await fetchRecursive(base, project, id + "4")),
    ...(await fetchRecursive(base, project, id + "5")),
    ...(await fetchRecursive(base, project, id + "6")),
    ...(await fetchRecursive(base, project, id + "7")),
    ...(await fetchRecursive(base, project, id + "8")),
    ...(await fetchRecursive(base, project, id + "9")),
  ];
};

export const fetchAllNicovideoId = async (project: string) => [
  ...await fetchRecursive("https://www.nicovideo.jp/watch/sm", project, ""),
  ...await fetchRecursive("https://nico.ms/sm", project, ""),
];

router.get("/:project", async ({ params, response }) => {
  const project = params.project;

  const res = await fetchAllNicovideoId(project);
  console.dir(res);
  response.body = JSON.stringify(res);
});
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 9000 });
