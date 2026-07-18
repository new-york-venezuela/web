import { defineCollection, z } from 'astro:content';

const productosCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    id: z.string(),
    descripcion_seo: z.string().min(100).max(160),
    palabras_clave: z.array(z.string()).min(3).max(10),
    categoria_primaria: z.enum(['supermarket', 'foodservice']),
    categoria_secundaria: z.enum(['panes', 'reposteria', 'especialidades', 'pizza']),
    imagen: z.string(),
    imagen_alt: z.string(),
    destacado: z.boolean().optional(),
    og_type: z.string().optional()
  })
});

export const collections = {
  productos: productosCollection
};
