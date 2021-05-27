// Track objects for disposal.  This is done in two phases so that
// THREE has an opportunity to re-use the internals objects that
// we have determined are eligable for disposal.  As far as I can tell
// This avoids THREE from having recompile shaders.
export default class DisposeTracker {
  // List of objects that will be marked for disposal
  private _disposables: { dispose(): void }[] = [];

  // List of objects that will be disposed.
  private _marked: { dispose(): void }[] = [];

  public track<T extends { dispose(): void }>(disposable: T): T {
    this._disposables.push(disposable);
    return disposable;
  }

  public mark(): void {
    this._marked = this._disposables;
    this._disposables = [];
  }

  public dispose(): void {
    for (const disposable of this._marked) {
      disposable.dispose();
    }

    this._marked = [];
  }
}
