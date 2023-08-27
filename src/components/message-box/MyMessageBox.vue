<script setup lang="ts">
import {ref} from "vue";
import {MessageBoxProp} from "./index";
import {ElDialog, ElButton} from "element-plus";

const emit = defineEmits<{
  confirm: [], // 点击确认按钮
  closed: [],// 当组件被关闭后
}>()
withDefaults(defineProps<MessageBoxProp>(), {
  title: '提示',
})

// 使默认值为true，这样只要该组件被挂载到页面中就会显示出来
const visible = ref(true)

defineExpose({
  hide: () => {
    visible.value = false
  }
})
</script>

<template>
  <el-dialog v-model="visible" :title="title" @closed="emit('closed')">
    <h3>{{ message }}</h3>

    <template #footer>
      <el-button type="primary" @click="emit('confirm')">确认</el-button>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>
