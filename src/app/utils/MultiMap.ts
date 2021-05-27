export default class MultiMap<K, V> extends Map<K, V[]> {
  public append(k: K, ...v: V[]): void {
    let l = this.get(k);
    if (!l) {
      l = [];
      this.set(k, l);
    }

    l.push(...v);
  }
}
