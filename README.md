# Registro de envíos — versión Android (PWA)

Prototipo móvil instalable desde el navegador Android. Registra cantidades agregadas por fecha y cliente, conserva los datos en el almacenamiento del dispositivo y ofrece filtros, gráficos, alta/actualización e importación/exportación CSV.

## Contenido

- `index.html`, `styles.css`, `app.js`: interfaz y funcionamiento adaptable a pantallas móviles.
- `manifest.webmanifest`: nombre, icono y modo de apertura como aplicación.
- `sw.js`: caché de archivos para abrir la aplicación sin conexión después de la primera visita.

## Cómo probar en Android

La instalación PWA necesita que los archivos estén servidos desde una dirección HTTPS (o desde `localhost`). Para una prueba rápida:

1. Publicar esta carpeta en un alojamiento HTTPS accesible desde el teléfono.
2. Abrir la dirección con Chrome o Samsung Internet.
3. Elegir **Instalar aplicación** o **Agregar a pantalla de inicio** en el menú del navegador.
4. Abrir el icono instalado y probar los datos ficticios.

Para probar desde una PC en la misma red, se puede iniciar un servidor local con `python -m http.server 8000` y acceder desde el teléfono a `http://IP-DE-LA-PC:8000`; ese método sirve para revisar la interfaz, aunque la instalación/offline suele requerir HTTPS o localhost.

## Datos

Los datos se guardan en `localStorage` del navegador de ese dispositivo. No se sincronizan con otros teléfonos ni con una base central. La primera apertura carga datos ficticios de 30 días y 5 clientes. Se pueden añadir registros, importar un CSV con columnas `fecha,cliente,cantidad` y exportar todos los registros.

## Alcance

La app consolida cantidades por día y cliente; no contiene información de cada paquete y no clasifica entregados, pendientes o no entregados. Para uso compartido en una empresa habría que conectar una API y una base de datos central, con autenticación y copias de seguridad.
