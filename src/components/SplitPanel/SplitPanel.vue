<template>
  <div class="panel root" :class="classObject" :style="paneStyle">
    <Panel
      ref="panel1"
      :class="{ column: splitTo === 'columns', row: splitTo === 'rows' }"
      :style="iStyleFirst()"
    >
      <slot name="firstPanel"></slot>
    </Panel>
    <Resizer
      ref="resizer"
      v-on:pointerdown="handlePointerDown"
      v-on:pointermove="handlePointerMove"
      v-on:pointerup="handlePointerUp"
      v-if="allowResize"
      :splitTo="splitTo"
      :resizerColor="resizerColor"
      :resizerBorderColor="resizerBorderColor"
      :resizerThickness="resizerThickness"
      :resizerBorderThickness="resizerBorderThickness"
      :class="{
        rowsres: splitTo === 'rows',
        columnsres: splitTo === 'columns'
      }"
    ></Resizer>
    <Panel
      ref="panel2"
      :class="{ column: splitTo === 'columns', row: splitTo === 'rows' }"
      :style="iStyleSecond()"
    >
      <slot name="secondPanel"></slot>
    </Panel>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Resizer from "./Resizer.vue";
import Panel from "./Panel.vue";
import { Prop, Watch } from "vue-property-decorator";

@Options({
  components: {
    Resizer,
    Panel
  }
})
export default class SplitPanel extends Vue {
  @Prop({
    type: Boolean,
    default: false
  })
  public allowResize!: boolean;

  @Prop({
    type: String,
    default: "columns"
  })
  public splitTo!: "columns" | "rows";

  @Prop({
    type: String,
    default: "first"
  })
  public primary!: "first" | "second";

  @Prop({
    type: Number,
    default: 17
  })
  public size!: number; // pixels || percents

  @Prop({
    type: String,
    default: "pixels"
  })
  public units!: "pixels" | "percents";

  @Prop({
    type: Number,
    default: 16
  })
  public minSize!: number; // pixels || percents

  @Prop({
    type: Number,
    default: 0
  })
  public maxSize!: number; // pixels || percents

  @Prop({
    type: Number,
    default: 1
  })
  public step!: number; // pixels only

  @Prop({
    type: Number,
    default: 2
  })
  public resizerThickness!: number; //in px - width of the resizer

  @Prop({
    type: String,
    default: "#AAA"
  })
  public resizerColor!: string; //  any css color - if you set transparency, it will afect the border too

  @Prop({
    type: String,
    default: "rgba(0,0,0, 0.15)"
  })
  public resizerBorderColor!: string; // any css color - #FFF, rgb(0,0,0), rgba(0,0,0,0)

  @Prop({
    type: Number,
    default: 3
  })
  public resizerBorderThickness!: number; // in px - border that forms the shadow

  private active = false;
  private position = 0;
  private localSize = this.size;
  private pointerId: number | null = null;

  @Watch("size")
  private handleSizeChanged(newSize: number): void {
    this.localSize = newSize;
  }

  public get classObject(): { columns: boolean; rows: boolean } {
    return {
      columns: this.splitTo === "columns",
      rows: this.splitTo === "rows"
    };
  }

  public get paneStyle(): { cursor: string } {
    const cursor = this.active
      ? this.splitTo === "columns"
        ? "col-resize"
        : "row-resize"
      : "unset";
    return {
      cursor
    };
  }

  public iStyleFirst(): {
    flex: number | string;
    position: string;
    outline: string;
    width?: string;
    height?: string;
  } {
    let el = "first";
    let style: {
      flex: number | string;
      position: string;
      outline: string;
      width?: string;
      height?: string;
    } = { flex: 1, position: "relative", outline: "none" };

    if (el === this.primary) {
      style.flex = "0 0 auto";
      let units = this.units === "pixels" ? "px" : "%";
      this.splitTo === "columns"
        ? (style.width = this.localSize + units)
        : (style.height = this.localSize + units);
    } else {
      style.flex = "1 1 0%";
    }

    return style;
  }

  public iStyleSecond(): {
    flex: number | string;
    position: string;
    outline: string;
    width?: string;
    height?: string;
  } {
    let el = "second";
    let style: {
      flex: number | string;
      position: string;
      outline: string;
      width?: string;
      height?: string;
    } = { flex: 1, position: "relative", outline: "none" };

    if (el === this.primary) {
      style.flex = "0 0 auto";
      let units = this.units === "pixels" ? "px" : "%";
      this.splitTo === "columns"
        ? (style.width = this.localSize + units)
        : (style.height = this.localSize + units);
    } else {
      style.flex = "1 1 0%";
    }

    return style;
  }

  private round2Fixed(value: number): number {
    let val = +value;

    if (isNaN(val)) {
      return NaN;
    }

    val = Math.round(+(val.toString() + "e2"));
    return +(val.toString() + "e-2");
  }

  private handlePointerDown(event: PointerEvent): void {
    if (!this.allowResize) {
      return;
    }

    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    this.position = this.splitTo === "columns" ? event.clientX : event.clientY;
    this.active = true;

    this.pointerId = event.pointerId;
    (
      (this.$refs.resizer as Resizer).$refs.resizer as HTMLDivElement
    ).setPointerCapture(event.pointerId);
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    if (this.allowResize && this.active) {
      event.stopImmediatePropagation();
      event.preventDefault();

      //unFocus(document, window);
      const isPrimaryFirst = this.primary === "first";
      const ref = isPrimaryFirst ? "panel1" : "panel2";

      const node = (this.$refs[ref] as Panel).$refs.Panel as HTMLElement;
      if (!node.getBoundingClientRect) {
        return;
      }

      // Where is cursor positioned
      const current =
        this.splitTo === "columns" ? event.clientX : event.clientY;

      // Current pane size (width || height)
      const size =
        this.splitTo === "columns"
          ? node.getBoundingClientRect()["width"]
          : node.getBoundingClientRect()["height"];

      // Direct parent size (width || height)
      const parent = node.parentElement;
      if (!parent) {
        return;
      }
      const parentRect = parent.getBoundingClientRect();

      const pSize =
        this.splitTo === "columns" ? parentRect.width : parentRect.height;

      let positionDelta = this.position - current;
      const sizeDelta = isPrimaryFirst ? positionDelta : -positionDelta;
      let newSize =
        this.units === "percents"
          ? this.round2Fixed(((size - sizeDelta) * 100) / pSize)
          : size - sizeDelta;
      let newPosition = this.position - positionDelta;

      if (this.step) {
        if (Math.abs(positionDelta) < this.step) {
          return;
        }
        // eslint-disable-next-line no-bitwise
        positionDelta = ~~(positionDelta / this.step) * this.step;
      }

      if (this.minSize && newSize < this.minSize) {
        newSize = this.minSize;
        newPosition = this.position;
      }

      if (this.maxSize && newSize > this.maxSize) {
        newSize = this.maxSize;
        newPosition = this.position;
      }

      this.localSize = newSize;
      this.position = newPosition;
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    if (this.allowResize && this.active) {
      this.$emit("update:size", this.localSize);
      this.active = false;
      this.pointerId = null;
      (
        (this.$refs.resizer as Resizer).$refs.resizer as HTMLDivElement
      ).releasePointerCapture(event.pointerId);
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }
}
</script>

<style scoped>
*,
*:before,
*:after {
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
}
.root {
  height: 100%;
  width: 100%;
}
.columns {
  flex-direction: row;
  left: 0;
  right: 0;
}
.rows {
  flex-direction: column;
  bottom: 0;
  top: 0;
  min-height: 100%;
  width: 100%;
}
.panel {
  display: flex;
  flex: 1;
  position: absolute;
  outline: none;
  overflow: hidden;
  user-select: text;
}
</style>
