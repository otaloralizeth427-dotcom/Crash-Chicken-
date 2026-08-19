const worldMenu = document.querySelector('#worldMenu');
const game4 = document.querySelector('#game4');
const snakeBoard = document.querySelector('#snakeBoard');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const tagline = document.querySelector('#tagline');
const help = document.querySelector('#help');
const message4 = document.querySelector('#message4');
const play4 = document.querySelector('#play4');
const world4State = document.querySelector('#world4State');
const worldCards = [...document.querySelectorAll('.world-card')];

let best = +localStorage.getItem('crashChickenBest') || 0;
// Make all worlds unlocked by default so the player can enter any world.
let unlockedWorld = +localStorage.getItem('crashChickenUnlockedWorld') || 4;
let playing = false, score = 0, frame = 0;
bestEl.textContent = best;

const SNAKE_SIZE = 8;
const SNAKE_CELLS = SNAKE_SIZE * SNAKE_SIZE;
const dirs = {
	ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
	ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
	ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
	ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
};
let cells = [], snake = [], eggs = [], dir = dirs.ArrowRight, nextDir = dirs.ArrowRight;
let last = 0, stepMs = 210, speedUntil = 0, powerLevel = 0, powerBurstUntil = 0, eggBoost = 0;

function updateMenu() {
	worldCards.forEach(card => {
		const world = +card.dataset.world;
		// unlocked if its number is <= unlockedWorld
		const unlocked = world <= unlockedWorld;
		card.classList.toggle('locked', !unlocked);
		card.disabled = !unlocked;
		if (world === 4) world4State.textContent = unlocked ? 'Entrar' : 'Completa el Mundo 3';
	});
}

function showMenu() {
	playing = false;
	cancelAnimationFrame(frame);
	worldMenu.classList.remove('hidden');
	game4.classList.add('hidden');
	tagline.textContent = 'ELIGE TU MUNDO';
	help.textContent = 'Pasa los mundos anteriores para desbloquear nuevos caminos.';
	updateMenu();
	worldMenu.focus();
}

function buildBoard() {
	snakeBoard.innerHTML = '';
	cells = Array.from({ length: SNAKE_CELLS }, () => {
		const cell = document.createElement('div');
		cell.className = 'snake-cell';
		snakeBoard.append(cell);
		return cell;
	});
}

function cellIndex(p) {
	return p.y * SNAKE_SIZE + p.x;
}

function sameCell(a, b) {
	return a.x === b.x && a.y === b.y;
}

function targetPowerLevel() {
	if (snake.length >= 42) return 4;
	if (snake.length >= 28) return 3;
	if (snake.length >= 18) return 2;
	if (snake.length >= 10) return 1;
	return 0;
}

function maxEggs() {
	return Math.min(7, 2 + Math.floor((snake.length - 3) / 8) + powerLevel + eggBoost);
}

function randomFreeCell() {
	const free = [];
	for (let y = 0; y < SNAKE_SIZE; y++) {
		for (let x = 0; x < SNAKE_SIZE; x++) {
			if (!snake.some(p => p.x === x && p.y === y) && !eggs.some(e => e.x === x && e.y === y)) free.push({ x, y });
		}
	}
	return free[Math.floor(Math.random() * free.length)];
}

function randomEggType() {
	const roll = Math.random();
	if (roll > .88) return 'double';
	if (roll > .72) return 'broken';
	if (roll > .55) return 'speed';
	return 'normal';
}

function spawnEgg(type = randomEggType()) {
	const cell = randomFreeCell();
	if (!cell) return;
	eggs.push({ ...cell, type, expiresAt: type === 'broken' ? performance.now() + 8000 : 0 });
	// If a broken egg appears, also spawn an additional healthy egg
	// so the player still has something to eat while the broken one
	// is present.
	if (type === 'broken') {
		spawnEgg('normal');
	}
}

function fillEggs() {
	while (eggs.length < maxEggs()) spawnEgg();
}

function updatePowerLevel() {
	const next = targetPowerLevel();
	if (next > powerLevel) {
		powerLevel = next;
		powerBurstUntil = performance.now() + 1200;
		eggBoost = Math.min(2, eggBoost + 1);
		fillEggs();
	}
}

function drawSnake() {
	snakeBoard.className = `power-${powerLevel}` + (performance.now() < powerBurstUntil ? ' grow-burst' : '');
	cells.forEach(cell => { cell.innerHTML = ''; });
	snake.forEach((part, i) => {
		const piece = document.createElement('div');
		piece.className = i === 0 ? 'snake-head' + (powerLevel ? ' powered' : '') : 'snake-part';
		piece.innerHTML = i === 0 ? `<img src="assets/${powerLevel ? 'chicken-power.png' : 'chicken-flag.png'}" alt="Pollito">` : '';
		cells[cellIndex(part)].append(piece);
	});
	eggs.forEach(egg => {
		const item = document.createElement('div');
		item.className = 'egg ' + egg.type;
		item.innerHTML = egg.type === 'speed' ? '<img src="assets/chicken-egg-special.png" alt="Huevo especial">' : '';
		cells[cellIndex(egg)].append(item);
	});
	if (powerLevel >= 2) {
		cells.forEach((cell, i) => {
			if (i % Math.max(4, 9 - powerLevel) === 0 && !cell.firstChild) {
				const spark = document.createElement('div');
				spark.className = 'bonus-spark';
				cell.append(spark);
			}
		});
	}
}

function updateScore() {
	score = Math.max(0, (snake.length - 3) * 10);
	scoreEl.textContent = score;
}

function startWorld4(worldNumber = 4) {
	worldMenu.classList.add('hidden');
	game4.classList.remove('hidden');
	tagline.textContent = `MUNDO ${worldNumber} · SNAKE CHICKEN`;
	help.textContent = 'Huevos: normal crece, roto corta, pollito acelera y verde duplica.';
	score = 0;
	scoreEl.textContent = score;
	snake = [{ x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }];
	eggs = [];
	dir = dirs.ArrowRight;
	nextDir = dirs.ArrowRight;
	stepMs = 210;
	speedUntil = 0;
	powerLevel = 0;
	powerBurstUntil = 0;
	eggBoost = 0;
	spawnEgg('normal');
	spawnEgg('speed');
	fillEggs();
	drawSnake();
	message4.classList.remove('show', 'crash');
	playing = true;
	last = performance.now();
	game4.focus();
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(loopSnake);
}

function endWorld4(win = false) {
	playing = false;
	cancelAnimationFrame(frame);
	game4.classList.remove('snake-speed');
	if (win) {
		unlockedWorld = Math.max(unlockedWorld, 4);
		localStorage.setItem('crashChickenUnlockedWorld', unlockedWorld);
	}
	if (score > best) {
		best = score;
		localStorage.setItem('crashChickenBest', best);
		bestEl.textContent = best;
	}
	message4.classList.toggle('crash', !win);
	message4.querySelector('h2').textContent = win ? '¡Mundo 4 completo!' : '¡Crash!';
	message4.querySelector('p').textContent = win ? `Llenaste el corral con ${score} puntos.` : `Conseguiste ${score} puntos. No toques barreras ni cola.`;
	play4.textContent = win ? 'JUGAR DE NUEVO' : 'REINTENTAR';
	message4.classList.add('show');
}

function eatEgg(egg) {
	if (egg.type === 'speed') speedUntil = performance.now() + 9000;
	if (egg.type === 'double') {
		eggBoost = Math.min(3, eggBoost + 1);
		snake.unshift({ ...snake[0] });
		spawnEgg('normal');
		spawnEgg('normal');
	}
	if (egg.type === 'broken') snake.length = Math.max(2, Math.ceil(snake.length / 2));
}

function stepSnake() {
	dir = nextDir;
	const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
	if (head.x < 0 || head.x >= SNAKE_SIZE || head.y < 0 || head.y >= SNAKE_SIZE) { endWorld4(); return; }
	const eatenIndex = eggs.findIndex(item => sameCell(head, item));
	const eatenEgg = eatenIndex >= 0 ? eggs[eatenIndex] : null;
	const body = eatenEgg ? snake : snake.slice(0, -1);
	if (body.some(part => sameCell(part, head))) { endWorld4(); return; }
	snake.unshift(head);
	if (eatenEgg) {
		eggs.splice(eatenIndex, 1);
		eatEgg(eatenEgg);
		if (snake.length >= SNAKE_CELLS) { updateScore(); drawSnake(); endWorld4(true); return; }
		fillEggs();
	} else {
		snake.pop();
	}
	updatePowerLevel();
	updateScore();
	drawSnake();
}

function loopSnake(now) {
	if (!playing) return;
	game4.classList.toggle('snake-speed', now < speedUntil);
	const oldLength = eggs.length;
	eggs = eggs.filter(item => !item.expiresAt || now <= item.expiresAt);
	if (eggs.length !== oldLength) {
		fillEggs();
		drawSnake();
	}
	const ms = now < speedUntil ? 82 : stepMs;
	if (now - last >= ms) {
		last = now;
		stepSnake();
	}
	if (powerBurstUntil && now > powerBurstUntil) {
		powerBurstUntil = 0;
		drawSnake();
	}
	frame = requestAnimationFrame(loopSnake);
}

function changeDir(key) {
	const chosen = dirs[key];
	if (!chosen) return;
	if (chosen.x + dir.x === 0 && chosen.y + dir.y === 0) return;
	nextDir = chosen;
}

document.addEventListener('keydown', e => {
	if (/Arrow|^[wasdWASD]$/.test(e.key)) e.preventDefault();
	if (!game4.classList.contains('hidden')) {
		if (e.key.toLowerCase() === 'r') startWorld4();
		else changeDir(e.key);
	}
});

function attachSnakeTouch(el) {
	const THRESH = 22;
	let sx = 0, sy = 0;
	el.addEventListener('touchstart', e => {
		if (e.target.closest('button')) return;
		const t = e.touches[0];
		sx = t.clientX;
		sy = t.clientY;
		e.preventDefault();
	}, { passive: false });
	el.addEventListener('touchend', e => {
		if (e.target.closest('button')) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - sx, dy = t.clientY - sy;
		if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESH) return;
		changeDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
		e.preventDefault();
	}, { passive: false });
}

worldMenu.addEventListener('click', e => {
	const card = e.target.closest('.world-card');
	if (!card || card.classList.contains('locked')) return;
	const world = +card.dataset.world;
	// Use the Snake demo for any world for now; heading reflects the world
	startWorld4(world);
});
play4.onclick = startWorld4;
attachSnakeTouch(game4);
buildBoard();
showMenu();
