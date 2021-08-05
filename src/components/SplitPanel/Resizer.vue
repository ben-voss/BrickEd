<template>
  <span
    ref="resizer"
    @mouseover="isMouseOver = true"
    @mouseout="isMouseOver = false"
    class="Resizer"
    :style="resStyle()"
  >
  </span>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Options({})
export default class Resizer extends Vue {
  @Prop({
    type: String,
    default: "rows"
  })
  public splitTo!: string;

  @Prop({
    type: String,
    default: ""
  })
  public resizerColor!: string;

  @Prop({
    type: String,
    default: ""
  })
  public resizerHoverColor!: string;

  @Prop({
    type: Number,
    default: 5
  })
  public resizerThickness!: number;

  public isMouseOver = false;

  private get margin(): number {
    return Math.floor(this.resizerThickness / 2);
  }

  public resStyle(): { [propName: string]: string } {
    let tmpStyle: { [propName: string]: string } = {};

    tmpStyle["background-color"] = this.resizerColor;

    if (this.splitTo === "rows") {
      tmpStyle.height = this.resizerThickness + "px";
      tmpStyle.margin = `-${this.margin}px 0`;
    } else {
      tmpStyle.width = this.resizerThickness + "px";
      tmpStyle.margin = `0 -${this.margin}px`;
    }

    if (this.isMouseOver) {
      tmpStyle["background-color"] = this.resizerHoverColor;
    } else {
      tmpStyle["background-color"] = this.resizerColor;
    }

    return tmpStyle;
  }
}
</script>

<style scoped>
.Resizer {
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -moz-background-clip: padding-box;
  -webkit-background-clip: padding-box;
  background-clip: padding-box;
}
.Resizer:hover {
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.Resizer.rowsres {
  cursor: row-resize;
  width: 100%;
}
.Resizer.columnsres {
  height: 100%;
  cursor: col-resize;
}
</style>
