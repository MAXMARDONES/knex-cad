# K'NEX clásico: geometría, piezas y referencias para modelar en CAD

Investigación (2026-09-09) para el prototipo de controlador de escritorio: cama de teléfono con tilt en dos ejes (roll blando, pitch más rígido), retorno elástico y pantógrafo plano que amplifica el tilt hacia el desplazamiento X/Y de un mouse.

Restricciones que me diste a mitad de la investigación y que aplico aquí: **no hay rubber bands** en la caja, **sólo connectors clásicos** (no cuentes con hinges, ball joints ni clips especiales), **puede haber algunos flexi rods**, los rods normales tienen distinta rigidez según largo, y **la torsión es casi nula** (los rods casi no twistean). Por eso la sección de compliance se centra en flexión de rods, no en elásticos.

Nota sobre fuentes: la página madre de KUG (`knex-parts-lists-home.html`) es sólo un índice de listas de piezas por set; los datos técnicos reales están en los "Handy Hints" (A1–A18, W1–W11, M1–M4, S1–S7), en la tienda KUG y, sobre todo, en las **patentes de Glickman** (US 5,061,219 / 5,199,919 / 5,350,331), que son la única fuente primaria con dimensiones en pulgadas. No existe una página "K'NEX geometry / measurements" en KUG; lo más cercano son las Maths Activities 1–4.

---

## 1. Rods (varillas)

### 1.1 Largos clásicos

Hay dos "largos" para cada rod: el **oficial** (el que imprime KUG/K'NEX en catálogos) y el **real punta a punta** (medido con calibre; Instructables, Balmoral 1999 y `kneditor` coinciden dentro de ±0.5 mm). El número que importa para CAD es el **centro-a-centro (c-to-c)** entre los dos connectors que une un rod, que es exactamente `real + 2·d` con `d = 10 mm` (ver §2.4).

| # | Color clásico | Largo oficial (mm / in) | Largo real punta a punta (mm) | c-to-c entre connectors (mm) | c-to-c en "unidades" (verde = 1) | Part # KUG |
|---|---|---|---|---|---|---|
| 1 | Verde (green) | 16 / 11/16" | 17.25–17.5 | **37.5** | 1 | 90950 |
| 2 | Blanco (white) | 32 / 1 5/16" | 33 | **53.0** | √2 | 90951 |
| 3 | Azul (blue) | 54 / 2 1/4" | 55 | **75.0** | 2 | 90952 |
| 4 | Amarillo (yellow) | 86 / 3 7/16" | 86 | **106.1** | 2√2 | 90953 |
| 5 | Rojo (red) | 128 / 5 1/8" | 130 | **150.0** | 4 | 90954 |
| 6 | Gris (grey) | 190 / 7.5" | 192 | **212.1** | 4√2 | 90955 |

Variantes del mismo largo: rigid rod 128 mm tan (90957), rigid rod 190 mm negro (919561, "plástico más duro", KUG A7), rod 128 mm naranja (90958), y en sets de los 90 el rod gris de 7.5" es notoriamente más flexible que el negro del mismo largo (Balmoral, KUG A7). Rod más largo que existe: **steel rod 393 mm** (93008, sólo en la 6 ft Ferris Wheel). No hay rods plásticos clásicos más largos que 190 mm; para ejes largos KUG A17 recomienda encadenar rods con un connector naranja 2-way straight (suma exactamente 20 mm: yellow+orange+yellow = 86+20+86 = 192 = grey).

Ojo: KUG Hint A1 dice "120mm" para el rojo; es un typo, la tienda y todo lo demás dicen 128.

### 1.2 Regla √2 (por qué cierran los triángulos a 45°)

Patente US 5,350,331 (fórmula literal): `L_x = 1.414^(x-1) · D_min − 2·d`, donde `D_min` = c-to-c del rod más corto (37.5 mm) y `d` = distancia del eje del hub al fondo del socket (10 mm). Como los sockets están a 45°, dos rods iguales en ángulo recto forman un triángulo rectángulo isósceles cuya hipotenusa es el siguiente rod de la serie; y dos rods iguales unidos por un connector naranja (que suma 20 mm) miden lo mismo que el rod dos tamaños más grande (verde+naranja+verde = 55 = azul). Con los largos oficiales las cuentas no cierran; con los reales sí (Instructables PDF).

Serie derivada: c-to-c_n = 37.5 · √2^(n−1) → 37.5, 53.03, 75, 106.07, 150, 212.13 mm. Largo real = c-to-c − 20.

### 1.3 Geometría del rod (patentes)

- Diámetro nominal del extremo cilíndrico: **0.250" = 6.35 mm** (US 5,061,219). Envolvente del cuerpo en X: **≈0.244" = 6.2 mm** (US 5,350,331; coincide con los 6.2 mm que usan las librerías de impresión 3D).
- Cuerpo: sección **en X**, cuatro ribs a 90° con bordes biselados (US 5,061,219). Ancho de rib "0.93 inch" en el texto de la patente, casi seguro un typo por 0.093" ≈ 2.4 mm (no verificado).
- Extremo: cilindro liso + **ranura anular** + **flange** terminal. Ribs de bloqueo del socket con radio ≈0.088" (2.2 mm) centrados a 0.12" (3.0 mm) del fondo del socket ⇒ el centro de la ranura está ≈3 mm de la punta (US 5,350,331). Largo axial del flange "0.62 inch" en el texto, casi seguro 0.062" ≈ 1.6 mm (no verificado).
- A lo largo del cuerpo hay interrupciones cilíndricas periódicas ("ridges") separadas ≈ el ancho del brazo de agarre (0.35" ≈ 8.9 mm); ahí se hace la conexión **side-on**. El rod verde no tiene ridges: no admite side-on (KUG A2).
- Torsión: el rod en X es rígido a torsión y, como observaste, casi no twistea; la flexibilidad útil es **flexión**, y crece con el cubo del largo (ver §3).

### 1.4 Flexi rods

KUG A6: cuatro de los seis largos existen como flexi. Catálogo actual (knexreplacementparts): **32 mm** (light blue 91480B, purple 91480), **52 mm** (blue 91490, lilac 91490L; nota: 52, no 54), **86 mm** (orange 91282, dark orange, red 91283), **190 mm** (green 91108, fluo yellow 91107, violet 91109, purple 90966, clear 91110, black glitter 91101, yellow). En sets de los 90/2000 los flexi más comunes son el naranja 86 y los 190 de colores fluor/púrpura. Material: no verificado (más blando que el acetal de los rods normales).

---

## 2. Connectors clásicos

### 2.1 Tabla

Todas las posiciones son múltiplos de 45° medidos desde el eje del primer socket. Espesor y hub son iguales para toda la familia (patente: "predetermined, uniform thickness").

| Connector | Color clásico | # sockets | Posiciones angulares | Part # | Peso | Notas |
|---|---|---|---|---|---|---|
| 8-way | Blanco | 8 | 0,45,…,315 | 90908 | 3.63 g | "Snowflake". Modelo SketchUp 1:1: bbox 37.22 mm |
| 7-way 3D | Azul | 7 + slot | 7 sockets en 270° (225…495 en kneditor), slot donde iría el 8º | 90907 | 3.3 g | El slot acopla con otro 3D a 90° |
| 5-way | Amarillo | 5 | 0,45,90,135,180 | 90906 | | Medio círculo. Existe versión naranja con stud para track (90910) |
| 4-way | Verde | 4 | 0,45,90,135 | 90905 | | Abanico de 135°. No hay variante "90°" clásica; el 4-way de 90° sólo aparece en connectors 3D |
| 4-way 3D | Púrpura (hoy plata/gris 909091) | 4 + slot | 0,45,90,135 + slot perpendicular | 90909x | 2.17 g | Púrpura en sets 1990s–2000s |
| 3-way | Rojo | 3 | 0,45,90 | 90904 | | Cuarto de círculo |
| 2-way | Gris claro | 2 | 0,45 | 90903 | | V de **45°** (no 90°) |
| 2-way straight | Naranja | 2 | 0,180 | 90902 | | Suma 20 mm; sin sockets laterales |
| 1-way ("ender") | Gris oscuro | 1 | 0 | 90901 | | Tapa/arandela; MIT: se usa como spacer |

Combinaciones 3D (KUG A4): slot dentro de slot hasta oír el click; gris/gris, gris/azul, azul/azul; planos a 90°; en azul/azul dos posiciones quedan difíciles de usar (armar el rod antes de acoplar). El slot tiene ancho = espesor del connector (patente US 5,137,486: "guide wall spacing substantially equal to the thickness of the connector").

### 2.2 Dimensiones del connector (fuentes primarias)

- **Espesor: 0.244" = 6.2 mm** (US 5,350,331: "approximately 0.244 inch has been found to be particularly desirable"; ≈ diámetro del rod, para que connectors lado a lado sobre un rod llenen el cuerpo sin holgura). MIT lo mide como 2 spacers azules (2 × 3.1 = 6.2). `kneditor.scad` usa 6.2.
- **Hub central:** agujero **Ø ≈ 6.4 mm** ("approx. 6 mm / 1/4 in", tienda KUG; 6.4 en kneditor). El rod pasa y **gira/desliza libre** (patente: "slight clearance for rotation"). Diámetro exterior del hub ≈ 9 mm (kneditor, no verificado con calibre).
- **Radio exterior (centro → punta de los brazos): 18.6–18.75 mm** ⇒ diámetro ≈ 37.2–37.5 mm. Fuentes: modelo SketchUp 1:1 de L. McAdam (`modelWidthmm` 37.22), MIT (6 unidades de 3.125 = 18.75). El scad de kneditor da ≈17.5 (aprox., no calibrado).
- **Socket:** largo total ≈ **0.35" = 8.9 mm**; garganta **0.210" = 5.33 mm** (menor que el rod, por eso hace snap); ranuras cóncavas Ø0.250"; bordes de entrada divergen ≈15° (US 5,061,219).
- **d = distancia eje del hub → fondo del socket = 10 mm** (Instructables "connectors add 10 mm to each end"; kneditor coloca el rod a 10 mm del nodo; MIT: 18.75 − 8.9 ≈ 9.9). Es el número clave: `c-to-c = largo real + 20`.
- Agujeritos triangulares cerca del hub: ahí entra el lug del tan interlocking clip (W6) y el clip de extremo angulado (A15).

### 2.3 Las tres uniones (KUG A2) y qué grado de libertad dan

| Unión | Cómo | Cinemática para el CAD |
|---|---|---|
| **End-on** | Punta del rod entra lateralmente al socket, flange contra el fondo | Rígida en el plano; pequeña holgura fuera del plano. Posición: rod colineal con el socket, punta a `d = 10` del centro |
| **Side-on** | Un socket muerde el cuerpo del rod en una ridge | El connector queda perpendicular al rod y puede **girar con fricción alrededor del eje del rod** (pivote de fricción). Sólo en rods ≥ blanco |
| **Through-hole** | Rod atraviesa el hub | **Eje libre** (bearing): giro y deslizamiento axial sin fricción apreciable |

### 2.4 Otros connectors/clips (probablemente NO en tu caja, sólo referencia)

Hinge (mitades 90912 azul + 90919 negra; en sets viejos par azul/verde 90912/90913), clip with hole end (909011, hace un hinge poniendo un rod por su agujero, KUG A8), clip with rod end (90914), ball end 90940 + socket end 90945 (ball-and-socket, y versión large), tan interlocking clip (90900: bloquea rotación rod↔rueda/connector), snap cap (848900: tope de fin de rod), rod lock (A18: refuerza la unión rod/connector bajo carga), clip angled end (91690: rod a 45° del plano). Spacers: **azul 3.1 mm** (90994; la tienda dice "0.31mm", claramente cm), **plata 9.3 mm** (91224; "3 azules ≈ 1 plata"). Sin dimensiones para hinges ni ball joints en ninguna fuente (no verificado).

### 2.5 Ruedas, hubs y engranajes (por si sirven de pivote/polea)

Hub/pulley small **37 mm (1.5")**, hub medium **50 mm (2")**, tyre medium → 65 mm, large → 90 mm, small tyre 1.625"; wheel 25 mm black (versión closed-centre gira libre en la punta del rod; open-centre va apretada). Gears: 14 t Ø1" (blue/green small, gold; grey no se fija al eje), 34 t Ø2.25" (red/yellow), 58 t Ø3.5" (blue), 82 t Ø5" (yellow). Radios de engrane (MIT, en unidades de 3.125 mm): 3.5 / 8.5 / 20.5 → 10.9 / 26.6 / 64 mm; espesor 4 / 4 / 3 unidades.

---

## 3. Compliance y retorno sin rubber bands

Lo que existe en K'NEX clásico como fuente de energía/elasticidad: rubber bands (S2, W7; descartadas), string (S1), **spring motor** de cuerda (M1; no es un resorte utilizable), motores a pila (M2/M4: negro 22 rpm, azul 34, verde 45, rojo/plata 190; 2×AA), motor 12 V con tornillo sin fin (M3), solar (Balmoral). No existe ningún **coil spring** como pieza de construcción en sets clásicos (Big Ball Factory, Launcher, etc. no lo traen; no verificado exhaustivamente).

Opciones reales con tu caja:

1. **Rods como leaf springs (flexión).** El rod en X de acetal (E ≈ 2.6–3.2 GPa) trabaja como viga; la rigidez de un cantilever escala con `3EI/L³`. Con I ≈ 45 mm⁴ (círculo Ø6.2 = 72 mm⁴ reducido ~40% por la sección en X; **estimación, no verificado**) y E = 2.8 GPa:

| Rod libre (empotrado en un connector, carga en la punta) | L (mm) | k ≈ (N/mm) |
|---|---|---|
| Amarillo | 86 | ≈ 0.6 |
| Rojo | 130 | ≈ 0.17 |
| Gris 190 std | 192 | ≈ 0.05 (y KUG A14 confirma que "bends slightly" bajo carga) |
| Negro/tan rigid | 192 / 130 | más rígidos (plástico más duro; sin dato numérico) |

   Con eso puedes hacer el **pitch más rígido** con rods cortos (amarillo/rojo) y el **roll más blando** con grises largos o flexi rods, o duplicando rods en paralelo para sumar rigidez. Sujeta el extremo fijo con end-on (rígido) y deja el extremo móvil apoyado o con through-hole. Calibra midiendo: cuelga una masa conocida y mide la flecha; la fórmula sólo da órdenes de magnitud.

2. **Flexi rods como resorte de retorno.** Mucho más blandos; buenos para centrar el roll y como "gomas" curvas que empujan la cama de vuelta al centro. Sin dato de rigidez publicado (no verificado).

3. **Retorno por gravedad.** Cama pivotada por encima de su centro de masa (péndulo): con el teléfono puesto, el retorno es proporcional al peso; para pitch más rígido sube el pivote o agrega contrapeso con connectors blancos en un rod.

4. **String + peso** para pretensar sin elásticos (S1).

5. **Torsión:** como observaste, casi nula y no utilizable como resorte; en cambio cuenta con **holgura rotacional** en los sockets viejos.

---

## 4. Herramientas CAD y librerías existentes

| Recurso | Qué es | Formato / geometría | Licencia / notas |
|---|---|---|---|
| **kneditor** (github.com/jweather/kneditor) | CAD de K'NEX en Unity (C#), teclado numérico, simetrías, guarda/carga | **`Assets/Resources/kneditor.scad`**: OpenSCAD de todos los connectors clásicos (snowflake, yellow, green, red, gray, orange, ender, purple, blue) con socket paramétrico (r hub 9.5, espesor 6.2, hub Ø6.4, garganta 5.7, bloqueo Ø1.6 a 10 mm). `script.cs`: `rodUnits = {17.25, 33, 55, 86, 130, 192}` mm, nodos a `10 + L + 10`, pasos de 45° | **Sin archivo LICENSE** (pedir al autor). Geometría "designed from scratch", no calibrada con calibre. **Mejor punto de partida** para portar a tu CAD en Python |
| Printables 438817, H. Schravesande | "K'NEX Parts Library (Connectors and Rods)" | **STEP + STL** | Página tras CAPTCHA; licencia no verificada |
| Printables 600582 | Rods y connectors paramétricos clásico/micro/jumbo | Genera desde Ø (6.2 / 3.7 / 10.3 mm) y largo máximo | No verificado |
| Printables 143840 (coolsa) | K'Nex parts, customizable (OpenSCAD) | Notas de escala 60% micro | No verificado |
| Thingiverse 2464406 (joyeufetar) | Rod configurable en OpenSCAD (cualquier largo mm/in) | SCAD + STL | Bloqueado por bot-check; no verificado |
| Thingiverse tag `knex`/`knex_compatible` | 60° connector (4779328), rod lock (6596478), gears, universal joint, differential, spacers | STL | Varias licencias CC |
| SketchUp 3D Warehouse, Lothian McAdam | "K'NEX Standard 360 White Connector" p/n 90908, **1:1 en mm, 16,818 polígonos, bbox 37.22 × 37.22 mm**; también "Blue Notched Connector" | SKP v8 (+KMZ) | Descarga libre; el más preciso encontrado |
| 3D Warehouse "K'nex Pieces 2.0" / "K'Nex Pieces" | Colecciones con rods y connectors, con "snap guide flags" | SKP | No verificado |
| Princeton Joseph Henry Project | 6 rods, 10 connectors, 2 gears | **PTC Creo .prt** descargables | Sin cotas publicadas |
| GrabCAD tag `k-nex` ("Knex Connector – White", SolidWorks) | Modelos sueltos | SLDPRT/STEP | Sitio inaccesible desde aquí; no verificado |
| MyMiniFactory 13728 | Connector estándar imprimible | STL | CC BY-NC; "a bit snug" |
| MakerBrane "3D K'nex Builder Online" | Builder web | Sin export conocido | Bloqueado; no verificado |
| LDraw / Onshape público / "KnexCAD" oficial | **No existe** librería LDraw de K'NEX ni documento público Onshape encontrado; K'NEX nunca publicó CAD oficial | | Foro SSCoasters recomienda SketchUp/Inventor/SolidWorks |

Convenciones de dibujo en instrucciones oficiales: piezas dibujadas en color real, número junto a la pieza = **cantidad** (no part number), sub-ensambles por paso; la clave "actual size" de rods en la primera página (no verificado). Micro K'NEX (por si aparece mezclado): rods 14/25/40/63/94/138/200 mm, hub Ø≈3 mm, rod Ø3.7.

---

## 5. Mecanismos de referencia en K'NEX

- **Eje y rodamiento estándar:** rod (idealmente rigid negro/tan, KUG A7) a través del hub de uno o dos connectors; spacers azules (3.1) o plata (9.3) para fijar posición axial; tope con snap cap, dark-grey 1-way clipado o cualquier connector end-on; para que la rueda/connector **gire con** el eje, tan interlocking clip con el lug en el agujero triangular (W6) o rod lock (A18). Ruedas/hubs giran libres en la punta de un rod (W4/W5). Ratchet (W9) y cams con clips con hole end (A12) existen como piezas especiales.
- **Gimbal de dos ejes:** dos marcos anidados; el interior pivota en dos hubs coaxiales del exterior con un rod pasante, y el exterior en dos hubs de la base a 90°. Ejemplos: "Knex Camera Gimbal/stand" (Instructables; sólo fotos, sin instrucciones, incluye "phone holder with tilt mechanism" para un Galaxy S6, estabilizador interior/exterior y base tipo jaula), "Knex Phone Holder", "K'NEX 4x4 w/ working suspension & front steering" (suspensión con "some kind of spring / small rubber band", pivotes rod-through-hole con spacers metálicos 1½ y azules ½, dirección con ball joint + Y-clip). "Knex Steering Wheel" es decorativo.
- **Pantógrafo / scissor:** "Knex Ball Machine 'scissor arm' element" (usa "scissor lift geometry" para mover la bola lateralmente; pivotes = rods por hubs, con pulleys/hub/tyre de 1.5" como contrapeso) y "Knex Scissor Lift". El pivote canónico del pantógrafo es rod pasante + spacers + snap cap; para que no se abra fuera de plano, usa connectors dobles (12.4 mm) en cada nudo.
- **K'NEX + controles:** "K'nex Xbox Controller Auto Clicker" (manivela motorizada + "poker" articulado sobre un "controller bed" que sujeta el mando; motor 12 V o a pila, engranajes 34t/14t), "Computer Control Your K'nex" (Circuit Playground controlando motores). No encontré ningún mouse ni joystick analógico hecho en K'NEX (Instructables, YouTube, KUG gallery): tu rig sería inédito.
- **Debilidades del plástico viejo y remedios:** las piezas son **acetal copolímero (Celcon/POM)**; el POM sin estabilizar se fragiliza y pierde brillo con UV (meses de sol directo), y la humedad prolongada hincha ligeramente el plástico y hace que los rods "se salgan solos" (afirmación de blog knex-toys/knexco, no de KUG). Remedios: usar rigid rods para ejes, evitar el gris 190 en carga (A14: se dobla, reemplazar por 2 amarillos + naranja o 2 amarillos + 5-way amarillo entrelazados), no usar naranjas en rutas de carga y triangular (A3/A5, troubleshooting), rod locks o tan clips en uniones muy cargadas, duplicar connectors en un nudo, y reemplazar sockets vencidos con piezas impresas (Printables/Thingiverse; "a bit snug" es normal). Almacenar seco y sin sol (KUG Y1, tienda "Storage").

---

## Reglas geométricas para modelar K'NEX en CAD (números para el programador)

Sistema de unidades: mm. Origen de cada connector en el eje del hub; plano del connector = XY; eje del hub = Z.

- `ROD_D = 6.2` (envolvente del cuerpo en X); `ROD_END_D = 6.35` (cilindro terminal, 0.250"); modelar el rod como cilindro Ø6.2 es suficiente.
- `ROD_LEN_REAL = {green 17.5, white 33, blue 55, yellow 86, red 130, grey 192}` (±0.3; kneditor usa 17.25 para verde).
- `ROD_LEN_OFFICIAL = {16, 32, 54, 86, 128, 190}` (sólo para etiquetas/compras).
- `D_MIN = 37.5`; `CTC[n] = 37.5 · √2^(n−1)` = {37.5, 53.03, 75, 106.07, 150, 212.13}; `ROD_LEN_REAL = CTC − 20`.
- `d = 10.0` = distancia eje del hub → fondo del socket (donde apoya el flange); la punta del rod snap-eado queda a 10 mm del centro del connector, colineal con el socket.
- Rod side-on: eje del rod perpendicular al plano del connector, pasando por el centro de ese socket a radio `≈ 13.75` del hub (kneditor: seat del snap a 6.25 del origen del socket; **no verificado**, medir), sólo en ridges de rods ≥ blanco.
- `CONN_T = 6.2` (0.244"); `HUB_HOLE_D = 6.4` (rod gira libre); `HUB_OD ≈ 9` (no verificado); `CONN_R_OUT = 18.6–18.75` (Ø37.2–37.5); `SOCKET_LEN = 8.9`; `SOCKET_THROAT = 5.33`; ranura anular del rod a `≈3` de la punta, ribs de bloqueo r `≈2.2`.
- `SLOT_PITCH = 45°`; sockets: white 8 {0..315}, blue-3D 7 (270° + slot), yellow 5 {0..180}, green 4 {0..135}, purple-3D 4 {0..135} + slot ⟂, red 3 {0..90}, light-grey 2 {0,45}, orange 2 {0,180}, dark-grey 1 {0}.
- Acople 3D: dos connectors 3D se unen slot-en-slot con planos a 90°, compartiendo centro; ancho del slot = `CONN_T`.
- Orange 2-way: suma exactamente 20 mm entre puntas de dos rods colineales (c-to-c de los connectors vecinos = L1 + L2 + 40).
- Connectors apilados sobre un rod: paso `6.2`; spacers `BLUE = 3.1`, `SILVER = 9.3` (3 azules = 1 plata; 2 azules = 1 connector).
- Snapping en tu CAD: (a) end-on ⇒ rod colineal con socket, punta a `d`; (b) through-hole ⇒ rod ⟂ al plano por el origen, DOF: giro Z + deslizamiento Z; (c) side-on ⇒ rod ⟂ al plano a radio ≈13.75, DOF: giro alrededor del rod (fricción).
- Hinge/ball-joint: sin cotas publicadas (no verificado); si aparecen, medir.
- Regla de cierre: cualquier polígono con lados de la serie y ángulos múltiplos de 45° cierra exactamente porque `CTC` sigue √2 y `d` es constante para todos los connectors (patente: "fixed distance d ... maintained across all connector types").
- Ruedas/hubs: `HUB_SMALL_D = 37`, `HUB_MEDIUM_D = 50`; gears 14/34/58/82 t, radios de engrane 10.9 / 26.6 / – / 64.

---

## Fuentes

KUG (K'NEX User Group):
- https://www.knexusergroup.org.uk/me/knex-parts-lists-home.html (índice de parts lists)
- https://www.knexusergroup.org.uk/me/knex-parts-list-52443.html (Big Ball Factory, lista completa de part numbers)
- https://www.knexusergroup.org.uk/en/knex-hint-A1.html … A18 (A1 rods/connectors, A2 tres uniones, A4 3D connectors, A6 flexi, A7 rigid, A8 hinges, A9 ball & socket, A10 clips rod end, A12 cams, A14 grey 190, A15 angled clips, A16 snap caps, A17 ejes largos, A18 rod locks)
- https://www.knexusergroup.org.uk/en/knex-hint-W1.html … W11 (ruedas, hubs, ejes, interlocking clip, pulleys, ratchet)
- https://www.knexusergroup.org.uk/en/knex-hint-M1.html, M2, M3, M4 (motores)
- https://www.knexusergroup.org.uk/en/knex-hint-S1.html, S2, S7 (string, rubber bands, spinner)
- https://www.knexusergroup.org.uk/en/knex-maths-rods.html, knex-maths-connectors.html (Activities 1–2)
- https://www.knexusergroup.org.uk/en/knex-troubleshooting-tips.html, knex-storage.html
- https://shop.knexusergroup.org.uk/collections/knex-parts-rods, /collections/knex-parts-connectors, /collections/knex-parts-clips
- https://shop.knexusergroup.org.uk/products/90908, /90907, /909091, /90912, /90994, /91224, /909011, /90914, /93008

Patentes (texto completo):
- https://www.freepatentsonline.com/5061219.html (US 5,061,219 Construction toy: rod Ø0.250", garganta 0.210", socket 0.35", sección en X)
- https://www.freepatentsonline.com/5199919.html y https://www.freepatentsonline.com/5350331.html (US 5,199,919 / 5,350,331: espesor 0.244", fórmula L_x = 1.414^(x−1)·D_min − 2d, ribs r 0.088" a 0.12")
- US 5,137,486 (connectors multiplano; espesor "about 1/4 inch", slot = espesor)

Geometría medida por terceros:
- https://content.instructables.com/F0J/CV8L/JQ0TBSA7/F0JCV8LJQ0TBSA7.pdf ("K'Nex Rod Lengths": real 17.5/33/55/86/130/192, +10 mm por extremo)
- https://www.instructables.com/KNex-Length-Guide/
- http://web.mit.edu/~naha/Public/knex/about/Basic/knex.html y http://web.mit.edu/~naha/Public/knex/about/blue-units.html (unidad = spacer azul, connector = 2 unidades, radio 6, c-to-c 12/17/24/34/48/68)
- http://www.balmoralsoftware.com/knex/pieces/pieces.htm (1999: conteos de sets, tabla de largos combinados)
- http://faculty.mercer.edu/lackey_l/documents/K-NexPartsFigures.pdf (figuras: connectors, hubs 1.25"/1.5", tyres 1.625"/2.5"/3.5", gears 1"/2.25"/3.5"/5")

CAD / librerías:
- https://github.com/jweather/kneditor (kneditor; `Assets/Resources/kneditor.scad`, `Assets/script.cs`)
- https://www.printables.com/model/438817-knexknex-parts-library-connectors-and-rods
- https://www.printables.com/model/600582-knex-classicmicrojumbo-rods-and-connectors
- https://www.printables.com/model/143840-knex-parts-customizable
- https://www.thingiverse.com/thing:2464406, https://www.thingiverse.com/tag:knex, https://www.thingiverse.com/thing:4779328, https://www.thingiverse.com/thing:6596478
- https://embed-3dwarehouse-classic.sketchup.com/model/f720f16ff5ab252b48f9ceabd33c1c4c/KNEX-Standard-360-White-Connector (+ API https://3dwarehouse.sketchup.com/warehouse/v1.0/entities/f720f16ff5ab252b48f9ceabd33c1c4c)
- https://3dwarehouse.sketchup.com/model/973b5c47-b959-4d26-8562-66250da8a2b2/Knex-Pieces-20
- https://commons.princeton.edu/josephhenry/knex-parts-in-creo/
- https://grabcad.com/library/tag/k-nex, https://grabcad.com/library/knex-connector-white
- https://www.myminifactory.com/object/3d-print-knex-connector-13728
- https://www.yeggi.com/q/knex/
- https://beta.makerbrane.com/part-set/knex/
- http://www.sscoasters.net/forum/topic/15719-any-good-cad-programs-for-blueprinting-knex/

Mecanismos y material:
- https://www.instructables.com/Knex-Camera-Gimbalstand/, https://www.instructables.com/Knex-Phone-Holder/, https://www.instructables.com/Knex-Steering-Wheel/
- https://www.instructables.com/Knex-ball-machine-scissor-arm-element/, https://www.instructables.com/Knex-Ball-Lifter-1/
- https://www.instructables.com/KNEX-4x4-w-working-suspension-steer/
- https://www.instructables.com/Knex-Xbox-Controller-Auto-Clicker/, https://www.instructables.com/Knex-Motor-External-Control-Hack/
- https://knexreplacementparts.com/product-category/classic-rods/flexi-rods/, /classic-connectors/, /spacers-washers/, búsqueda "rubber band" (92001/92010/92013/92002)
- https://knex.parts/parts/
- https://www.encyclopedia.com/books/politics-and-business-magazines/knex-industries-inc (acetal copolímero, 4× el precio del polipropileno)
- https://knex-toys.com/knex-connectors/ → https://knexco.com/ (humedad/sol; afirmación de blog)
- https://tangram.co.uk/wp-content/uploads/Plastics-Data-File-POM.pdf (POM y UV)
