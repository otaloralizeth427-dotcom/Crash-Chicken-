/* ===== referencias compartidas (cabecera / marcador) ===== */
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const tagline = document.querySelector('#tagline');
const help = document.querySelector('#help');
const levelUp = document.querySelector('#levelUp');
const toLevel2Btn = document.querySelector('#toLevel2');
const introEl = document.querySelector('#intro');
const game2El = document.querySelector('#game2');
const world2El = document.querySelector('#world2');

let best = +localStorage.getItem('crashChickenBest') || 0;
bestEl.textContent = best;

/* ===== geometría del Nivel 2: un "mundo" con scroll vertical =====
   La ventana visible (#game2) mide EXACTAMENTE lo mismo que el tablero del
   Nivel 1 (mismo alto, mismas proporciones de carretera/pasto). El mundo
   (#world2) es varias veces más alto que esa ventana y se desplaza con
   translateY según el jugador avanza — como una cámara que lo sigue — así
   ninguna carretera se encoge para "caber" en pantalla: las 10 carreteras
   no están visibles a la vez, se recorren una tras otra.
   Todo se mide en HVU (1 HVU = 1% del alto de la ventana #game2) y se
   convierte a % del propio alto del mundo para el CSS: son proporciones
   puras, por lo que el layout no depende de ningún tamaño de pantalla
   concreto ni necesita recalcularse al redimensionar. */
function layoutLevel2() {
	// g = orden de juego: 0 = primera carretera desde INICIO ... 9 = última antes de LLEGADA
	const ROADS = 10, GOAL_U = 10, START_U = 10, SINGLE_U = 20, DOUBLE_U = 34, GRASS_U = 10;
	const isDoubleG = g => g >= 6; // carreteras 7-10 (últimas 4 antes de la meta) = doble vía
	const weightOf = g => isDoubleG(g) ? DOUBLE_U : SINGLE_U;
	let worldH_U = GOAL_U + START_U + (ROADS - 1) * GRASS_U;
	for (let g = 0; g < ROADS; g++) worldH_U += weightOf(g);

	// posiciones en HVU, de arriba (meta) hacia abajo (inicio) — igual que el
	// Nivel 1, INICIO queda pegado a la primera carretera (sin pasto de por medio)
	const domTopU = [], domHU = [];
	let y = GOAL_U;
	for (let d = 0; d < ROADS; d++) {
		const g = ROADS - 1 - d, h = weightOf(g);
		domTopU.push(y);
		domHU.push(h);
		y += h;
		if (d < ROADS - 1) y += GRASS_U;
	}
	const pct = u => u / worldH_U * 100; // HVU -> % del alto propio del mundo
	const roadTop = g => pct(domTopU[ROADS - 1 - g]);
	const roadH = g => pct(domHU[ROADS - 1 - g]);
	return {
		ROADS, worldH_U, isDoubleG, roadTop, roadH,
		goalPct: pct(GOAL_U), startPct: pct(START_U), grassPct: pct(GRASS_U)
	};
}
const L2 = layoutLevel2();

/* Construye las 10 carreteras (+9 franjas de pasto) del Nivel 2 dentro de
   #world2, reutilizando las mismas clases .road/.grass del Nivel 1 (flujo
   normal en bloque: solo hace falta la altura de cada una, en el orden
   correcto, igual que ya hacía el Nivel 1). */
function buildLevel2Board() {
	world2El.style.height = L2.worldH_U + '%';
	const startEl = world2El.querySelector('.start');
	world2El.querySelector('.goal').style.height = L2.goalPct + '%';
	startEl.style.height = L2.startPct + '%';
	world2El.querySelectorAll('.road,.grass').forEach(e => e.remove());
	for (let d = 0; d < L2.ROADS; d++) {
		const g = L2.ROADS - 1 - d;
		const road = document.createElement('div');
		road.className = 'road' + (L2.isDoubleG(g) ? ' double' : '');
		road.style.height = L2.roadH(g) + '%';
		road.innerHTML = '<i></i>';
		world2El.insertBefore(road, startEl);
		if (d < L2.ROADS - 1) {
			const grass = document.createElement('div');
			grass.className = 'grass';
			grass.style.height = L2.grassPct + '%';
			world2El.insertBefore(grass, startEl);
		}
	}
}
buildLevel2Board();

/* Carreteras 1-6: vía sencilla, dificultad creciente. Carreteras 7-10: doble
   vía (dos carriles independientes, sentidos opuestos, velocidad y spawn
   propios). La carretera 1 (justo después de INICIO) arranca más lenta y
   con los autos lejos del centro, para que el jugador tenga tiempo de
   reaccionar y nunca muera en el primer paso. */
function makeLevel2Lanes() {
	const lanes = [];
	const single = (g, d, s, h, x) => lanes.push({ top: L2.roadTop(g) + L2.roadH(g) * .3, d, s, h, x });
	const dual = (g, d1, s1, h1, x1, d2, s2, h2, x2) => {
		const rh = L2.roadH(g);
		lanes.push({ top: L2.roadTop(g) + rh * .1, d: d1, s: s1, h: h1, x: x1 });
		lanes.push({ top: L2.roadTop(g) + rh * .55, d: d2, s: s2, h: h2, x: x2 });
	};
	single(0, 1, 10, [100, 220], [72, 18]);
	single(1, -1, 12, [40, 300], [10, 60]);
	single(2, 1, 14, [190, 10], [25, 75]);
	single(3, -1, 15, [260, 80], [0, 55]);
	single(4, 1, 17, [140, 320], [35, 85]);
	single(5, -1, 18, [70, 200], [10, 65]);
	dual(6, 1, 17, [180, 30], [10, 60], -1, 15, [300, 90], [35, 80]);
	dual(7, -1, 19, [50, 250], [0, 50], 1, 16, [220, 130], [25, 70]);
	dual(8, 1, 21, [100, 340], [15, 65], -1, 18, [280, 60], [40, 85]);
	dual(9, -1, 23, [150, 15], [5, 55], 1, 20, [320, 200], [30, 75]);
	return lanes;
}

function makeLevel2Items() {
	const at = (g, x) => ({ x, t: L2.roadTop(g) + L2.roadH(g) * .5 });
	return {
		corn: [at(0, 45), at(2, 20), at(4, 70), at(6, 78), at(8, 40)],
		toxic: [at(1, 80), at(3, 15), at(6, 40), at(7, 65), at(9, 55)]
	};
}
const level2Items = makeLevel2Items();

/* ===== configuración del nivel activo =====
   Esta rama contiene únicamente el Nivel 2 (el Nivel 1 vive en `main` y se
   integrará por separado). La página arranca mostrando directamente la
   pantalla de transición "¡Pasaste al Nivel 2!" (#intro/#levelUp) y ENTER
   / el botón CONTINUAR lleva a la partida.
   `game`   = sección visible/tabindex (se muestra/oculta, recibe foco y
              los controles táctiles).
   `world`  = raíz donde viven carreteras/autos/maíz/pollito y sobre la que
              se posicionan en % — #world2, el mundo largo que hace scroll.
   `worldH` = alto del mundo en HVU (100 equivaldría al mismo alto que la
              ventana, sin scroll).
   `anchorY`= HVU desde abajo en los que la cámara empieza a seguir al
              jugador (antes de eso se ve tal cual). */
const boards = {
	2: {
		num: 2,
		game: game2El,
		world: world2El,
		chicken: document.querySelector('#chicken2'),
		chickenHalf: 29,
		message: document.querySelector('#message2'),
		play: document.querySelector('#play2'),
		startY: 4, stepY: 10, winY: L2.worldH_U - 9, worldH: L2.worldH_U, anchorY: 30,
		lanes: makeLevel2Lanes(),
		corn: level2Items.corn,
		toxic: level2Items.toxic,
		tagline: 'NIVEL 2 · CARRETERA DOBLE',
		helpText: 'Recoge maíz (+25) y esquiva el maíz rojo. Toca, desliza o usa las flechas.'
	}
};

/* ===== estado de juego (compartido, opera sobre el nivel activo `cur`) ===== */
let cur = boards[2];
let playing = false, score = 0, pos = { x: 50, y: cur.startY }, cars = [], corns = [], toxics = [], last = 0, frame;

function setLevel(n) {
	cur = boards[n];
	document.body.classList.toggle('level2', n === 2);
	tagline.textContent = cur.tagline;
	help.textContent = cur.helpText;
	pos = { x: 50, y: cur.startY };
}

function makeCars() {
	cur.world.querySelectorAll('.car').forEach(x => x.remove());
	cars = cur.lanes.flatMap((l, n) => l.x.map((x, i) => {
		const e = document.createElement('div');
		e.className = 'car';
		e.innerHTML = '<img src="assets/car.png" alt="Auto">';
		e.style.setProperty('--hue', `${l.h[i]}deg`);
		cur.world.append(e);
		return { e, n, x };
	}));
}

function makeCorn() {
	cur.world.querySelectorAll('.corn').forEach(x => x.remove());
	corns = cur.corn.map(c => {
		const e = document.createElement('div');
		e.className = 'corn';
		e.style.left = c.x + '%';
		e.style.top = c.t + '%';
		e.innerHTML = '<img src="assets/corn.png" alt="Maíz">';
		cur.world.append(e);
		return { e, got: false };
	});
	toxics = cur.toxic.map(c => {
		const e = document.createElement('div');
		e.className = 'corn toxic';
		e.style.left = c.x + '%';
		e.style.top = c.t + '%';
		e.innerHTML = '<img src="assets/corn-toxic.png" alt="Maíz tóxico">';
		cur.world.append(e);
		return { e };
	});
}

/* Cámara: desplaza `world` en Y para que el mundo largo del Nivel 2 avance
   con el jugador (si worldH fuera 100 —igual que la ventana— no habría
   scroll, pero el Nivel 2 siempre usa un mundo más alto). */
function updateCamera() {
	const maxScroll = cur.worldH - 100;
	const s = Math.min(Math.max(pos.y - cur.anchorY, 0), maxScroll);
	const tyU = (100 - cur.worldH) + s; // en HVU
	cur.world.style.transform = `translateY(${(tyU / cur.worldH * 100).toFixed(4)}%)`;
}

function draw() {
	cur.chicken.style.left = `calc(${pos.x}% - ${cur.chickenHalf}px)`;
	cur.chicken.style.bottom = (pos.y / cur.worldH * 100) + '%';
	updateCamera();
}

function start() {
	score = 0;
	scoreEl.textContent = 0;
	pos = { x: 50, y: cur.startY };
	draw();
	makeCars();
	makeCorn();
	cur.message.classList.remove('show', 'crash');
	playing = true;
	last = performance.now();
	cur.game.focus();
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(loop);
}

function showLevelUp() {
	levelUp.classList.add('show');
}
function hideLevelUp() {
	levelUp.classList.remove('show');
}

function startLevel2() {
	hideLevelUp();
	introEl.classList.add('hidden');
	boards[2].game.classList.remove('hidden');
	setLevel(2);
	start();
}

function end(win = false) {
	playing = false;
	cancelAnimationFrame(frame);
	if (score > best) {
		best = score;
		localStorage.setItem('crashChickenBest', best);
		bestEl.textContent = best;
	}
	cur.message.classList.toggle('crash', !win);
	cur.message.querySelector('h2').textContent = win ? '¡Lo lograste! 🏁' : '¡Crash!';
	cur.message.querySelector('p').textContent = win ? `¡${score} puntos!` : `Conseguiste ${score} puntos. Inténtalo de nuevo.`;
	cur.play.textContent = win ? 'JUGAR DE NUEVO' : 'REINTENTAR';
	cur.message.classList.add('show');
}

function hit(a, b, p = 10) {
	return a.left < b.right - p && a.right > b.left + p && a.top < b.bottom - p && a.bottom > b.top + p;
}

function loop(now) {
	if (!playing) return;
	let dt = Math.min((now - last) / 1000, .05);
	last = now;
	cars.forEach(c => {
		const l = cur.lanes[c.n];
		c.x += l.d * l.s * dt;
		if (l.d === 1 && c.x > 108) c.x = -15;
		if (l.d === -1 && c.x < -15) c.x = 108;
		c.e.style.left = c.x + '%';
		c.e.style.top = l.top + '%';
		c.e.style.transform = l.d < 0 ? 'scaleX(-1)' : '';
	});
	const r = cur.chicken.getBoundingClientRect();
	for (const c of cars) if (hit(r, c.e.getBoundingClientRect(), 16)) { end(); return; }
	for (const t of toxics) if (hit(r, t.e.getBoundingClientRect(), 7)) { end(); return; }
	corns.forEach(c => {
		if (!c.got && hit(r, c.e.getBoundingClientRect(), 7)) {
			c.got = true;
			c.e.classList.add('collected');
			score += 25;
			scoreEl.textContent = score;
		}
	});
	frame = requestAnimationFrame(loop);
}

function move(k) {
	if (!playing) return;
	const s = cur.stepY;
	if (['ArrowUp', 'w', 'W'].includes(k)) pos.y = Math.min(cur.winY, pos.y + s);
	if (['ArrowDown', 's', 'S'].includes(k)) pos.y = Math.max(cur.startY, pos.y - s);
	if (['ArrowLeft', 'a', 'A'].includes(k)) pos.x = Math.max(4, pos.x - 10);
	if (['ArrowRight', 'd', 'D'].includes(k)) pos.x = Math.min(96, pos.x + 10);
	score = Math.max(score, Math.floor((pos.y - cur.startY) / s) * 10);
	scoreEl.textContent = score;
	draw();
	if (pos.y >= cur.winY) end(true);
}

/* ===== controles: teclado (PC) ===== */
document.addEventListener('keydown', e => {
	if (levelUp.classList.contains('show')) {
		if (e.key === 'Enter') { e.preventDefault(); startLevel2(); }
		return;
	}
	if (/Arrow|^[wasdWASD]$/.test(e.key)) e.preventDefault();
	if (e.key.toLowerCase() === 'r') start();
	else move(e.key);
});

/* ===== controles: táctil (móvil) — tap avanza, swipe mueve en 4 direcciones ===== */
function attachTouch(el) {
	const THRESH = 28;
	let sx = 0, sy = 0;
	el.addEventListener('touchstart', e => {
		const t = e.touches[0];
		sx = t.clientX;
		sy = t.clientY;
	}, { passive: true });
	el.addEventListener('touchend', e => {
		if (e.target.closest('button')) return; // el botón maneja su propio tap
		if (levelUp.classList.contains('show')) { startLevel2(); return; }
		if (!playing) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - sx, dy = t.clientY - sy;
		const adx = Math.abs(dx), ady = Math.abs(dy);
		if (Math.max(adx, ady) < THRESH) { move('ArrowUp'); return; } // tap = avanzar
		if (adx > ady) move(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
		else move(dy < 0 ? 'ArrowUp' : 'ArrowDown');
	});
}
attachTouch(introEl);
attachTouch(boards[2].game);

/* ===== botones ===== */
toLevel2Btn.onclick = startLevel2;
boards[2].play.onclick = () => { setLevel(2); start(); };

/* ===== estado inicial: arranca directo en la pantalla de transición ===== */
setLevel(2);
