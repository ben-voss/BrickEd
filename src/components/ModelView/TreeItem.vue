<template>
  <div
    ref="treeItem"
    v-on:pointerdown.stop="handlePointerDown"
    v-on:pointerup.stop="handlePointerUp"
  >
    <div
      :class="item.isSelected ? 'label-selected' : 'label'"
      :style="{
        paddingLeft: level * 10 + 'px'
      }"
    >
      <div
        :style="{
          textAlign: 'center',
          width: '18px',
          float: 'left',
          display: item.children.length > 0 && isExpanded ? 'block' : 'none'
        }"
      >
        v
      </div>
      <div
        :style="{
          textAlign: 'center',
          width: '18px',
          float: 'left',
          display: item.children.length > 0 && !isExpanded ? 'block' : 'none'
        }"
      >
        &gt;
      </div>
      <div
        :style="{
          textAlign: 'center',
          width: '18px',
          float: 'left',
          display: item.children.length > 0 ? 'none' : 'block'
        }"
      >
        .
      </div>
      {{ item.name }}
    </div>
    <div class="childItems" :style="{ display: isExpanded ? 'block' : 'none' }">
      <TreeItem
        v-for="(child, id) in item.children"
        :key="id"
        :item="child"
        :level="level + 1"
        @set-selection="handleSetSelection"
      ></TreeItem>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { TreeNode } from "./TreeNode";

@Options({})
export default class TreeItem extends Vue {
  private isExpanded = false;
  private captureId: number | null = null;
  private treeItemDiv!: HTMLDivElement;

  @Prop({
    type: Object as () => TreeNode,
    default: null
  })
  readonly item!: TreeNode;

  @Prop({
    type: Number,
    default: 0
  })
  readonly level!: number;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly isSelected!: boolean;

  mounted(): void {
    this.treeItemDiv = this.$refs.treeItem as HTMLDivElement;
  }

  handleSetSelection(arg: TreeNode[]): void {
    this.$emit("set-selection", [...arg, this.item]);
  }

  handlePointerDown(e: PointerEvent): void {
    if (e.pointerType !== "mouse" || e.button !== 0) {
      return;
    }

    this.captureId = e.pointerId;
    this.treeItemDiv.setPointerCapture(e.pointerId);

    this.$emit("set-selection", [this.item]);
  }

  handlePointerUp(e: PointerEvent): void {
    if (!this.captureId) {
      return;
    }

    this.captureId = null;
    this.treeItemDiv.releasePointerCapture(e.pointerId);

    this.isExpanded = !this.isExpanded;
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.childItems {
  color: $color-16;
}
.label {
  padding-bottom: 1px;
}
.label-selected {
  padding-bottom: 1px;
  background-color: $color-8;
}
.label:hover {
  background-color: $color-5;
}
</style>
