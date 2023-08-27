<script setup lang="ts">
import {confirmMessageBox} from "./components/message-box/index";

const remove = () => {
  confirmMessageBox({title: '确认删除？', message: '您确定要删除该数据？'}).then((done) => {
    console.log('删掉它！')
    // 调用API或其他什么事，在合适的时机关闭弹窗
    done()
  })
}
</script>

<template>
  <el-button @click="remove">删除</el-button>
</template>
