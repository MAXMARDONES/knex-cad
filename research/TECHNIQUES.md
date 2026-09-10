# K'NEX clásico: técnicas de construcción (frames, joints, mecanismos)

Investigación (2026-09-10), extiende `KNEX.md` (leer ahí §1.2 regla √2, §2.3 las tres uniones, §5 mecanismos de referencia — no repetido aquí). Fuente principal: KUG Handy Hints (texto completo scrapeado, no sólo el índice), más foros e Instructables. Restricciones del proyecto: **sin rubber bands, sin hinges, sin ball joints**; sólo connectors/rods clásicos + algún flexi rod.

---

## 1. Frames rígidos

- **Regla de oro (KUG A3 "Strong 2D structures", troubleshooting-tips):** construir con **cuadrados, no rectángulos** — un cuadrado siempre se puede reforzar con una diagonal más larga (la serie √2 de KNEX.md §1.2); un rectángulo arbitrario no cierra con un rod estándar. Evitar el **2-way naranja** (90902) en cualquier ruta de carga: sólo tiene 2 sockets a 180°, no acepta un brazo diagonal. Usar **amarillo (5-way) o rojo (3-way)** en su lugar, que sí aceptan sockets a 45°/90° además del eje principal.
- **"Sword blade" — viga 2D larga y angosta (KUG A3):** dos rieles con **connectors amarillos**, **rods azules** arriba y abajo (largo constante = cuerda), **rods blancos en zigzag** conectando los dos rieles entre nodos consecutivos. Es el equivalente K'NEX de una viga tipo Warren/ladder-beam — el término "ladder beam"/"box beam" no es nativo de K'NEX, es la analogía más cercana documentada.
- **Bridge span 3D (KUG A5):** mismo patrón pero **connectors amarillos + rods rojos** arriba/abajo, **rods amarillos en zigzag**; las dos caras del puente se unen con **rods rojos side-on** a los connectors amarillos. Advertencia explícita de KUG: **no usar 3D connectors (azul/gris) en la cara inferior de un span** — está en tensión y los 3D connectors pueden separarse (el slot-en-slot no resiste tracción tan bien como end-on).
- **Caja/cubo (KUG A5):** para las 4 esquinas de una cara, **3D connectors** (combinaciones grey/grey, grey/blue, blue/blue — ver §6 gotchas por posiciones bloqueadas); cada cara del cubo con 4 rods largos (ej. amarillo) formando el cuadrado, reforzada con 4 rods cortos (ej. rojo) en diagonal — "a combination of red/yellow or yellow/blue rods". Motivo explícito de KUG: el triángulo reparte una fuerza vertical en el vértice como fuerza longitudinal en el rod de base — cita casi literal de por qué funciona la triangulación.
- **Por qué el 8-way blanco NO cierra una esquina de cubo por sí solo:** sus 8 sockets son **coplanares** (mismo plano XY, KNEX.md §2.1). Un vértice real de cubo necesita 3 ejes ortogonales — para eso hacen falta los 3D connectors (azul/gris) que sí tienen el slot perpendicular (KUG A4). El 8-way sirve como nodo plano de alta conectividad (cruces de rejilla, radios de rueda), no como esquina 3D.
- **Nodos "double connector" (fuera de plano):** apilar un segundo connector en el mismo rod/posición para que el nudo no se abra fuera de su plano — paso entre dos connectors apilados = `CONN_T = 6.2 mm` (KNEX.md §2.2). No encontré este término como jerga establecida en KUG/foros — lo describo por la geometría, márcalo **no verificado como nombre**, pero la práctica en sí (duplicar connectors en un nudo cargado) sí está confirmada por KNEX.md §5 ("Debilidades del plástico viejo y remedios").
- **Esquinas rectas en 2D:** un ángulo de 90° en el plano de un connector amarillo/rojo se arma con dos sockets a 45° de separación entre sí ocupados por dos rods iguales — no existe socket nativo "a 90°" en los connectors planos salvo eligiendo dos posiciones separadas por 90° dentro de su abanico (amarillo 5-way cubre 0–180°, rojo 3-way 0–90°: el 3-way es literalmente "un cuarto de círculo", ideal para esquinas rectas limpias).

## 2. Frames reforzados y spans largos

- **Alternativas al gris 190mm cuando se dobla (KUG A14, texto completo):**
  1. Barato: **2× amarillo 86mm + 1× naranja 2-way recto** (mismo largo total, 192mm, pero cada segmento más corto ⇒ menos flexión).
  2. Mejor: **2× amarillo 86mm + 1× connector 5-way amarillo** en el medio — y estos 5-way intermedios se pueden **interconectar entre sí** ("interconnected... to give greater strength") formando una **retícula/lattice** a lo largo del span, no sólo un punto de apoyo. Es la técnica real para vigas largas sin que floppee.
- **Evitar racking (torsión del frame) — combinación de reglas ya vistas:** (a) triangular cada cara con la diagonal √2 correcta (§1 y KNEX.md §1.2), (b) usar 3D connectors sólo donde la cara no esté en tensión pura (A5), (c) duplicar connectors en nudos de alta carga, (d) usar rigid rods (negro/tan, KUG A7) en los ejes que reciben más flexión.
- **Shafts largos apilando connectors (KUG A13):** técnica documentada para bastones/ejes largos: connector blanco 8-way → 4 rods rojos side-on a intervalos iguales (4 de los 8 sockets, a 90°) → empujar el connector a un extremo de esos 4 rods → otro blanco 8-way al otro extremo (side-on) → repetir agregando 4 rods más en los 4 slots que quedaron libres → otro blanco, etc. Da un eje/mástil recto y grueso, indefinidamente extensible, todo en side-on (fricción, no rígido axialmente salvo por fricción — ver §4).
- **Racks/guías rígidas horizontales (KUG G4, "Rack and Pinion"):** una escalera de connectors naranja ("ladder") se usó como cremallera lineal accionada por un engranaje — confirma que el naranja recto, aunque débil en 2D general (§1), es el connector correcto cuando lo que quieres es exactamente una fila recta sin sockets laterales que estorben.

## 3. El truco del rod verde y otros "rods ocultos"

*(KNEX.md §1.4 ya cubre qué flexi rods existen; esto es sobre el rod verde rígido como espaciador geométrico, no repetido ahí.)*

- **Verde entre dos connectors = "brazo a brazo" (arm-to-arm), c2c 37.5 mm:** es el rod más corto (KNEX.md §1.1) y, al no tener ridges, **no admite side-on** (KUG A2) — sólo end-on en sus dos puntas. Por eso su único uso estructural es como "espaciador end-on" fijo entre dos connectors: no se puede clipar a mitad de camino como los demás rods.
- **Usos derivados de esa propiedad (geometría, no jerga de fuente):**
  - **Apilar connectors offset:** poner un verde entre dos connectors del mismo tipo los separa exactamente 37.5 mm centro-a-centro, útil para crear un "hub grueso" de dos nodos coaxiales sin que sus brazos se toquen (ver clash en §6).
  - **Desfasar un plano por un largo fijo:** cualquier geometría que necesite "un plano completo corrido X mm" puede insertar un verde en cada uno de los rods que cruzan de un plano al otro — mantiene el ángulo pero suma 17.5 mm de rod real + 20 mm de connectors en cada extremo.
  - **Serie√2 como generador de "rods ocultos":** un naranja 2-way recto (90902) suma exactamente 20 mm entre dos rods colineales (KNEX.md §2.1) — combinado con la regla √2, cualquier largo de la serie puede sintetizarse a partir de dos más cortos + naranja (ya explotado en A14, §2). No hay otro "hidden rod trick" documentado en KUG más allá de estos dos (verde como spacer mínimo, naranja como sumador).

## 4. Joints y fricción

| Unión | DOF real | Fricción / fuerza observada | Slop / falla bajo carga | Cómo se ajusta |
|---|---|---|---|---|
| **End-on** (punta en socket) | Rígida en el plano; leve holgura fuera de plano | Snap fuerte pero de **poca fuerza para armar** — KUG A2/troubleshooting: "you don't need a lot of strength"; si cuesta, es porque el rod no está bien alineado sobre el slot antes de empujar, no por diseño | Puede reventar/abrirse bajo tracción sostenida, sobre todo en 3D connectors en tensión (A5, ver §1) o piezas viejas (§6) | **Rod lock (A18)**: se desliza sobre el rod hasta cubrir el punto de unión, reduce apertura bajo carga alta (usado en sets K-Force / Son of Serpent) |
| **Side-on** (connector muerde una ridge) | Connector ⟂ al rod, **gira con fricción** alrededor del eje del rod | Requiere **empujar fuerte** ("push quite hard") — KUG A2 dice explícitamente que niños pequeños pueden tener dificultad; sólo funciona en ridges, no en los ~9mm finales de cada punta ni en rod verde (sin ridges) | Si lo intentas muy cerca de la punta, no hace clic — hay que reposicionar cerca del centro y deslizar | Mover el punto de side-on más cerca o lejos del centro no cambia la fricción rotacional en sí (mismo mecanismo de ridge), sólo la posición axial |
| **Through-hole** (rod atraviesa el hub) | **Eje libre**: gira + desliza axialmente, sin fricción apreciable (bearing) | Ninguna fuente cuantifica en N·m; cualitativamente "free spinning" en todas las fuentes (KUG W3–W9, MIT) | Puede deslizarse axialmente solo si no hay tope | Fijar posición axial con **spacers azul (3.1mm)/plata (9.3mm)** + tope (**snap cap**, connector end-on, o dark-grey 1-way clipado) |
| **Rod a través del hub + tan clip** | Bloquea el giro relativo: el rod ahora **gira CON** el connector/rueda | — | — | **Tan interlocking clip (90900)**: el lug entra en el agujerito triangular junto al hub (KUG W6, troubleshooting: "you have probably not used a tan clip to join the rod to the wheel") — es el mecanismo estándar para que un eje motorizado mueva una rueda en vez de patinar dentro del hub |
| **3D connector slot-en-slot** | Rígido, dos planos fijos a 90° entre sí, comparten centro | Snap fuerte, "push hard enough to hear a click" (troubleshooting) | Débil en tensión pura (ver bridge span, §1); **posiciones bloqueadas** ver §6 | Separar los dos 3D connectors, montar el rod en la posición difícil primero, y luego reunir el par (receta exacta de KUG A4) |
| **Ratchet (W9, pieza especial)** | Gira en **un solo sentido** | Bronce/negro con clip tan bloqueando un sentido | — | Volteado el "ratchet inner black" invierte el sentido permitido — útil como damper de retorno unidireccional (p.ej. para que un mecanismo no vuelva de golpe) |
| **Stub axle (W8, pieza especial)** | Rueda libre montada al costado de un 5-way/8-way, no en la punta de un rod normal | Libre (mismo criterio que through-hole en la punta) | — | Usar cuando la rueda debe girar libre pero el rod principal está ocupado (ej. ejes delanteros no motorizados) |
| **Skid plate / eye centre (S3, pieza especial)** | Domo liso al final de un rod, sin socket | **Bajo-fricción por diseño** — pensado para deslizar contra una superficie (patín de vehículo) | — | Útil como pie deslizante de baja fricción para un rig que se apoya y desliza sobre una mesa, no sólo para "eyes" decorativos |

No encontré en ninguna fuente (patentes, KUG, foros) una cifra en Newtons o N·m para fuerza de snap/pull-out de un socket K'NEX — **no verificado**, sólo descripciones cualitativas ("push hard", "click").

## 5. Mecanismos con piezas clásicas (sin rubber bands / hinges / ball joints)

- **Pivote/bearing estándar:** rod a través del hub de uno o dos connectors + spacers (azul/plata) para fijar posición axial + tope (snap cap o connector end-on). Para que gire CON el eje en vez de patinar: tan clip (W6) o rod lock (A18) — ver §4.
- **Gimbal de 2 ejes:** marco interior pivota en dos hubs coaxiales del marco exterior (rod pasante through-hole); marco exterior pivota en dos hubs de la base a 90° del primer eje. Nodo de pivote recomendado: **5-way o 8-way** (dan margen para además clipar el resto de la estructura del marco en los sockets libres). Ejemplos ya citados en KNEX.md §5 (Knex Camera Gimbal, Knex Phone Holder); ninguno usa ball joints para el gimbal en sí — el ball joint que aparece en el 4×4 con suspensión es sólo para la dirección, no aplica a nuestra restricción.
- **Slider / guía lineal:** un solo connector through-hole sobre un rod ya es un carro que traslada+gira; para **traslación pura** (bloquear el giro) se necesita un segundo rod paralelo con un segundo connector, y unir ambos connectors rígidamente entre sí (cross-rod) — así el par de connectors forma un carro de 2 puntos que sólo puede trasladar a lo largo de los dos rieles. Esta construcción de "carro de 2 rieles" no está documentada como receta única en KUG; es una derivación directa de que through-hole por sí solo no bloquea rotación (**marcar como derivado, no citado**).
- **Cranks:** un connector plano (5-way/8-way) fijo a un eje through-hole, con un rod end-on en uno de sus sockets exteriores (radio `CONN_R_OUT ≈ 18.6–18.75 mm` del hub, KNEX.md §2.2), traza un círculo de ese radio al girar el eje — es el crank-arm K'NEX. Conectar ese rod a un carro-slider (arriba) da un mecanismo crank-slider clásico con piezas 100% estándar.
- **Pantógrafo / scissor:** el pivote canónico es rod pasante + spacers + snap cap (KNEX.md §5, "Knex Ball Machine scissor arm element"). Limitación real: un rod K'NEX no tiene un "punto medio" con hub — el pivote de un brazo de tijera sólo puede caer en una **ridge** (side-on, cada ≈8.9mm) o en una punta (end-on/through-hole), así que un pantógrafo perfectamente simétrico sólo se aproxima al múltiplo de ridge más cercano al centro. No verificado cuantitativamente cuánto error de simetría introduce esto.
- **Four-bar linkage:** ejemplos reales en ball machines — "crazy arms" (dos brazos unidos por un pivote, movimiento de colapso que empuja la bola) y "cooperating arms" (Instructables, KneXtreme / Darth Trainman guides a K'NEX ball-machine elements). Construcción: 4 rods como manivela-acoplador-balancín-bastidor, cada pivote es through-hole libre salvo el que se quiera frenar (side-on con fricción a propósito).
- **Lever con fulcro:** side-on o through-hole sobre un rod fijo = fulcro; carga y esfuerzo en connectors a distintas distancias a lo largo del mismo rod o de un segundo rod paralelo al brazo.
- **Retorno por gravedad + contrapeso (confirmado en ball machines reales):** el "chain dropper" clásico de Instructables usa un contrapeso y una garra que vuelve sola a su posición cuando la bola sale ("A standard chain dropper uses a counterweight and one claw... resetting when the ball exits" — Citadel Knex Ball Machine Elements). Aplica directo a un rig de retorno-a-centro: pivote arriba del centro de masa + contrapeso con connectors blancos en la punta larga (ya en KNEX.md §3.3, esto añade un ejemplo real construido).
- **Damper de fricción:** un pivote side-on (en vez de through-hole) en un punto del mecanismo añade fricción seca al movimiento — útil para amortiguar un retorno por gravedad sin piezas extra; no hay cifra de coeficiente, es ajuste por prueba (menos ridges disponibles cerca de la punta del rod = menos opciones de dónde clipar, KUG A2).
- **Steering wheel / joystick:** el único "Knex Steering Wheel" encontrado (Instructables) es **decorativo**, no transmite giro a nada — no sirve como receta de joystick funcional. No existe ningún mouse/joystick analógico documentado en K'NEX clásico (confirmado también en KNEX.md §5) — la combinación gimbal de 2 ejes + crank + slider de esta sección es la síntesis más cercana, no una receta de fuente.

## 6. Gotchas

- **Posiciones bloqueadas en 3D connectors — cifra exacta (KUG A4, texto completo):** en un par **azul/gris** ("blue/grey"), **1 de las posiciones de conexión** es difícil de usar; en un par **azul/azul**, **2 posiciones** son difíciles. Solución oficial: separar el par de 3D connectors, montar el rod en esa posición difícil con las mitades sueltas, y recién ahí volver a unir el par (empujar hasta el click). Alternativa: forzar el rod entrando en ángulo, pero KUG lo desaconseja ("an easier approach... is to separate").
- **Rod verde no admite side-on** (sin ridges, KUG A2) — ya en KNEX.md §1.3, repetido aquí porque es la causa directa de por qué no puedes usarlo como el "hidden rod" universal del §3: sólo sirve end-on.
- **Naranja 2-way recto es geométricamente pobre para carga:** confirmado dos veces en fuentes distintas — KUG A3 ("Try not to use orange connectors when making 2D structures") y troubleshooting-tips ("Don't use orange connectors in your model... replace them with connectors that can be connected sideways as well as lengthways"). Es la gotcha más repetida en todo KUG.
- **Snap-in incompleto reduce la resistencia silenciosamente:** troubleshooting-tips: "If there is a rod anywhere which is not correctly snapped into a connector, this will reduce the strength" — es la causa #1 de modelos débiles según KUG, antes que cualquier elección de pieza.
- **Motor sin tan clip patina:** troubleshooting-tips confirma que la falla típica "motor gira pero la rueda no" es casi siempre un tan clip faltante en la unión rod↔rueda (W6) — no un problema del motor.
- **Piezas viejas / sockets gastados:** no encontré cifras de tolerancia para piezas usadas en KUG ni en foros accesibles (SSCoasters migró a sscoasters.app y el hilo específico de beginner-tips da 404 — **no verificado**, contenido posiblemente perdido en la migración). Guía genérica de KUG storage (Y1, texto completo): guardar en **bandejas compartimentadas** (tipo Stanley) o **cajas Really Useful Box de 9L + bandeja de 7 compartimentos**; las bandejas gris/amarilla de sets educativos grandes venían pensadas para esto pero K'NEX dejó de incluir divisores — usuarios hacen los suyos en plástico o cartón. Nada sobre degradación por UV/humedad más allá de lo ya citado en KNEX.md §5 (afirmación de blog, no de KUG).
- **Curved rods (KUG A19, no estaba en KNEX.md):** existen 3 rods curvos de fábrica, con radio fijo (no ajustable como el flexi): **95mm púrpura, 139mm naranja, 203mm plata**. A diferencia del flexi rod, su curvatura es fija de fábrica — si tu caja tiene alguno, es una geometría extra a considerar para el gimbal, pero no la asumas presente sin revisar la caja.
- **Hub 3-way (W3):** conecta dos rods giratorios para que giren a la misma velocidad — el primer rod atraviesa el hub por el largo, el segundo entra por el agujero lateral. Es un acople rígido de ejes, no un engranaje — no cambia relación de velocidad, sólo transmite giro entre dos ejes que se cruzan.
- **Ratchet y stub axle son piezas "especiales" (S/W series), no garantizadas en toda caja** — igual que curved rods, confirmar inventario antes de diseñar un mecanismo que dependa de ellas.

---

## Fuentes

KUG Handy Hints (contenido completo, no sólo índice):
- https://www.knexusergroup.org.uk/en/knex-hint-A2.html (A2, las tres uniones, cita textual sobre fuerza de end-on/side-on)
- https://www.knexusergroup.org.uk/en/knex-hint-A3.html (A3, 2D structures, sword-blade span)
- https://www.knexusergroup.org.uk/en/knex-hint-A4.html (A4, 3D connectors, posiciones bloqueadas — cita exacta)
- https://www.knexusergroup.org.uk/en/knex-hint-A5.html (A5, 3D structures, bridge span, por qué triangular)
- https://www.knexusergroup.org.uk/en/knex-hint-A9.html (A9, ball & socket, sin cotas)
- https://www.knexusergroup.org.uk/en/knex-hint-A11.html (A11, handles)
- https://www.knexusergroup.org.uk/en/knex-hint-A13.html (A13, shafts largos apilando connectors)
- https://www.knexusergroup.org.uk/en/knex-hint-A14.html (A14, alternativas al gris 190, cita completa)
- https://www.knexusergroup.org.uk/en/knex-hint-A18.html (A18, rod locks)
- https://www.knexusergroup.org.uk/en/knex-hint-A19.html (A19, curved rods — nuevo, no estaba en KNEX.md)
- https://www.knexusergroup.org.uk/en/knex-hint-G4.html (G4, rack and pinion)
- https://www.knexusergroup.org.uk/en/knex-hint-W3.html (W3, hub 3-way)
- https://www.knexusergroup.org.uk/en/knex-hint-W8.html (W8, stub axles)
- https://www.knexusergroup.org.uk/en/knex-hint-W9.html (W9, ratchet)
- https://www.knexusergroup.org.uk/en/knex-hint-S3.html (S3, skid plate)
- https://www.knexusergroup.org.uk/en/knex-hint-S7.html (S7, spinner stems)
- https://www.knexusergroup.org.uk/en/knex-hint-Y1.html (Y1, storage — texto completo)
- https://www.knexusergroup.org.uk/en/knex-troubleshooting-tips.html (troubleshooting, citas textuales)
- https://www.knexusergroup.org.uk/en/knex-handy-hints.html, knex-handy-hints-rods.html, knex-handy-hints-gears.html, knex-handy-hints-wheels.html, knex-handy-hints-special.html, knex-handy-hints-coasters.html, knex-storage.html (índices)

Foros / Instructables:
- https://www.instructables.com/Citadel-Knex-Ball-Machine-Elements-Instructions/ (chain dropper con contrapeso, cita textual)
- https://www.instructables.com/The-Official-Guide-to-Knex-Ball-Machine-Elements/ (índice de guías de elementos: crazy arms, cooperating arms, see-saw counterweight)
- https://www.instructables.com/New-KNEX-Ball-Machine-Element-Cooperating-Arms-5-b/
- https://www.instructables.com/Cyclo-knex-ball-machine-elements/
- http://www.sscoasters.net/forum/topic/15564-beginner-tips/ → migrado a sscoasters.app, hilo específico da 404, contenido no recuperado (**no verificado**)
- https://www.thingiverse.com/thing:6596478 (rod lock imprimible, referencia cruzada)

No fructífero / descartado:
- US10492835 "Offset rods, offset rod connectors" (patente médica de columna, no relacionado a K'NEX pese al nombre)
- Búsqueda de fuerza de pull-out en Newtons para sockets K'NEX: sin resultado en patentes ni foros — no verificado
