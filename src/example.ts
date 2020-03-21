import { createTexture } from "./gl";
import { Renderer } from "./renderer";

const canvas: HTMLCanvasElement = document.getElementById(
	"canvas"
) as HTMLCanvasElement;
const renderer: Renderer = new Renderer(canvas);
const gl: WebGLRenderingContext = renderer.gl;
const gravity: number = 0.85;
const maxX: number = canvas.width;
const minX: number = 0;
const maxY: number = canvas.height;
const minY: number = 0;
const startCount: number = 3;
const amount: number = 10;
const sprites: Sprite[] = [];
const counter: HTMLElement = document.getElementById("counter") as HTMLElement;
const frames: number[][] = [
	[0, 0, 32, 32],
	[0, 32, 32, 32],
	[0, 64, 32, 32],
	[0, 96, 32, 32]
];

interface IVec2 {
	x: number;
	y: number;
}

const mouse: IVec2 = {
	x: 0,
	y: 0
};

const img: HTMLImageElement = new Image();

let add: boolean = false;
let count: number = 0;
let currentFrame: number = 0;
let texture: WebGLTexture;
let textureWidth: number;
let textureHeight: number;

class Sprite {
	public positionX: number;
	public positionY: number;
	public width: number;
	public height: number;
	public texture: WebGLTexture;
	public speedX: number;
	public speedY: number;
	public rotation: number;
	public u0: number;
	public u1: number;
	public v0: number;
	public v1: number;
	public halfWidth: number;

	constructor(
		x: number,
		y: number,
		texture: WebGLTexture,
		textureWidth: number,
		textureHeight: number,
		frameX: number,
		frameY: number,
		frameW: number,
		frameH: number
	) {
		this.positionX = x;
		this.positionY = y;
		this.width = frameW;
		this.height = frameH;
		this.texture = texture;
		this.speedX = 0;
		this.speedY = 0;
		this.rotation = 0;
		this.u0 = frameX / textureWidth;
		this.v0 = frameY / textureHeight;
		this.u1 = this.u0 + frameW / textureWidth;
		this.v1 = this.v0 + frameH / textureHeight;
		this.halfWidth = frameW / 2;
	}
}

function create(): void {
	const frame: number[] = frames[currentFrame];
	for (let i: number = 0; i < startCount; i++) {
		const s: Sprite = new Sprite(
			mouse.x,
			mouse.y,
			texture,
			textureWidth,
			textureHeight,
			frame[0],
			frame[1],
			frame[2],
			frame[3]
		);
		s.speedX = Math.random() * 10;
		s.speedY = Math.random() * 10 - 5;
		sprites[count++] = s;
	}
	counter.innerHTML = `${count} SPRITES`;

	renderer.bkg(0.227, 0.227, 0.227);
	loop();
}

function update(): void {
	if (add && count < 200000) {
		currentFrame = (currentFrame + 1) % frames.length;

		const frame: number[] = frames[currentFrame];

		for (let i1: number = 0; i1 < amount; i1++) {
			const s1: Sprite = new Sprite(
				mouse.x,
				mouse.y,
				texture,
				textureWidth,
				textureHeight,
				frame[0],
				frame[1],
				frame[2],
				frame[3]
			);
			s1.speedX = Math.random() * 10;
			s1.speedY = Math.random() * 10 - 5;
			s1.rotation = Math.random() - 0.5;
			sprites[count++] = s1;
		}
		counter.innerHTML = `${count} SPRITES`;
	}

	for (let i2: number = 0; i2 < count; i2++) {
		const s2: Sprite = sprites[i2];

		s2.positionX += s2.speedX;
		s2.positionY += s2.speedY;
		s2.speedY += gravity;

		if (s2.positionX > maxX) {
			s2.speedX *= -1;
			s2.positionX = maxX;
		} else if (s2.positionX < minX) {
			s2.speedX *= -1;
			s2.positionX = minX;
		}

		if (s2.positionY > maxY) {
			s2.speedY *= -0.85;
			s2.positionY = maxY;

			s2.rotation = Math.random() * 0.5 * 0.2;

			if (Math.random() > 0.5) {
				s2.speedY -= Math.random() * 6;
			}
		} else if (s2.positionY < minY) {
			s2.speedY = 0;
			s2.positionY = minY;
		}
	}
}

function draw() {
	renderer.cls();

	for (let i: number = 0; i < count; i++) {
		const s: Sprite = sprites[i];

		renderer.img(
			s.texture,
			-s.halfWidth,
			0,
			s.width,
			s.height,
			s.rotation,
			s.positionX,
			s.positionY,
			1,
			1,
			s.u0,
			s.v0,
			s.u1,
			s.v1
		);
	}

	renderer.flush();
}

function loop(): void {
	requestAnimationFrame(loop);
	update();
	draw();
}

function mouseDown(e: any): void {
	mouse.x = (e as any).x - canvas.offsetLeft;
	mouse.y = (e as any).y - canvas.offsetTop;
	add = true;
}

function mouseMove(e: any): void {
	mouse.x = (e as any).x - canvas.offsetLeft;
	mouse.y = (e as any).y - canvas.offsetTop;
}

function mouseUp(): void {
	add = false;
}

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("touchstart", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("touchend", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);
canvas.addEventListener("touchmove", mouseMove, false);

img.onload = (): void => {
	texture = createTexture(gl, img);
	textureWidth = img.width;
	textureHeight = img.height;
	create();
};

img.src =
	"data:image/png;base64,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";
