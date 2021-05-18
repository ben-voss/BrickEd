<template>
  <div
    ref="dockingLayoutTabItem"
    :class="isSelected ? 'tabItem-selected' : 'tabItem'"
  >
    {{ title }}
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

export default class DockingLayoutTabItem extends Vue {
  @Prop({
    type: Number,
    default: 0
  })
  readonly width!: number;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly isSelected!: boolean;

  @Prop({
    type: String,
    default: null
  })
  readonly title!: string;

  mounted(): void {
    this.$emit(
      "update:width",
      (this.$refs.dockingLayoutTabItem as HTMLDivElement)?.clientWidth
    );
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.tabItem {
  position: relative;
  display: block;
  float: left;
  color: #aaaaaa;
  background-color: $color-2;
  border: 1px solid $color-1;
  font-family: sans-serif;
  font-size: small;
  padding: 2px 2px 2px 4px;
  white-space: nowrap;
  border: 1px solid $color-1;
  overflow: hidden;
  height: 16px;
}
.tabItem-selected {
  position: relative;
  display: block;
  float: left;
  color: #aaaaaa;
  background-color: $color-4;
  border: 1px solid $color-1;
  font-family: sans-serif;
  font-size: small;
  padding: 2px 2px 2px 4px;
  white-space: nowrap;
  border: 1px solid $color-1;
  overflow: hidden;
  height: 16px;
}
</style>
