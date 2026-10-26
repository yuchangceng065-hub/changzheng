<script setup>
// 中国共产党新闻网受权发布的黄色党徽标准版本；原始 PNG 等比显示。
// 来源：http://dangjian.people.com.cn/n1/2021/0713/c117092-32156194.html
const emblemUrl = `${import.meta.env.BASE_URL}symbols/party-emblem-standard.png`
</script>

<template>
  <img class="emblem" :src="emblemUrl" alt="中国共产党党徽" width="1024" height="1024" />
</template>

<style scoped>
.emblem {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
