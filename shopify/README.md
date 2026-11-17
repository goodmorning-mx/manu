# Widget de Shopify para Manu

Esta carpeta contiene una extensión de tema de Shopify con un bloque visual de
reseñas de producto. El cliente podrá añadirlo, moverlo, configurarlo y
previsualizarlo en el editor de temas. La puntuación y cantidad se leen de los
metafields estándar de Shopify `reviews.rating` y `reviews.rating_count`, que
Judge.me puede mantener actualizados. La cita y el autor opcionales se escriben
manualmente; muestra solo reseñas auténticas con permiso. El bloque no consulta
pedidos, no llama al backend de Manu y no altera carrito ni checkout.

## Estado de la app

La app `Manu Social Proof` ya está registrada en el Dev Dashboard de
`goodmorning.mx`, vinculada a este proyecto y seleccionada para la tienda de
desarrollo `tienda-dev-pruebas.myshopify.com`. Su configuración local está en
`shopify.app.toml`; sus permisos de API están vacíos. La extensión compila con
Shopify CLI. También se creó la versión de desarrollo `manu-social-proof-2`
con `--no-release`; aparece como inactiva y no se liberó a comercios. Está disponible en el
[Dev Dashboard](https://dev.shopify.com/dashboard/246659644/apps/446459576321/versions/1227236671489).

## Pendiente para probar e instalar

`shopify app dev` selecciona la tienda dev, pero Shopify pide la contraseña del
storefront antes de iniciar el preview. También se confirmó que la tienda
redirige a `/password`. El propietario puede quitar temporalmente esa protección
en la tienda dev o introducir la contraseña cuando el CLI la pida en una
terminal local; no enviarla por chat. La conexión del CLI a Shopify debe estar
activa.

Cuando la tienda esté accesible y el entorno tenga conexión, ejecutar desde esta
carpeta:

```sh
shopify app dev --store tienda-dev-pruebas.myshopify.com
```

Seguir el enlace de preview que muestre Shopify CLI, instalar la app de
desarrollo en esa tienda si lo solicita y abrir el editor del tema. Añadir el
bloque **Social proof** desde la sección **Apps** de la plantilla de producto.
Verificarlo con un producto que tenga los metafields de calificación de Judge.me.

Después de validar el preview, la app debe distribuirse a la tienda de Manu
(por ejemplo, mediante distribución personalizada) para que él la instale. Una
vez instalada, Manu agrega y configura el bloque desde
**Tienda online → Temas → Personalizar → Apps**.

Si la tienda usa un tema vintage, este bloque insertable puede no aparecer en
las secciones. En ese caso se necesitaría una variante *app embed* compatible,
que se activa en **Configuración del tema → App embeds**.

## Configuración del bloque

En el editor se pueden configurar el título, una reseña destacada, el autor, el
enlace y los colores. La puntuación y cantidad se leen automáticamente desde los
metafields del producto; el resumen no aparece si el producto no tiene esos
datos. Shopify documenta estos campos
estándar en <https://shopify.dev/docs/apps/build/metafields/list-of-standard-definitions>;
Judge.me explica la sincronización en
<https://judge.me/help/en/articles/8394936-displaying-product-ratings-and-review-counts-with-judge-me-metafields>.
