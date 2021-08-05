<template>
  <div class="panel">
    <div class="header">
      <div class="title">{{ title }}</div>
      <div
        class="closeButton"
        :style="{ display: onlyHaveOnePanel ? 'none' : 'block' }"
      >
        <svg-icon
          :class="closeIsPressed ? 'icon icon-pressed' : 'icon'"
          iconName="close"
        />
      </div>
    </div>
    <div class="content">
      <slot :name="slotName" />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import SvgIcon from "../SvgIcon.vue";

@Options({
  components: {
    SvgIcon
  }
})
export default class DockingLayoutPanel extends Vue {
  @Prop({
    type: String,
    default: ""
  })
  readonly title!: string;

  @Prop({
    type: String,
    default: null
  })
  readonly slotName!: string;

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
    type: Boolean,
    default: false
  })
  readonly closeIsPressed!: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly onlyHaveOnePanel!: boolean;
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.panel {
  box-sizing: border-box;
  border-color: $app-background;
  border-width: 3px;
  border-style: solid;
  background-color: $panel-background;
}
.header {
  color: $text-color;
  background-color: $panel-title-bar-color;
  border: 0px solid $color-1;
  padding: 2px 2px 3px 2px;
  overflow: hidden;
  height: 15px;
}
.title {
  margin-left: 2px;
  margin-right: 19px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.closeButton {
  position: absolute;
  right: 3px;
  top: 3px;
  width: 14px;
  height: 14px;
  border: 0px solid $color-3;
}
.icon {
  position: absolute;
  display: block;
  box-sizing: content-box;
  width: 14px;
  height: 14px;
  fill: $color-8;
}
.icon-pressed {
  background-color: $color-2;
}
.content {
  position: absolute;
  top: 22px;
  bottom: 0px;
  width: 100%;
  overflow: hidden;
}
</style>
