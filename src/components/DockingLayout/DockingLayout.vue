<template>
  <div
    ref="dockingLayout"
    class="dockingLayout"
    v-bind:style="{
      cursor: cursor
    }"
    v-on:pointerdown="handlePointerDown"
    v-on:pointermove="handlePointerMove"
    v-on:pointerup="handlePointerUp"
  >
    <DockingLayoutGroup
      :items="group.items"
      :orientation="group.orientation"
      :width="group.width"
      :height="group.height"
      :isSizerVisible="group.isSizerVisible"
      :sizerPosition="group.sizerPosition"
      :onlyHaveOnePanel="
        group.items.length === 1 && group.items[0].type === 'layoutPanel'
      "
    >
      <template v-for="(_, name) in $slots" v-slot:[name]="slotData"
        ><slot :name="name" v-bind="slotData"
      /></template>
    </DockingLayoutGroup>
    <DockingLayoutFloatingGroup
      v-for="group in floatingGroups"
      :key="floatingGroups.indexOf(group)"
      :group="group.group"
      :left="group.left"
      :top="group.top"
      :width="group.width"
      :height="group.height"
      :zIndex="group.zIndex"
    >
      <template v-for="(_, name) in $slots" v-slot:[name]="slotData"
        ><slot :name="name" v-bind="slotData"
      /></template>
    </DockingLayoutFloatingGroup>
    <div
      class="dockingLayoutShadow"
      :style="{
        display: isDockShadowVisible ? 'block' : 'none',
        left: dockShadowLeft + 'px',
        top: dockShadowTop + 'px',
        height: dockShadowHeight + 'px',
        width: dockShadowWidth + 'px'
      }"
    ></div>
    <DockingLocationOverlay
      :isDocking="isDocking"
      :isDockingToTab="isDockingToTab"
      :x="dockLeft"
      :y="dockTop"
      :dockGroupTopVisible="dockGroupTopVisible"
      :dockGroupBottomVisible="dockGroupBottomVisible"
      :dockGroupLeftVisible="dockGroupLeftVisible"
      :dockGroupRightVisible="dockGroupRightVisible"
    ></DockingLocationOverlay>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { DockingLayoutConfig } from "./DockingLayoutConfig";
import { DockingLayoutPanelConfig } from "./DockingLayoutPanelConfig";
import { DockingLayoutTabConfig } from "./DockingLayoutTabConfig";
import { DockingLayoutGroupConfig } from "./DockingLayoutGroupConfig";
import { DockingLayoutFloatingGroupConfig } from "./DockingLayoutFloatingGroupConfig";
import { FloatingGroupProps } from "./Props/FloatingGroupProps";
import { GroupProps } from "./Props/GroupProps";
import { PanelProps } from "./Props/PanelProps";
import { TabProps } from "./Props/TabProps";
import { Rect } from "./Rect";
import { HitTest } from "./HitTest";
import { Interaction } from "./Interactions/Interaction";
import { DockedResize } from "./Interactions/DockedResize";
import { DockedMove } from "./Interactions/DockedMove";
import { FloatingMove } from "./Interactions/FloatingMove";
import { FloatingResize } from "./Interactions/FloatingResize";
import { FloatingActivate } from "./Interactions/FloatingActivate";
import { HitTester } from "./HitTester";
import { DockingLayoutData } from "./DockingLayoutData";
import { FloatingClose } from "./Interactions/FloatingClose";
import { DockedClose } from "./Interactions/DockedClose";
import { TabItemProps } from "./Props/TabItemProps";
import { TabSelection } from "./Interactions/TabSelection";
import DockingLayoutGroup from "./DockingLayoutGroup.vue";
import DockingLayoutFloatingGroup from "./DockingLayoutFloatingGroup.vue";
import DockingLocationOverlay from "./DockingLocationOverlay.vue";

@Options({
  components: {
    DockingLayoutGroup,
    DockingLayoutFloatingGroup,
    DockingLocationOverlay
  }
})
export default class DockingLayout extends Vue implements DockingLayoutData {
  public group: GroupProps = {
    orientation: "horizontal",
    items: [],
    type: "layoutGroup",
    width: 100,
    height: 100,
    isSizerVisible: false,
    sizerPosition: 0
  };
  public floatingGroups: FloatingGroupProps[] = [];
  public cursor: string | null = null;
  public isDocking = false;
  public isDockingToTab = false;
  public dockLeft = 0;
  public dockTop = 0;
  public isDockShadowVisible = false;
  public dockShadowLeft = 0;
  public dockShadowTop = 0;
  public dockShadowWidth = 0;
  public dockShadowHeight = 0;
  public dockGroupRightVisible = false;
  public dockGroupLeftVisible = false;
  public dockGroupTopVisible = false;
  public dockGroupBottomVisible = false;

  // ID of the pointer when capturing pointer events
  private pointerId: number | null = null;
  private capturedInteraction: Interaction | null = null;
  private floatingInteractions: Interaction[] = [];
  private dockedInteractions: Interaction[] = [];

  private dockingLayoutDiv!: HTMLDivElement;

  @Prop({
    type: Object as () => DockingLayoutConfig | null,
    required: true,
    default: null
  })
  readonly config!: DockingLayoutConfig | null;

  @Watch("config", {
    immediate: true
  })
  private handleConfigChanged(config: DockingLayoutConfig): void {
    if (config) {
      this.group = {
        type: "layoutGroup",
        width: 100,
        height: 100,
        orientation: config.group.orientation,
        items: this.generateItems(config.group.items, config.group.orientation),
        isSizerVisible: false,
        sizerPosition: 0
      };

      const items = [];
      if (config.floatingGroups) {
        for (const group of config.floatingGroups) {
          items.push(this.generateFloating(group));
        }
      }
      this.floatingGroups = items;
    } else {
      this.group = {
        orientation: "horizontal",
        items: [],
        type: "layoutGroup",
        width: 100,
        height: 100,
        isSizerVisible: false,
        sizerPosition: 0
      };
      this.floatingGroups = [];
    }
  }

  mounted(): void {
    this.dockingLayoutDiv = this.$refs.dockingLayout as HTMLDivElement;

    this.floatingInteractions = [
      new FloatingActivate(),
      new FloatingClose(),
      new FloatingResize(),
      new FloatingMove(this.dockingLayoutDiv)
    ];
    this.dockedInteractions = [
      new TabSelection(),
      new DockedClose(),
      new DockedResize(),
      new DockedMove(this.dockingLayoutDiv)
    ];
  }

  private generateItems(
    configs: (
      | DockingLayoutGroupConfig
      | DockingLayoutTabConfig
      | DockingLayoutPanelConfig
    )[],
    orientation: string
  ): (PanelProps | TabProps | GroupProps)[] {
    const items = [];

    for (const item of configs) {
      switch (item.type) {
        case "layoutPanel": {
          items.push(this.generatePanel(item, orientation));
          break;
        }

        case "layoutGroup": {
          items.push(this.generateGroup(item, orientation));
          break;
        }

        case "layoutTab": {
          items.push(this.generateTab(item, orientation));
          break;
        }
      }
    }

    return items;
  }

  private generateGroup(
    config: DockingLayoutGroupConfig,
    orientation: string
  ): GroupProps {
    if (orientation === "horizontal") {
      return {
        type: "layoutGroup",
        orientation: config.orientation,
        items: this.generateItems(config.items, config.orientation),
        width: config.width || 0,
        height: 100,
        isSizerVisible: false,
        sizerPosition: 0
      };
    } else {
      return {
        type: "layoutGroup",
        orientation: config.orientation,
        items: this.generateItems(config.items, config.orientation),
        width: 100,
        height: config.height || 0,
        isSizerVisible: false,
        sizerPosition: 0
      };
    }
  }

  private generatePanel(
    config: DockingLayoutPanelConfig,
    orientation: string
  ): PanelProps {
    if (orientation === "horizontal") {
      return {
        type: "layoutPanel",
        title: config.title,
        slot: config.slot,
        width: config.width || 0,
        height: 100,
        closeIsPressed: false
      };
    } else {
      return {
        type: "layoutPanel",
        title: config.title,
        slot: config.slot,
        width: 100,
        height: config.height || 0,
        closeIsPressed: false
      };
    }
  }

  private generateTabItem(config: DockingLayoutPanelConfig): TabItemProps {
    return {
      type: "layoutTabItem",
      title: config.title,
      slot: config.slot,
      itemWidth: 42
    };
  }

  private generateTab(
    config: DockingLayoutTabConfig,
    orientation: string
  ): TabProps {
    const items = [];

    for (const item of config.items) {
      items.push(this.generateTabItem(item));
    }

    if (orientation === "horizontal") {
      return {
        type: "layoutTab",
        width: config.width || 0,
        height: 100,
        items: items,
        selectedItem: items[config.selectedIndex || 0]
      };
    } else {
      return {
        type: "layoutTab",
        width: 100,
        height: config.height || 0,
        items: items,
        selectedItem: items[config.selectedIndex || 0]
      };
    }
  }

  private generateFloating(
    config: DockingLayoutFloatingGroupConfig
  ): FloatingGroupProps {
    return {
      type: "floatingGroup",
      minWidth: config.minWidth || 50,
      minHeight: config.minHeight || 20,
      width: config.width,
      height: config.height,
      top: config.top,
      left: config.left,
      zIndex: null,
      group: {
        type: "layoutGroup",
        orientation: config.orientation,
        items: this.generateItems(config.items, config.orientation),
        width: 100,
        height: 100,
        isSizerVisible: false,
        sizerPosition: 0
      }
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    if (e.pointerType !== "mouse" || e.button !== 0) {
      return;
    }

    const panelStack = this.hitTest(e.clientX, e.clientY);
    if (!panelStack) {
      return;
    }

    if (panelStack[panelStack.length - 1].item.type === "floatingGroup") {
      // Floating panels
      for (const interaction of this.floatingInteractions) {
        if (interaction.down(this, panelStack, e.clientX, e.clientY)) {
          this.capturedInteraction = interaction;
          this.pointerId = e.pointerId;
          this.dockingLayoutDiv.setPointerCapture(e.pointerId);
          e.stopImmediatePropagation();
          e.preventDefault();

          this.$forceUpdate();
          return;
        }
      }
    } else {
      // Docked panels
      for (const interaction of this.dockedInteractions) {
        if (interaction.down(this, panelStack, e.clientX, e.clientY)) {
          this.capturedInteraction = interaction;
          this.pointerId = e.pointerId;
          this.dockingLayoutDiv.setPointerCapture(e.pointerId);
          e.stopImmediatePropagation();
          e.preventDefault();

          this.$forceUpdate();
          return;
        }
      }
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (e.pointerType !== "mouse") {
      return;
    }

    if (this.pointerId && this.capturedInteraction) {
      // Pointer is captured.  Perform the approprate move action
      this.capturedInteraction = this.capturedInteraction.moveCapture(
        this,
        e.clientX,
        e.clientY
      );

      e.stopImmediatePropagation();
      e.preventDefault();

      this.$forceUpdate();
    } else {
      // Pointer is hovering - hit test to set the cursor
      const panelStack = this.hitTest(e.clientX, e.clientY);
      if (!panelStack) {
        return;
      }

      if (panelStack[panelStack.length - 1].item.type === "floatingGroup") {
        for (const interaction of this.floatingInteractions) {
          interaction.moveHover(this, panelStack, e.clientX, e.clientY);
        }
      } else {
        for (const interaction of this.dockedInteractions) {
          interaction.moveHover(this, panelStack, e.clientX, e.clientY);
        }
      }
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.pointerId !== e.pointerId || !this.capturedInteraction) {
      return;
    }

    this.capturedInteraction.up(this, e.clientX, e.clientY);

    this.pointerId = null;
    this.capturedInteraction = null;

    this.dockingLayoutDiv.releasePointerCapture(e.pointerId);
    e.stopImmediatePropagation();
    e.preventDefault();

    this.$forceUpdate();
  }

  private hitTest(x: number, y: number): HitTest[] {
    const bounds = Rect.fromDOMRect(
      this.dockingLayoutDiv.getBoundingClientRect()
    );

    if (!bounds.contains(x, y)) {
      return [];
    }

    // Hit-Test floating panels first because they sit on top of docked panels
    // Make a copy of the list of floating panels to avoid re-binding them when they
    // are storted.  Sort descending to that the topmost panel is tested first.
    const zOrderedPanels = [...this.floatingGroups] as FloatingGroupProps[];
    zOrderedPanels.sort((x, y) => (y.zIndex || 0) - (x.zIndex || 0));

    for (let i = 0; i < zOrderedPanels.length; i++) {
      const group = zOrderedPanels[i];
      const groupRect = new Rect(
        group.left,
        group.top,
        group.width,
        group.height
      );

      if (groupRect.contains(x, y)) {
        return HitTester.hitTestGroup(group.group, x, y, groupRect)
          .concat({ bounds: groupRect, item: group.group })
          .concat({ bounds: groupRect, item: group });
      }
    }

    // Hit test regular panels
    return HitTester.hitTestGroup(
      this.group as GroupProps,
      x,
      y,
      bounds
    ).concat({
      bounds: bounds,
      item: this.group
    });
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.dockingLayout {
  position: relative;
  display: block;
  box-sizing: content-box;
  background-color: magenta;
  width: 100vw;
  height: 100vh;
}
.dockingLayoutShadow {
  display: block;
  position: absolute;
  float: left;
  box-sizing: border-box;
  background-color: rgba($color-6, 0.5);
}
</style>
<style>
* {
  padding: 0px;
  margin: 0px;
}
</style>
