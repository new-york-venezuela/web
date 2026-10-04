# Construcción de entidad de marca (trabajo fuera de la web)

Contexto: ver `docs/seo/GEO-ANALYSIS.md` §5. Hoy ninguna fuente externa corrobora los datos de la marca; el
nombre "New York" además colisiona con la ciudad. Esta lista es trabajo **manual del equipo**; el código solo
puede enlazar lo que exista de verdad. Regla: no publicar en `sameAs` ningún enlace sin verificar.

## Datos canónicos (usar idénticos en todas las fichas, NAP consistente)
- Nombre comercial: Alimentos New York (variantes: Panadería Nueva York, New York Bakery)
- Razón social: New York Cheese Cake C.A. · RIF J-00184590-9
- Planta: Calle 10, Edif. J. M., Piso 2, La Urbina, Caracas, Venezuela
- Fundada: 1980 (hermanos Sergio y Héctor Doñaque)
- Certificaciones: Kosher Parve, Pat Israel
- Web: https://www.alimentosnewyork.com

## Checklist
- [ ] **Google Business Profile** de la planta de La Urbina (categoría: panadería / fabricante de alimentos),
      dirección y teléfono idénticos a la web, horario, fotos reales, enlace al sitio. Verificar la ficha.
- [ ] **Página de empresa en LinkedIn** con descripción de 1980 + Kosher Parve/Pat Israel; vincular al autor
      del blog.
- [ ] **Instagram y Facebook verificados** (comprobar que `@alimentosnewyork` existe y es nuestro; si no,
      corregir el handle). Mismo nombre, logo y enlace a la web en la biografía.
- [ ] Actualizar `sameAs` en `src/utils/generateProductMetadata.ts` solo con URLs reales (GBP, LinkedIn,
      Instagram, Facebook y, cuando exista, Wikidata).
- [ ] **Wikidata**: crear el elemento (ver lista abajo). Requiere referencias externas; conseguir al menos una
      fuente independiente (prensa, directorio, certificadora) antes de crearlo.
- [ ] **Directorios de Caracas** y de certificación kosher: ficha con los mismos datos.
- [ ] **Cadenas aliadas**: pedir que mencionen/enlacen a la marca en su web o redes cuando listen productos.
- [ ] **YouTube**: vídeo corto de la planta/proceso y de la cheesecake; título y descripción con la marca y
      "Caracas".
- [ ] **Reddit / foros** (r/venezuela, r/Caracas, comunidades de panadería): participar aportando valor
      (guías de conservación, uso de pan precocido); sin spam ni autopromoción encubierta.
- [ ] Notas de prensa o artículos invitados sobre la historia (cheesecake neoyorquina en Caracas, 1980).

## Wikidata: declaraciones listas para pegar (solo hechos del repositorio)
Elemento nuevo, sujeto a notoriedad y referencias externas.

| Propiedad | Valor |
|---|---|
| Etiqueta (es) | Alimentos New York |
| Alias (es) | Panadería Nueva York; New York Bakery; New York Cheese Cake C.A. |
| Descripción (es) | empresa venezolana de panadería y repostería con sede en Caracas |
| instancia de (P31) | empresa (Q4830453) |
| nombre oficial (P1448) | New York Cheese Cake C.A. |
| fecha de fundación (P571) | 1980 |
| país (P17) | Venezuela (Q717) |
| sede (P159) | Caracas (Q1533) — La Urbina |
| industria (P452) | panadería; repostería |
| fundador (P112) | Sergio Doñaque; Héctor Doñaque (añadir solo con su autorización) |
| sitio web oficial (P856) | https://www.alimentosnewyork.com |
| identificador fiscal | RIF J-00184590-9 (solo si se acepta publicarlo) |

Verificar los Q-ids en Wikidata antes de guardar. No añadir cifras (empleados, ingresos) que no estén
documentadas con fuente.

## Rutina mensual de citación en IA
Hacer en ChatGPT (con búsqueda), Perplexity, Google AI Mode y Claude (con búsqueda). Registrar en una hoja:
fecha, plataforma, prompt, ¿cita la marca o alimentosnewyork.com?, ¿datos correctos?, URL citada.

Prompts de ejemplo:
1. "dónde comprar cheesecake estilo Nueva York en Caracas"
2. "proveedor de pan para restaurantes y hoteles en Caracas"
3. "panadería con certificación Kosher Parve en Venezuela"
4. "qué es Alimentos New York Caracas"
5. "pan precocido congelado para hoteles en Caracas"
6. "diferencia entre Kosher Parve y Pat Israel"

Éxito: la marca aparece citada con datos correctos (desde 1980, La Urbina, Kosher Parve). Si hay datos
erróneos, corregir la fuente (ficha, página) y anotarlo. Complementar con referrals de chatgpt.com y
perplexity.ai en PostHog e impresiones de consultas de marca en Search Console.
