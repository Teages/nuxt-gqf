<script setup lang="ts">
const { data } = await useAsyncUser({ id: '1' })

const nameList = ['Alice', 'Bob', 'Charlie', 'Teages']
const name = ref(nameList[0])
function changeName() {
  const index = nameList.indexOf(name.value)
  name.value = nameList[(index + 1) % nameList.length]
}

const { data: hello } = await useHello(
  () => ({ name: name.value }),
  {
    watch: [name],
  },
)
</script>

<template>
  <div>
    {{ hello?.hello }}
    <button @click="changeName">
      Change
    </button>
  </div>
  <div v-if="data">
    <User :user="data.user" />
  </div>
  <div v-else>
    Loading...
  </div>
</template>
