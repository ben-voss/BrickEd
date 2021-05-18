<template>
  <div class="hello">Hi There</div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  components: {
    HiThere
  }
})
export default class HiThere extends Vue {
  //
}
</script>

<style scoped lang="scss"></style>
