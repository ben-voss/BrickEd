<template>
  <div
    ref="dockingLocationOverlay"
    class="dockingLocationOverlay"
    :style="{
      display: isDocking ? 'block' : 'none'
    }"
  >
    <svg-icon
      class="icon"
      :style="{
        left: '50vw',
        marginLeft: '-25px',
        top: '25px',
        display: dockGroupTopVisible ? 'block' : 'none'
      }"
      iconName="dock-top"
    />
    <svg-icon
      class="icon"
      :style="{
        left: '50vw',
        marginLeft: '-25px',
        top: '100vh',
        marginTop: '-75px',
        display: dockGroupBottomVisible ? 'block' : 'none'
      }"
      iconName="dock-bottom"
    />
    <svg-icon
      class="icon"
      :style="{
        left: '25px',
        top: '50vh',
        marginTop: '-25px',
        display: dockGroupLeftVisible ? 'block' : 'none'
      }"
      iconName="dock-left"
    />
    <svg-icon
      class="icon"
      :style="{
        left: '100vw',
        marginLeft: '-75px',
        top: '50vh',
        marginTop: '-25px',
        display: dockGroupRightVisible ? 'block' : 'none'
      }"
      iconName="dock-right"
    />
    <svg-icon
      class="icon"
      :style="{
        marginLeft: '-25px',
        marginTop: '-78px',
        left: x + 'px',
        top: y + 'px'
      }"
      iconName="dock-top"
    />
    <svg-icon
      class="icon"
      :style="{
        marginLeft: '-25px',
        marginTop: '28px',
        left: x + 'px',
        top: y + 'px'
      }"
      iconName="dock-bottom"
    />
    <svg-icon
      class="icon"
      :style="{
        marginLeft: '-78px',
        marginTop: '-25px',
        left: x + 'px',
        top: y + 'px'
      }"
      iconName="dock-left"
    />
    <svg-icon
      class="icon"
      :style="{
        marginLeft: '28px',
        marginTop: '-25px',
        left: x + 'px',
        top: y + 'px'
      }"
      iconName="dock-right"
    />
    <svg-icon
      class="icon"
      :style="{
        marginLeft: '-25px',
        marginTop: '-25px',
        left: x + 'px',
        top: y + 'px',
        display: isDockingToTab ? 'block' : 'none'
      }"
      iconName="dock-middle"
    />
    <svg-icon
      class="icon"
      :style="{
        marginLeft: '-25px',
        marginTop: '-25px',
        left: x + 'px',
        top: y + 'px',
        display: !isDockingToTab ? 'block' : 'none'
      }"
      iconName="dock-none"
    />
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
export default class DockingLocationOverlay extends Vue {
  @Prop({
    type: Boolean,
    default: false
  })
  readonly isDocking!: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly isDockingToTab!: boolean;

  @Prop({
    type: Number,
    default: 0
  })
  readonly x!: number;

  @Prop({
    type: Number,
    default: 0
  })
  readonly y!: number;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly dockGroupTopVisible!: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly dockGroupBottomVisible!: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly dockGroupLeftVisible!: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly dockGroupRightVisible!: boolean;
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.dockingLocationOverlay {
  position: absolute;
  float: left;
  box-sizing: border-box;
  left: 0px;
  top: 0px;
  width: 100vw;
  height: 100vh;
  z-index: 65533;
}
.icon {
  position: absolute;
  display: block;
  box-sizing: content-box;
  width: 50px;
  height: 50px;
  fill: $color-8;
  background-color: rgba($color-2, 0.7);
  border-radius: 6px;
}
.icon-hover {
  color: $color-10;
}
</style>
