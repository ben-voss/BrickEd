<template>
  <div ref="Panel" class="Panel">
    <slot>Content</slot>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({})
export default class Panel extends Vue {}
</script>

<style scoped>
.Panel {
  overflow: hidden;
}
.Panel .columns {
  flex-direction: row;
  left: 0;
  right: 0;
}
.Panel .rows {
  flex-direction: column;
  bottom: 0;
  top: 0;
  min-height: 100%;
  width: 100%;
}
</style>
