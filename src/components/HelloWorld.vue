<template>
  <div class="hello">Hello World</div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  components: {
    HelloWorld
  }
})
export default class HelloWorld extends Vue {
  //
}
</script>

<style scoped lang="scss"></style>
