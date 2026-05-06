# Plan de mejoras UI/UX — moto-routes

Cada fase es independiente y puede ejecutarse en una sesión separada.
Marca cada tarea con `[x]` al completarla.

---

## Fase 1 — Fundamentos de diseño
> Base visual que todas las fases siguientes reutilizan. Hacerla primero evita
> refactorizar estilos dos veces.

### 1.1 Sistema de tokens de diseño
- [x] Crear `src/theme.ts` con paleta, tipografía y espaciados

**Archivos a crear/editar:** `src/theme.ts`

**Pasos:**
1. Crear `src/theme.ts` con tres objetos exportados: `colors`, `typography`, `spacing`.
2. `colors`: definir `primary` (#FF6B00), `danger` (#e53935), `success` (#4CAF50),
   `info` (#2196F3), `surface` (#fff), `background` (#f5f5f5), `textPrimary` (#1a1a1a),
   `textSecondary` (#666), `textMuted` (#999), `border` (#ddd), `overlay` (rgba 0,0,0,0.4).
3. `typography`: definir tamaños nombrados — `xs:10`, `sm:12`, `base:14`, `md:16`,
   `lg:18`, `xl:22`, `xxl:26` — y pesos `regular:400`, `semibold:600`, `bold:700`.
4. `spacing`: escala de 4 pt — `xs:4`, `sm:8`, `md:12`, `lg:16`, `xl:24`, `xxl:32`.
5. Reemplazar los literales hardcodeados en `MapScreen`, `RoutesListScreen` y
   `RouteDetailScreen` importando desde `theme.ts`.

**Testing:**
- Arrancar la app y verificar que los tres screens se ven idénticos al estado anterior.
- Cambiar un color en `theme.ts` (ej. primary a rojo) y confirmar que el cambio se
  propaga a FAB, botón activo de modo y confirmación de modal sin tocar ningún screen.
- Revertir el cambio de prueba.

---

### 1.2 Safe area en el toolbar del mapa
- [x] Corregir que los botones del toolbar no queden bajo la gesture bar de Android

**Archivos a editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. Instalar si no existe: `expo install react-native-safe-area-context` (ya está como
   dependencia transitiva de React Navigation, sólo importar).
2. Importar `useSafeAreaInsets` de `react-native-safe-area-context`.
3. Obtener `const { bottom } = useSafeAreaInsets()` dentro del componente.
4. Reemplazar el `bottom: 24` fijo del style `toolbar` por
   `bottom: Math.max(24, bottom + 8)` usando un style dinámico en el JSX en lugar
   del StyleSheet estático (pasar `style={[styles.toolbar, { bottom: Math.max(24, bottom + 8) }]}`).
5. Verificar que `SafeAreaProvider` envuelve la app (ya está vía NavigationContainer).

**Testing:**
- En Pixel 7a (gesture navigation): los botones no deben quedar cortados por la barra
  del sistema.
- En un emulador con botones de navegación clásicos: los botones deben quedar a 24 pt
  del borde como antes.
- Rotar a landscape y verificar que el toolbar sigue siendo accesible.

---

### 1.3 Touch targets mínimos de 44 pt
- [x] Aumentar área táctil en botones de texto (Eliminar, Cancelar, Agregar)

**Archivos a editar:** `src/screens/RoutesListScreen.tsx`, `src/screens/MapScreen.tsx`

**Pasos:**
1. En `RoutesListScreen`: al botón "Eliminar" agregarle
   `paddingVertical: 8, paddingHorizontal: 4` para que el área táctil supere los 44 pt.
2. En `MapScreen` modal: a los botones "Cancelar" y "Agregar" del modal agregarles
   `paddingVertical: 10, paddingHorizontal: 8`.
3. Verificar con `accessibilityLabel` que los lectores de pantalla los describen
   correctamente (ver tarea de accesibilidad si se implementa).

**Testing:**
- En dispositivo físico con dedo, intentar tocar "Eliminar" rozando apenas el texto.
  Debe activarse con mayor margen que antes.
- Verificar que el área visual no cambió (el padding no debe añadir fondo visible si
  el botón no tiene `backgroundColor`).

---

## Fase 2 — MapScreen: flujo de edición

### 2.1 Indicador de modo activo en el mapa
- [x] Mostrar un banner contextual sobre el mapa que describe el modo actual

**Archivos a editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. Crear un objeto de mensajes indexado por `DrawingMode`:
   ```ts
   const MODE_HINT: Partial<Record<DrawingMode, string>> = {
     drawing:    'Toca el mapa para trazar la ruta',
     checkpoint: 'Toca el mapa para marcar un checkpoint',
     note:       'Toca el mapa para dejar una nota',
     tracking:   'Grabando con GPS…',
   };
   ```
2. Renderizar un `View` con `position: absolute, top: 16` centrado horizontalmente,
   solo si `MODE_HINT[mode]` existe. Usar pill style (fondo oscuro semitransparente,
   border radius 20, texto blanco).
3. El banner NO debe aparecer en modo `idle` ni `newRoute`.

**Testing:**
- Activar modo "Dibujar": debe aparecer el banner. Tocarlo no debe hacer nada (no
  es interactivo, ponerle `pointerEvents="none"`).
- Volver a idle tocando "Dibujar" de nuevo: el banner desaparece.
- Activar GPS: el banner cambia a "Grabando con GPS…".
- Verificar que el banner no bloquea interacciones en el mapa debajo de él.

---

### 2.2 Deshacer último punto dibujado
- [x] Agregar botón "↩ Deshacer" que elimina el último punto del path

**Archivos a editar:** `src/screens/MapScreen.tsx`, `src/services/RouteService.ts`

**Pasos:**
1. En `RouteService.ts` agregar:
   ```ts
   const removeLastPathPoint = (route: Route): Route => ({
     ...route,
     path: route.path.slice(0, -1),
     updatedAt: Date.now(),
   });
   ```
   Exportarlo en el objeto `RouteService`.
2. En `MapScreen`, mostrar el botón "↩ Deshacer" solo cuando
   `mode === 'drawing' && currentRoute && currentRoute.path.length > 0`.
3. El handler llama a `setCurrentRoute(prev => prev && RouteService.removeLastPathPoint(prev))`.
4. Estilizar igual que `btn` (fondo oscuro) pero más pequeño, a la izquierda del toolbar.

**Testing:**
- Dibujar 5 puntos → tocar Deshacer 3 veces → deben quedar 2 puntos en el polyline.
- Deshacer hasta 0 puntos: el botón desaparece.
- Cambiar a modo checkpoint y verificar que el botón de deshacer no aparece.
- Deshacer con 1 punto → dibujar otro → el polyline sigue funcionando correctamente.

---

### 2.3 Checkpoints y notas disponibles durante tracking GPS
- [x] Permitir agregar checkpoints y notas mientras el GPS está grabando

**Archivos a editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. En el bloque JSX que renderiza los botones de modo, el `currentRoute && mode !== 'tracking'`
   es la condición que oculta todo. Cambiarlo para que durante tracking solo se muestren
   los botones de checkpoint, nota y "Detener" (no Dibujar, no GPS, no Guardar):
   ```tsx
   {currentRoute && (
     <>
       {mode !== 'tracking' && <TouchableOpacity ...>Dibujar</TouchableOpacity>}
       <TouchableOpacity ...>Checkpoint</TouchableOpacity>
       <TouchableOpacity ...>Nota</TouchableOpacity>
       {mode !== 'tracking' && <TouchableOpacity ...>● Grabar GPS</TouchableOpacity>}
       {mode !== 'tracking'
         ? <TouchableOpacity ...>Guardar</TouchableOpacity>
         : <TouchableOpacity ...>■ Detener</TouchableOpacity>
       }
     </>
   )}
   ```
2. El `handleMapPress` ya maneja checkpoint y note en cualquier modo; solo asegurarse
   de que `mode === 'tracking'` no bloquee esos eventos (actualmente sí los bloquea
   porque solo `drawing`, `checkpoint` y `note` hacen algo).
3. Después de confirmar el checkpoint/nota durante tracking, el `setMode('idle')` del
   `handleModalConfirm` rompería el tracking. Cambiar para que al confirmar en modo
   tracking vuelva a `'tracking'` y no a `'idle'`:
   ```ts
   setMode(LocationService.isTracking() ? 'tracking' : 'idle');
   ```

**Testing:**
- Iniciar tracking GPS → tocar "Checkpoint" → tocar el mapa → rellenar nombre → confirmar.
  El modal se cierra y el tracking sigue (el modo vuelve a 'tracking', no a 'idle').
- El counter de checkpoints en la lista de rutas debe reflejar el checkpoint añadido.
- Iniciar tracking → agregar nota → detener → guardar → revisar en RouteDetailScreen
  que la nota aparece con coordenadas dentro del trayecto.

---

### 2.4 Renombrar etiqueta del botón GPS y agregar contador de puntos
- [x] Mejorar la comunicación del estado de grabación GPS

**Archivos a editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. Cambiar la etiqueta del botón de `'● GPS'` a `'⏺ Grabar ruta'`.
2. Durante tracking, mostrar en el banner de modo (tarea 2.1) el conteo dinámico:
   `Grabando… ${currentRoute.path.length} pts`.
3. El botón "Detener GPS" (durante tracking) debe decir `'⏹ Detener grabación'`
   para mayor claridad.

**Testing:**
- Iniciar tracking y observar que el contador en el banner incrementa cada ~5 segundos
  (según el `timeInterval` de LocationService).
- El botón "Grabar ruta" debe ser suficientemente descriptivo para un usuario nuevo.

---

### 2.5 Advertencia de cambios sin guardar al salir
- [x] Mostrar confirmación si el usuario presiona atrás con una ruta no guardada

**Archivos a editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. Importar `useNavigation` y `usePreventRemove` (disponible en React Navigation 7+)
   o alternativamente usar el evento `beforeRemove`:
   ```ts
   useEffect(() => {
     const unsubscribe = navigation.addListener('beforeRemove', (e) => {
       if (!currentRoute || currentRoute.path.length === 0) return;
       e.preventDefault();
       Alert.alert(
         'Salir sin guardar',
         'La ruta tiene cambios sin guardar. ¿Descartar?',
         [
           { text: 'Cancelar', style: 'cancel' },
           { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
         ]
       );
     });
     return unsubscribe;
   }, [navigation, currentRoute]);
   ```
2. La condición de activación es: `currentRoute !== null && currentRoute.path.length > 0`.
   Si el usuario creó la ruta pero no trazó ningún punto, salir libremente.

**Testing:**
- Crear ruta → dibujar 3 puntos → presionar atrás del sistema → debe aparecer el Alert.
  Tocar "Cancelar" → se queda en la pantalla. Tocar "Descartar" → sale sin guardar.
- Crear ruta → NO dibujar puntos → presionar atrás → debe salir sin Alert.
- Guardar una ruta correctamente → presionar atrás → debe salir sin Alert (ya guardó).

---

### 2.6 Confirmación de guardado sin Alert bloqueante
- [x] Reemplazar Alert.alert de guardado por un toast no-modal

**Archivos a crear/editar:** `src/components/Toast.tsx`, `src/screens/MapScreen.tsx`

**Pasos:**
1. Crear `src/components/Toast.tsx`: un componente que recibe `message: string` y
   `visible: boolean`, se posiciona en `top: 60` con `position: absolute`,
   fondo oscuro semitransparente, texto blanco, y se auto-oculta a los 2 segundos
   usando un `useEffect` con `setTimeout`.
   ```tsx
   useEffect(() => {
     if (!visible) return;
     const t = setTimeout(onHide, 2000);
     return () => clearTimeout(t);
   }, [visible]);
   ```
   Exportarlo desde `src/components/index.ts`.
2. En `MapScreen`, reemplazar el `Alert.alert` del `handleSave` por:
   - Llamar a `RouteService.saveRoute(currentRoute)`
   - Mostrar el toast ("Ruta guardada")
   - Después de 2 segundos el toast se oculta y navegar atrás usando `navigation.goBack()`
     dentro del `onHide` callback.
3. Agregar `toastVisible` y `setToastVisible` como estado en `MapScreen`.

**Testing:**
- Guardar una ruta: debe aparecer la barra de toast en la parte superior sin bloquear
  la pantalla, y después de 2 segundos navegar automáticamente a la lista.
- Abrir y cerrar el mapa sin guardar: el toast no debe aparecer.
- Guardar y tocar rápidamente otro botón antes de que el toast desaparezca: no debe
  haber doble guardado ni doble navegación.

---

## Fase 3 — RoutesListScreen: lista y cards

### 3.1 Swipe-to-delete en lugar de botón "Eliminar"
- [x] Eliminar el botón de texto dentro de la card y reemplazar por gesto de deslizar

**Archivos a editar:** `src/screens/RoutesListScreen.tsx`

**Pasos:**
1. Instalar: `expo install react-native-gesture-handler` (ya está). Verificar que
   `react-native-gesture-handler` esté importado en `index.ts` (ya está con
   `import 'react-native-gesture-handler'`).
2. Usar el componente `Swipeable` de `react-native-gesture-handler` envolviendo cada card.
3. Crear `renderRightActions` que devuelve un botón rojo de "Eliminar" que aparece al
   deslizar a la izquierda.
4. Al confirmar la eliminación dentro del swipe, mostrar el mismo `Alert.alert` actual
   como confirmación antes de borrar.
5. Eliminar el `TouchableOpacity` de "Eliminar" y su style del JSX y StyleSheet.

**Testing:**
- Deslizar una card a la izquierda: debe aparecer el área roja con "Eliminar".
- Tocar el área roja: debe aparecer el Alert de confirmación.
- Confirmar eliminación: la card desaparece de la lista.
- Cancelar en el Alert: el swipeable vuelve a la posición original.
- Deslizar a la derecha: no debe hacer nada (solo izquierda tiene acción).
- Tocar la card sin deslizar: navega al detalle normalmente.

---

### 3.2 Mostrar distancia y fecha en las cards
- [x] Calcular distancia total de la ruta y mostrarla junto a la fecha en la card

**Archivos a crear/editar:** `src/services/RouteService.ts`, `src/screens/RoutesListScreen.tsx`

**Pasos:**
1. En `RouteService.ts` agregar una función `calculateDistance(path: Coordinate[]): number`
   que implementa la fórmula Haversine y devuelve distancia en kilómetros:
   ```ts
   const EARTH_RADIUS_KM = 6371;
   const toRad = (deg: number) => (deg * Math.PI) / 180;

   const calculateDistance = (path: Coordinate[]): number => {
     let total = 0;
     for (let i = 1; i < path.length; i++) {
       const prev = path[i - 1];
       const curr = path[i];
       const dLat = toRad(curr.latitude - prev.latitude);
       const dLon = toRad(curr.longitude - prev.longitude);
       const a =
         Math.sin(dLat / 2) ** 2 +
         Math.cos(toRad(prev.latitude)) *
           Math.cos(toRad(curr.latitude)) *
           Math.sin(dLon / 2) ** 2;
       total += EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     }
     return total;
   };
   ```
   Exportarla en `RouteService`.
2. En `RoutesListScreen`, dentro del `renderItem`, calcular
   `const km = RouteService.calculateDistance(item.path)` y mostrarlo en el subtítulo
   como `${km.toFixed(1)} km · ${item.checkpoints.length} pts · ${item.notes.length} notas`.
3. Agregar la fecha formateada: `new Date(item.createdAt).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })`.

**Testing:**
- Ruta con 0 puntos GPS: debe mostrar "0.0 km".
- Ruta creada con GPS tracking de distancia conocida (~100m en un cuadrado):
  verificar que el resultado es razonable (no exacto, pero del orden correcto).
- Ruta con solo puntos manuales muy dispersos: verificar que la suma de segmentos
  se refleja en el total.
- La fecha mostrada debe corresponder al día en que se creó la ruta.

---

### 3.3 Empty state con CTA
- [x] Mejorar el estado vacío de la lista para guiar al usuario

**Archivos a editar:** `src/screens/RoutesListScreen.tsx`

**Pasos:**
1. Reemplazar el `ListEmptyComponent` actual (solo texto) por un componente inline
   con:
   - Ícono o ilustración simple (puede ser un emoji grande "🏍️").
   - Título: "Aún no tienes rutas".
   - Subtítulo: "Toca el botón + para crear tu primera ruta".
   - Una flecha o indicador apuntando hacia abajo-derecha hacia donde está el FAB.
2. Centrar verticalmente usando `flex: 1, justifyContent: 'center'` en el
   `contentContainerStyle` del FlatList cuando la lista está vacía.

**Testing:**
- App sin rutas: debe mostrarse el empty state centrado en la pantalla.
- App con al menos una ruta: el empty state no debe mostrarse.
- El FAB debe seguir siendo visible sobre el empty state.

---

## Fase 4 — RouteDetailScreen: información y acciones

### 4.1 Mapa embebido en el detalle de ruta
- [x] Mostrar un MapView no-interactivo con el polyline de la ruta en la pantalla de detalle

**Archivos a editar:** `src/screens/RouteDetailScreen.tsx`

**Pasos:**
1. Importar `MapView` de `react-native-maps` y `RouteMap` de `../components`.
2. Calcular la región inicial a partir de los puntos del path:
   ```ts
   const getRegionFromPath = (path: Coordinate[]) => {
     if (path.length === 0) return null;
     const lats = path.map(p => p.latitude);
     const lons = path.map(p => p.longitude);
     const minLat = Math.min(...lats), maxLat = Math.max(...lats);
     const minLon = Math.min(...lons), maxLon = Math.max(...lons);
     return {
       latitude: (minLat + maxLat) / 2,
       longitude: (minLon + maxLon) / 2,
       latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.01),
       longitudeDelta: Math.max((maxLon - minLon) * 1.4, 0.01),
     };
   };
   ```
3. Renderizar el `MapView` con `height: 220`, `scrollEnabled={false}`,
   `pitchEnabled={false}`, `rotateEnabled={false}`, `zoomEnabled={false}` para que
   sea un mapa de solo lectura (no-interactivo).
4. Mostrar el mapa solo si `route.path.length > 0`; si no hay puntos, mostrar un
   placeholder de texto "Sin recorrido trazado".
5. Renombrar el botón de acción principal a "Ver / Editar en el mapa" o bien separarlo
   en dos: "Ver en el mapa" (scrollEnabled true, sin controles de edición) en el
   futuro. Por ahora actualizar el texto a "Editar ruta".

**Testing:**
- Ruta con path: el mapa debe mostrar la ruta centrada con algo de margen.
- Ruta con path de un solo punto: el mapa muestra ese punto centrado con
  `latitudeDelta / longitudeDelta` de 0.01 (el `Math.max` del cálculo).
- Ruta sin path (0 puntos): aparece el placeholder de texto, no el MapView.
- El mapa no debe responder a gestos (scroll, zoom, rotación).
- El scroll de la pantalla debe funcionar por encima del mapa.

---

### 4.2 Eliminar coordenadas crudas y mostrar distancia
- [x] Reemplazar lat/lon en checkpoints y notas por la distancia calculada

**Archivos a editar:** `src/screens/RouteDetailScreen.tsx`, reutiliza `RouteService.calculateDistance`

**Pasos:**
1. Eliminar el `<Text style={styles.itemCoord}>` en checkpoints y notas.
2. En el encabezado de la ruta, debajo de la fecha, agregar:
   `${RouteService.calculateDistance(route.path).toFixed(1)} km recorridos`
   usando el mismo cálculo de la Fase 3.2.
3. Si la distancia es 0 (ruta sin puntos GPS), no mostrar la línea de distancia.

**Testing:**
- En RouteDetailScreen, las coordenadas numéricas ya no deben aparecer.
- La distancia en km debe coincidir con la mostrada en la card de la lista (misma función).
- Ruta sin puntos: no aparece ninguna línea de distancia.

---

### 4.3 Ocultar secciones vacías de checkpoints y notas
- [x] No renderizar la sección si no hay elementos

**Archivos a editar:** `src/screens/RouteDetailScreen.tsx`

**Pasos:**
1. Envolver el bloque de checkpoints en `{route.checkpoints.length > 0 && (...)}`.
2. Envolver el bloque de notas en `{route.notes.length > 0 && (...)}`.
3. Si ambas están vacías, mostrar un mensaje único: "Sin checkpoints ni notas aún."

**Testing:**
- Ruta sin checkpoints ni notas: no deben aparecer las secciones con "(0)".
  En su lugar aparece el mensaje único.
- Ruta con checkpoints pero sin notas: solo aparece la sección de checkpoints.
- Ruta con ambas: ambas secciones visibles.

---

### 4.4 Renombrar ruta desde el detalle
- [x] Permitir al usuario editar el nombre de la ruta

**Archivos a editar:** `src/screens/RouteDetailScreen.tsx`, `src/services/RouteService.ts`,
`src/services/DatabaseService.ts`

**Pasos:**
1. En `DatabaseService.ts` agregar:
   ```ts
   const renameRoute = (id: string, name: string): void => {
     const database = getDb();
     database.runSync(
       'UPDATE routes SET name = ?, updated_at = ? WHERE id = ?',
       [name, Date.now(), id]
     );
   };
   ```
   Exportarlo en `DatabaseService`.
2. En `RouteService.ts` agregar:
   ```ts
   const renameRoute = (id: string, name: string): void =>
     DatabaseService.renameRoute(id, name);
   ```
   Exportarlo.
3. En `RouteDetailScreen`, hacer el título tappable: reemplazar
   `<Text style={styles.title}>` por un `TouchableOpacity` que abre el `AppModal`
   con un `TextInput` prellenado con el nombre actual.
4. Al confirmar, llamar `RouteService.renameRoute(route.id, newName)` y actualizar
   el estado local con `setRoute(prev => prev && { ...prev, name: newName })`.
5. Agregar un ícono de lápiz "✏️" inline junto al título para indicar que es editable.

**Testing:**
- Tocar el título: debe abrirse el modal con el nombre actual prellenado.
- Borrar y escribir un nombre nuevo → confirmar: el título en pantalla cambia.
- Volver a la lista: la card debe mostrar el nuevo nombre.
- Confirmar con el campo vacío: no debe guardar (el botón "Guardar" debe estar
  deshabilitado visualmente si `modalInput.trim() === ''`).
- Cancelar: el nombre original no debe cambiar.

---

### 4.5 Eliminar ruta desde el detalle
- [x] Agregar opción de eliminar desde RouteDetailScreen

**Archivos a editar:** `src/screens/RouteDetailScreen.tsx`

**Pasos:**
1. Agregar un botón "Eliminar ruta" debajo del botón "Editar ruta" con estilo de
   `color: danger` (rojo), fondo transparente, solo texto.
2. Al tocar, mostrar `Alert.alert` de confirmación ("¿Eliminar esta ruta permanentemente?").
3. Al confirmar, llamar `RouteService.deleteRoute(route.id)` y luego
   `navigation.goBack()`.

**Testing:**
- Tocar "Eliminar ruta" → aparece el Alert. Cancelar → permanece en el detalle.
- Confirmar → navega a la lista y la ruta no aparece.
- La eliminación desde el detalle y desde la lista deben dar el mismo resultado en la DB.

---

## Fase 5 — Discoverability y onboarding

### 5.1 Empty state en MapScreen con instrucciones
- [x] Cuando no hay ruta activa, mostrar texto orientador sobre el mapa

**Archivos a editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. Cuando `!currentRoute && mode === 'idle'`, renderizar un `View` centrado sobre
   el mapa (position absolute, ignorar gestos con `pointerEvents="none"`) con el
   texto: "Toca '+ Ruta' para comenzar a trazar tu recorrido".
2. Estilizar con fondo semitransparente claro, border radius y texto oscuro para
   que sea legible sobre cualquier mapa.

**Testing:**
- Primera apertura del MapScreen (sin routeId): debe aparecer el mensaje.
- Crear una ruta: el mensaje desaparece.
- Regresar al mapa para editar una ruta existente: el mensaje no debe aparecer.

---

### 5.2 Tooltips de primer uso en los modos
- [x] Mostrar un hint la primera vez que el usuario activa el modo "drawing"

**Archivos a crear/editar:** `src/screens/MapScreen.tsx`

**Pasos:**
1. Usar `AsyncStorage` (disponible en Expo vía `@react-native-async-storage/async-storage`)
   para recordar si el usuario ya vio el hint.
   Instalar: `expo install @react-native-async-storage/async-storage`.
2. Al activar modo `'drawing'` por primera vez, mostrar un `Alert.alert` simple:
   "Modo dibujo activo\nToca el mapa para agregar puntos al recorrido. Usa '↩ Deshacer'
   para borrar el último punto."
3. Guardar en AsyncStorage la clave `'hint_drawing_seen': 'true'` para no volver a
   mostrarlo.
4. Hacer lo mismo para modo `'checkpoint'` y modo `'note'` con sus respectivos hints.

**Testing:**
- Desinstalar la app (limpia el AsyncStorage) → abrir → activar modo drawing:
  debe aparecer el hint.
- Cerrar y reabrir la app → activar modo drawing: el hint NO debe aparecer de nuevo.
- Activar checkpoint por primera vez: su propio hint aparece (independiente del de drawing).

---

## Orden de ejecución recomendado

```
Fase 1 (1.1 → 1.2 → 1.3)   ← base visual, sin ella los estilos se repiten
Fase 2 (2.1 → 2.2 → 2.3)   ← flujo núcleo de la app
Fase 3 (3.1 → 3.2 → 3.3)   ← lista de rutas
Fase 4 (4.1 → 4.2 → 4.3 → 4.4 → 4.5)  ← pantalla de detalle
Fase 5 (5.1 → 5.2)           ← discoverability, la más opcional
Fase 2 (2.4 → 2.5 → 2.6)   ← pulido del mapa, requiere 2.1-2.3 hechos
```

---

## Resumen de archivos involucrados

| Archivo | Fases |
|---|---|
| `src/theme.ts` *(nuevo)* | 1.1 |
| `src/components/Toast.tsx` *(nuevo)* | 2.6 |
| `src/screens/MapScreen.tsx` | 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2 |
| `src/screens/RoutesListScreen.tsx` | 1.3, 3.1, 3.2, 3.3 |
| `src/screens/RouteDetailScreen.tsx` | 1.3, 4.1, 4.2, 4.3, 4.4, 4.5 |
| `src/services/RouteService.ts` | 2.2, 3.2, 4.4 |
| `src/services/DatabaseService.ts` | 4.4 |
| `src/components/index.ts` | 2.6 |
