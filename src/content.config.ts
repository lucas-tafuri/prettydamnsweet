import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    client: z.string().optional().default(''),
    thumbnail: z.string().optional().default(''),
    mainVideo: z.string().optional().default(''),
    secondVideo: z.string().optional().default(''),
    thirdVideo: z.string().optional().default(''),
    fourthVideo: z.string().optional().default(''),
    styleFrames: z.array(z.string()).optional().default([]),
    processDescription: z.string().optional().default(''),
    processVideo: z.string().optional().default(''),
    processImages: z.array(z.string()).optional().default([]),
    btsDescription: z.string().optional().default(''),
    btsVideo: z.string().optional().default(''),
    btsPhotos: z.array(z.string()).optional().default([]),
    credits: z.string().optional().default(''),
    categories: z.array(z.string()).optional().default([]),
    order: z.number().optional().default(0),
    featured: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { projects };
