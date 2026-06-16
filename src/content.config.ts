import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(".md", "")
  }),

  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = {
  blog,
};