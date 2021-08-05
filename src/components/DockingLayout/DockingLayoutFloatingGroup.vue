<template>
  <div
    ref="dockingLayoutFloatingGroup"
    class="dockingLayoutFloatingGroup"
    v-bind:style="{
      width: width + 'px',
      height: height + 'px',
      left: left + 'px',
      top: top + 'px',
      zIndex: zIndex
    }"
  >
    <DockingLayoutGroup
      :orientation="group.orientation"
      :items="group.items"
      :width="100"
      :height="100"
    >
      <template v-for="(_, name) in $slots" v-slot:[name]="slotData"
        ><slot :name="name" v-bind="slotData"
      /></template>
    </DockingLayoutGroup>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { GroupProps } from "./Props/GroupProps";
import DockingLayoutGroup from "./DockingLayoutGroup.vue";

@Options({
  components: {
    DockingLayoutGroup
  }
})
export default class DockingLayoutFloatingGroup extends Vue {
  @Prop({
    type: Object as () => GroupProps | null,
    default: null
  })
  readonly group!: GroupProps | null;

  @Prop({
    type: Number,
    default: 0
  })
  readonly width!: number;

  @Prop({
    type: Number,
    default: 0
  })
  readonly height!: number;

  @Prop({
    type: Number,
    default: 0
  })
  readonly left!: number;

  @Prop({
    type: Number,
    default: 0
  })
  readonly top!: number;

  @Prop({
    type: Number as () => number | null,
    default: null
  })
  readonly zIndex!: number | null;
}
</script>
<style lang="scss" scoped>
@import "@/styles/color.scss";

.dockingLayoutFloatingGroup {
  position: absolute;
  box-sizing: border-box;
  border-color: $color-6;
  border-width: 1px;
  border-style: solid;
  background-color: $app-background;
  overflow: hidden;
}
</style>
