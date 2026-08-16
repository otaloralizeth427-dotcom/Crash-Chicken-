/* ===== referencias compartidas (cabecera / marcador) ===== */
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const tagline = document.querySelector('#tagline');
const help = document.querySelector('#help');
const levelUp = document.querySelector('#levelUp');
const toLevel2Btn = document.querySelector('#toLevel2');

let best = +localStorage.getItem('crashChickenBest') || 0;
bestEl.textContent = best;

/* ===== geometría del tablero del Nivel 2 (10 carreteras) ===== */
function layoutLevel2() {
	// g = orden de juego: 0 = primera carretera desde INICIO ... 9 = última antes de LLEGADA
	const ROADS = 10, GOAL = 6, START = 6, SINGLE_W = 2.2, DOUBLE_W = 5, GRASS_W = 1;
	const isDoubleG = g => g >= 6; // carreteras 7-10 (últimas 4 antes de la meta) = doble vía
	const weightOf = g => isDoubleG(g) ? DOUBLE_W : SINGLE_W;
	let totalW = (ROADS - 1) * GRASS_W;
	for (let g = 0; g < ROADS; g++) totalW += weightOf(g);
	const unit = (100 - GOAL - START) / totalW;
	const grassH = unit * GRASS_W;
	const domTop = [], domH = []; // de arriba (meta) hacia abajo (inicio)
	let y = GOAL;
	for (let d = 0; d < ROADS; d++) {
		const g = ROADS - 1 - d, h = weightOf(g) * unit;
		domTop.push(y);
		domH.push(h);
		y += h;
		if (d < ROADS - 1) y += grassH;
	}
	const roadTop = g => domTop[ROADS - 1 - g];
	const roadH = g => domH[ROADS - 1 - g];
	return { ROADS, GOAL, START, grassH, roadTop, roadH, isDoubleG };
}
const L2 = layoutLevel2();

/* Construye las 10 carreteras (+9 franjas de pasto) del Nivel 2 reutilizando
   las mismas clases .road/.grass del Nivel 1, insertadas antes de .start.
   Las carreteras 7-10 (doble vía) se generan más anchas, como una vía real. */
function buildLevel2Board() {
	const board = document.querySelector('#game2');
	const startEl = board.querySelector('.start');
	board.querySelector('.goal').style.height = L2.GOAL + '%';
	startEl.style.height = L2.START + '%';
	board.querySelectorAll('.road,.grass').forEach(e => e.remove());
	for (let d = 0; d < L2.ROADS; d++) {
		const g = L2.ROADS - 1 - d;
		const road = document.createElement('div');
		road.className = 'road' + (L2.isDoubleG(g) ? ' double' : '');
		road.style.height = L2.roadH(g) + '%';
		road.innerHTML = '<i></i>';
		board.insertBefore(road, startEl);
		if (d < L2.ROADS - 1) {
			const grass = document.createElement('div');
			grass.className = 'grass';
			grass.style.height = L2.grassH + '%';
			board.insertBefore(grass, startEl);
		}
	}
}
buildLevel2Board();

/* Carreteras 1-6: vía sencilla. Carreteras 7-10: doble vía (dos carriles
   independientes, sentidos opuestos, velocidades y spawns propios) */
function makeLevel2Lanes() {
	const lanes = [];
	const single = (g, d, s, h, x) => lanes.push({ top: L2.roadTop(g) + L2.roadH(g) * .08, d, s, h, x });
	const dual = (g, d1, s1, h1, x1, d2, s2, h2, x2) => {
		const rh = L2.roadH(g);
		lanes.push({ top: L2.roadTop(g) + rh * .08, d: d1, s: s1, h: h1, x: x1, sub: true });
		lanes.push({ top: L2.roadTop(g) + rh * .54, d: d2, s: s2, h: h2, x: x2, sub: true });
	};
	single(0, 1, 11, [100, 220], [15, 65]);
	single(1, -1, 13, [40, 300], [5, 55]);
	single(2, 1, 15, [190, 10], [25, 75]);
	single(3, -1, 16, [260, 80], [0, 50]);
	single(4, 1, 18, [140, 320], [35, 85]);
	single(5, -1, 19, [70, 200], [10, 60]);
	dual(6, 1, 19, [180, 30], [10, 60], -1, 16, [300, 90], [30, 80]);
	dual(7, -1, 21, [50, 250], [0, 50], 1, 18, [220, 130], [20, 70]);
	dual(8, 1, 23, [100, 340], [15, 65], -1, 20, [280, 60], [35, 85]);
	dual(9, -1, 25, [150, 15], [5, 55], 1, 22, [320, 200], [25, 75]);
	return lanes;
}

function makeLevel2Items() {
	const at = (g, x) => ({ x, t: L2.roadTop(g) + L2.roadH(g) * .5 });
	return {
		corn: [at(0, 45), at(2, 20), at(4, 70), at(6, 78)],
		toxic: [at(1, 80), at(3, 15), at(6, 42), at(8, 60), at(9, 55)]
	};
}
const level2Items = makeLevel2Items();

/* ===== configuración de ambos niveles ===== */
const boards = {
	1: {
		num: 1,
		game: document.querySelector('#game'),
		chicken: document.querySelector('#chicken'),
		chickenHalf: 29,
		message: document.querySelector('#message'),
		play: document.querySelector('#play'),
		startY: 4, stepY: 10, winY: 91,
		lanes: [
			{ top: 17, d: 1, s: 12, h: [275, 190], x: [10, 66] },
			{ top: 47, d: -1, s: 17, h: [35, 195], x: [10, 66] },
			{ top: 77, d: 1, s: 22, h: [110, 260, 45], x: [0, 36, 75] }
		],
		corn: [{ x: 30, t: 45 }, { x: 73, t: 75 }],
		toxic: [],
		tagline: 'CRUZA SIN MIRAR ATRÁS',
		helpText: 'Recoge maíz (+25). Pulsa R para reiniciar.'
	},
	2: {
		num: 2,
		game: document.querySelector('#game2'),
		chicken: document.querySelector('#chicken2'),
		chickenHalf: 23,
		message: document.querySelector('#message2'),
		play: document.querySelector('#play2'),
		startY: 4, stepY: 5, winY: 95,
		lanes: makeLevel2Lanes(),
		corn: level2Items.corn,
		toxic: level2Items.toxic,
		tagline: 'NIVEL 2 · DOBLE VÍA',
		helpText: 'Recoge maíz (+25) y esquiva el maíz rojo. Toca, desliza o usa las flechas.'
	}
};

/* ===== estado de juego (compartido, opera sobre el nivel activo `cur`) ===== */
let cur = boards[1];
let playing = false, score = 0, pos = { x: 50, y: cur.startY }, cars = [], corns = [], toxics = [], last = 0, frame;

function setLevel(n) {
	cur = boards[n];
	document.body.classList.toggle('level2', n === 2);
	tagline.textContent = cur.tagline;
	help.textContent = cur.helpText;
	pos = { x: 50, y: cur.startY };
}

function makeCars() {
	cur.game.querySelectorAll('.car').forEach(x => x.remove());
	cars = cur.lanes.flatMap((l, n) => l.x.map((x, i) => {
		const e = document.createElement('div');
		e.className = 'car' + (l.sub ? ' sub' : '');
		e.innerHTML = '<img src="assets/car.png" alt="Auto">';
		e.style.setProperty('--hue', `${l.h[i]}deg`);
		cur.game.append(e);
		return { e, n, x };
	}));
}

function makeCorn() {
	cur.game.querySelectorAll('.corn').forEach(x => x.remove());
	corns = cur.corn.map(c => {
		const e = document.createElement('div');
		e.className = 'corn';
		e.style.left = c.x + '%';
		e.style.top = c.t + '%';
		e.innerHTML = '<img src="assets/corn.png" alt="Maíz">';
		cur.game.append(e);
		return { e, got: false };
	});
	toxics = cur.toxic.map(c => {
		const e = document.createElement('div');
		e.className = 'corn toxic';
		e.style.left = c.x + '%';
		e.style.top = c.t + '%';
		e.innerHTML = '<img src="assets/corn-toxic.png" alt="Maíz tóxico">';
		cur.game.append(e);
		return { e };
	});
}

function draw() {
	cur.chicken.style.left = `calc(${pos.x}% - ${cur.chickenHalf}px)`;
	cur.chicken.style.bottom = pos.y + '%';
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
	boards[1].game.classList.add('hidden');
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
	if (win && cur.num === 1) {
		cur.message.classList.remove('show');
		showLevelUp();
		return;
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
attachTouch(boards[1].game);
attachTouch(boards[2].game);

/* ===== botones ===== */
toLevel2Btn.onclick = startLevel2;
boards[1].play.onclick = () => { setLevel(1); start(); };
boards[2].play.onclick = () => { setLevel(2); start(); };

/* ===== estado inicial ===== */
setLevel(1);
draw();
makeCars();
makeCorn();
