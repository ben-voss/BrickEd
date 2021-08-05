<template>
  <div class="partLibraryPanel">
    <div class="searchContainer">
      <select class="category" v-model="selectedCategory">
        <option v-for="category in categories" v-bind:key="category">
          {{ category }}
        </option>
      </select>
      <div>
        <input
          type="text"
          class="search"
          v-model="searchText"
          @input="handleInput"
        />
        <input type="checkbox" class="unoffical" v-model="showUnofficial" />
      </div>
    </div>
    <div class="searchResults">
      <SplitPanel
        class="split"
        split-to="rows"
        :allow-resize="true"
        :size="50"
        units="percents"
      >
        <template v-slot:firstPanel>
          <select
            @dblclick="handleDoubleClick"
            class="partsList"
            v-model="selectedPart"
            multiple
          >
            <option
              v-for="part in parts"
              v-bind:value="part"
              :key="(part.iU === 't') + part.f"
            >
              {{ part.f + " | " + part.d }}
            </option>
          </select>
        </template>
        <template v-slot:secondPanel>
          <PartPanel class="model" :renderModel="renderModel"></PartPanel>
        </template>
      </SplitPanel>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import RenderModelFactory from "@/app/RenderModelFactory";
import Model from "@/app/files/Model";
import PartPanel from "./PartPanel.vue";
import LdrColorLoader from "@/app/files/LdrColorLoader";
import LdrColor from "@/app/files/LdrColor";
import RenderModel from "@/app/RenderModel";
import { Watch } from "vue-property-decorator";
import SplitPanel from "../SplitPanel/SplitPanel.vue";
import { Action, State } from "s-vuex-class";
import PartInfo from "../../app/partIndex/PartInfo";
import { LazyInject, Symbols } from "@/di";

@Options({
  components: {
    PartPanel,
    SplitPanel
  }
})
export default class PartLibraryPanel extends Vue {
  public categories: string[] = [];
  public selectedCategory: string | null = null;
  public showUnofficial = false;
  public parts: PartInfo[] = [];
  public selectedPart: PartInfo[] = [];

  public renderModel: RenderModel | null = null;

  private searchText = "";

  @LazyInject(Symbols.LdrColorLoader)
  readonly ldrColorLoader!: LdrColorLoader;

  @LazyInject(Symbols.RenderModelFactory)
  readonly renderModelFactory!: RenderModelFactory;

  @State("selectedColor", { namespace: "document" })
  readonly selectedColor!: LdrColor;

  @State("parts", { namespace: "partsList" })
  readonly partIndex!: { [key: string]: PartInfo[] };

  @State("selectedPart", { namespace: "partsList" })
  readonly selectedPartModel!: Model;

  @Action("addPart", { namespace: "document" })
  addPart!: (args: { file: string }) => void;

  @Action("load", { namespace: "partsList" })
  load!: () => void;

  @Action("selectPart", { namespace: "partsList" })
  selectPart!: (args: { part: PartInfo; color: LdrColor }) => void;

  mounted(): void {
    this.load();
  }

  @Watch("partIndex", {
    immediate: true
  })
  private handlePartIndexChanged(partIndex: {
    [key: string]: PartInfo[];
  }): void {
    this.categories = [];
    for (const key in partIndex) {
      this.categories.push(key);
    }
    this.selectedCategory = this.categories[0];
  }

  @Watch("showUnofficial", {
    immediate: true
  })
  private handleShowUnofficialChanged(): void {
    this.generateList();
  }

  @Watch("selectedCategory", {
    immediate: true
  })
  private handleSelectedCategoryChanged(): void {
    this.generateList();
  }

  private handleInput(): void {
    this.generateList();
  }

  @Watch("selectedPart", {
    immediate: true
  })
  private handleSelectedPartChanged(): void {
    this.generatePartPreview();
  }

  @Watch("selectedColor", {
    immediate: true
  })
  private handleSelectedColorChanged(): void {
    this.generatePartPreview();
  }

  private async generatePartPreview(): Promise<void> {
    if (!this.selectedPart || this.selectedPart.length === 0) {
      return;
    }

    this.selectPart({ part: this.selectedPart[0], color: this.selectedColor });
  }

  @Watch("selectedPartModel")
  private async handleSelectedPartModelChange(model: Model): Promise<void> {
    this.renderModel = await this.renderModelFactory.generate(model);
  }

  private handleDoubleClick(): void {
    if (!this.selectedPart || this.selectedPart.length === 0) {
      return;
    }

    this.addPart({ file: this.selectedPart[0].f + ".dat" });
  }

  private generateList(): void {
    if (!this.selectedCategory || !this.partIndex) {
      this.parts = [];
      this.selectedPart = [];
      return;
    }

    if (this.searchText !== "") {
      const searchTextLower = this.searchText.toLowerCase();

      // TODO: Is it worth saving the lower case version of the part descriptions?
      this.parts = this.partIndex[this.selectedCategory].filter(
        (p) =>
          (this.showUnofficial ? true : !(p.iU === "t")) &&
          p.d.toLowerCase().indexOf(searchTextLower) !== -1
      );
    } else {
      // No need to perform a text search
      this.parts = this.partIndex[this.selectedCategory].filter(
        // eslint-disable-next-line prettier/prettier
        p => (this.showUnofficial ? true : !(p.iU === "t"))
      );
    }

    // Having re-generated the part list ensure the selected part
    // is consistent.
    if (this.parts.length === 0) {
      this.selectedPart = [];
    } else if (this.selectedPart.length === 0) {
      this.selectedPart = [this.parts[0]];
    } else if (this.parts.indexOf(this.selectedPart[0]) === -1) {
      this.selectedPart = [this.parts[0]];
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/styles/color.scss";

.partLibraryPanel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.searchContainer {
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
}

.resultsContainer {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
}

.searchResults {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
}

.split {
  position: unset; // Clear the value set by the resize component
  width: 100%;
  height: 100%;
}

.category {
  width: 100%;
  border: 2px solid $control-border;
  box-sizing: border-box;
  background-color: $control-background;
  color: $text-color;
  position: relative;
  margin: 1px;
}

.category:focus {
  outline: none;
  border: 2px solid $selection-highlight;
}

.search {
  width: 90%;
  border: 2px solid $control-border;
  border-radius: 0%;
  box-sizing: border-box;
  background-color: $control-background;
  color: $text-color;
  padding-left: 4px;
  position: relative;
  margin: 1px;
}

.search:focus {
  outline: none;
  border: 2px solid $selection-highlight;
}

.partsList {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0%;
  box-sizing: border-box;
  background-color: $panel-background;
  color: $text-color;
  padding: 2px;
}

.partsList:focus {
  outline: none;
}

option:checked {
  outline: none;
  background-color: $selection-highlight;
}

.model {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.unoffical {
  vertical-align: middle;
  background-color: $color-3;
}
</style>
