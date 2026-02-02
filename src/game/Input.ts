export class Input {
  private mouseX: number = 0;
  private mouseY: number = 0;
  private screenCenterX: number = 0;
  private screenCenterY: number = 0;
  private keys: Set<string> = new Set();
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.updateScreenCenter();

    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', () => this.updateScreenCenter());
  }

  detach(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas = null;
  }

  private updateScreenCenter(): void {
    if (this.canvas) {
      this.screenCenterX = this.canvas.width / 2;
      this.screenCenterY = this.canvas.height / 2;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.mouseX = (event.clientX - rect.left) * scaleX;
    this.mouseY = (event.clientY - rect.top) * scaleY;
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.canvas || event.touches.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const touch = event.touches[0];
    this.mouseX = (touch.clientX - rect.left) * scaleX;
    this.mouseY = (touch.clientY - rect.top) * scaleY;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.key.toLowerCase());
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key.toLowerCase());
  }

  getAngle(): number {
    this.updateScreenCenter();
    const dx = this.mouseX - this.screenCenterX;
    const dy = this.mouseY - this.screenCenterY;
    return Math.atan2(dy, dx);
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  setScreenSize(width: number, height: number): void {
    this.screenCenterX = width / 2;
    this.screenCenterY = height / 2;
  }
}
