export default class MultiMap<K, V> extends Map<K, V[]> {
  public append(k: K, ...v: V[]): void {
    let l = this.get(k);
    if (!l) {
      l = [];
      this.set(k, l);
    }

    l.push(...v);
  }

  public remove(k: K, v: V): void {
    const l = this.get(k);
    if (l) {
      const i = l.indexOf(v);
      if (i > -1) {
        if (l.length === 1) {
          this.delete(k);
        } else {
          l.splice(i, 1);
        }
      }
    }
  }
}
