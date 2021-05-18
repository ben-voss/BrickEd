export class Rect {
  public left = 0;
  public top = 0;
  public width = 0;
  public height = 0;

  constructor(left: number, top: number, width: number, height: number) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }

  public static fromDOMRect(rect: DOMRect): Rect {
    return new Rect(rect.left, rect.top, rect.width, rect.height);
  }

  public get right(): number {
    return this.left + this.width;
  }

  public get bottom(): number {
    return this.top + this.height;
  }

  public contains(x: number, y: number): boolean {
    return (
      x >= this.left && y >= this.top && x <= this.right && y <= this.bottom
    );
  }
}
