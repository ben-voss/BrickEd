<template>
  <div class="modelView">
    <div class="modelViewContent">
      <div class="ul">
        <TreeItem
          v-for="(child, id) in items"
          :key="id"
          :item="child"
          :level="0"
          @set-selection="handleSetSelection"
        ></TreeItem>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Model from "../../app/files/Model";
import PartCommand from "../../app/files/PartCommand";
import Command from "../../app/files/Command";
import MetaCommand from "../../app/files/MetaCommand";
import TreeItem from "./TreeItem.vue";
import { TreeNode } from "./TreeNode";
import { Prop, Watch } from "vue-property-decorator";
import { State } from "s-vuex-class";

@Options({
  components: {
    TreeItem
  }
})
export default class ModelView extends Vue {
  private open: TreeNode | null = null;
  private selected: TreeNode | null = null;
  private items: TreeNode[] = [];

  private id = 0;

  @State("model", { namespace: "document" })
  private model!: Model[];

  @Prop({
    type: Object as () => Model,
    default: () => null
  })
  readonly selectedModel!: Model;

  @Prop({
    type: Object as () => MetaCommand,
    default: () => null
  })
  readonly selectedStep!: MetaCommand;

  @Prop({
    type: Object as () => PartCommand,
    default: () => null
  })
  readonly selectedPart!: PartCommand;

  @Watch("model", {
    immediate: true
  })
  private handleModelChanged(newVal: Model[]) {
    if (newVal && newVal.length > 0) {
      this.items = this.buildTree(newVal);
      this.selected = this.items[0];
      this.open = this.items[0];

      this.$emit("update:selectedModel", this.selected?.ref);
    } else {
      this.items = [];
      this.selected = null;
      this.open = null;
    }
  }

  private selectedTreeNode: TreeNode | null = null;

  private handleSetSelection(item: TreeNode[]) {
    if (this.selectedTreeNode) {
      this.selectedTreeNode.isSelected = false;
    }

    this.selectedTreeNode = item[0];
    this.selectedTreeNode.isSelected = true;

    this.$emit("update:selectedModel", item[item.length - 1].ref);
    if (item.length > 1) {
      this.$emit("update:selectedStep", item[item.length - 2].ref);
      if (item.length > 2) {
        this.$emit("update:selectedPart", item[item.length - 3].ref);
      }
    }
  }

  private buildTree(models: Model[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const model of models) {
      // Chop off the '.ldr' suffix
      let name = model.file;
      if (name.toLowerCase().endsWith(".ldr")) {
        name = name.substring(0, name.length - 4);
      }

      result.push({
        id: this.id++,
        ref: model,
        name: name,
        children: this.buildSteps(model.commands),
        isSelected: false
      });
    }
    return result;
  }

  private buildSteps(commands: Command[]): TreeNode[] {
    const result: TreeNode[] = [];

    let currentStep: TreeNode = {
      id: this.id++,
      ref: null,
      name: "Step",
      children: [],
      isSelected: false
    };

    for (const command of commands) {
      switch (command.lineType) {
        case 0: {
          const metaCommand = command as MetaCommand;

          if (metaCommand.metaName === "STEP") {
            if (currentStep.children.length > 0) {
              result.push(currentStep);
            }

            currentStep = {
              id: this.id++,
              ref: metaCommand,
              name: "Step",
              children: [],
              isSelected: false
            };
          }
          break;
        }

        case 1: {
          const partCommand = command as PartCommand;

          currentStep.children?.push({
            id: this.id++,
            ref: partCommand,
            name: partCommand.file,
            children: [],
            isSelected: false
          });

          break;
        }
      }
    }

    if (currentStep.children.length > 0) {
      result.push(currentStep);
    }

    return result;
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.modelView {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.modelViewContent {
  width: 100%;
  height: 100%;
  overflow: scroll;
  box-sizing: border-box;
}
.ul {
  padding-left: 2px;
  padding-right: 2px;
  padding-top: 2px;
  color: $text-color;
}
</style>
