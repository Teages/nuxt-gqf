<script setup lang="ts">
import { request } from 'graphql-request'

const schema = useSchema('https://graphql.anilist.co')
const { defineAsyncOperation } = withGqfClient(
  schema,
  ({ url, document, variables }, _context) => {
    // @ts-expect-error ignore var not match error
    return request({ url, document, variables })
  },
)

const useAnime = defineAsyncOperation(
  (gqf, $enum) => gqf('query FetchAnime', {
    id: 'Int!',
  }, [{
    Media: $ => $({ id: $.id, type: $enum('ANIME') }, [
      'id',
      {
        title: $ => $([
          'romaji',
          'english',
          'native',
        ]),
      },
    ]),
  }]),
)
const { data } = await useAnime({ id: 127549 })
</script>

<template>
  <div> {{ data?.Media }} </div>
</template>
