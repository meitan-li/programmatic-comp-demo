Element的MessageBox组件[Message Box 信息弹窗框](https://element-plus.org/zh-CN/component/message-box.html)可以让我们以编程式调用一个即用即走的弹窗，免去了在`<template>`中定义一个el-doalog再通过一堆变量去控制的麻烦。<br/>

有时候，UI同学需要一个有自己系统风格的MessageBox，要是在每处用到的地方都在`<template>`中写一套弹窗，那也未免太麻烦了，接下来让我们来实现一个自己的可以编程式调用的Vue组件。


# 1. 首先我们准备一个Vue弹窗组件MyMessageBox.vue<br/>

*MessageBoxProp只是一个类型定义，第二节中有，这里先不关注*
```ts
<script setup lang="ts">
import {ref} from "vue";
import {MessageBoxProp} from "./index";

const emit = defineEmits<{
  confirm: [], // 点击确认按钮
  closed: [],// 当组件被关闭后
}>()
withDefaults(defineProps<MessageBoxProp>(), {
  title: '提示',
})

// 使默认值为true，这样只要该组件被挂载到页面中就会显示出来
const visible = ref(true)
</script>

<template>
  <el-dialog v-model="visible" :title="title" @close="emit('closed')">
    <h3>{{ message }}</h3>

    <template #footer>
      <el-button type="primary" @click="emit('confirm')">确认</el-button>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>
```
现在这个组件只要引入到`<template>`中就会被展示出来。但我们想要的是JS调用方式。

# 2. 接下来我们写一个函数来实现当函数调用时渲染该组件：
index.ts
```ts
import {createApp} from "vue";
import MyMessageBox from './MyMessageBox.vue'

export interface MessageBoxProp {
  title?: string;
  message: string;
}

export const confirmMessageBox = (props: MessageBoxProp) => {
  // 创建一个容器，用来装vue渲染的内容
  const div = document.createElement('div')
  // 创建App实例
  // 第二个参数是将传递给实例的props参数
  const app = createApp(MyMessageBox, {
    title: props.title,
    message: props.message,
  })
  // 将实例渲染到容器中
  app.mount(div)
  // 将渲染出的结果追加到页面
  document.body.appendChild(div)
}
```
**需要注意的是：**
由于我们创建了一个新的app，此时这个app中并没有那些在项目入口处全局挂载的内容，所以直接调用此函数将报错：无法找到el-dialog组件等等.<br/>
所以需要把那些在编程式调用的组件中用到的全局的组件/指令等也挂载到这个app中，比如：
```ts
app.use(ElementPlus)
```
**但是，**
这样未免太重了些，更好的方式是直接在我们的组件中单独引用它们：
```ts
import {ElDialog, ElButton} from "element-plus";
```

# 3. 在我们的js代码中调用该函数
然后编写代码在组App.vue中调用这个函数
```ts
<script setup lang="ts">
import {confirmMessageBox} from "./components/message-box/index";

const remove = () => {
  confirmMessageBox({title: '确认删除？', message: '您确定要删除该数据？'})
}
</script>

<template>
  <el-button @click="remove">删除</el-button>
</template>
```
点击按钮：
![chrome-capture-2023-7-27 (2).gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cea1c369d6694e4c83cba828d0a5c5e7~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1000&h=627&e=gif&f=90&b=fefefe)
可以看到组件被渲染并插入到body中，但是出现了一个严重的问题，当关闭弹窗后，dom并没有被卸载，并且目前的代码也不知道用户是否点击了确认。<br/>

# 4.关闭弹窗时移除dom、点击确认时执行外部传入的回调
只需要改造下createApp的第二个参数，并且给函数参数添加`confirm`申明：
```ts
export const confirmMessageBox = (props: MessageBoxProp & { confirm: () => void }) => {
  // 创建一个容器，用来装vue渲染的内容
  const div = document.createElement('div')
  // 创建App实例
  // 第二个参数是将传递给实例的props参数
  const app = createApp(MyMessageBox, {
    title: props.title,
    message: props.message,
    onConfirm: () => {
      // 外部传入的确认回调
      props.confirm()
    },
    onClosed: () => {
      document.body.removeChild(div)
    }
  })
  // 将实例渲染到容器中
  app.mount(div)
  // 将渲染出的结果追加到页面
  document.body.appendChild(div)
}
```
**知识点：**
createApp中的根组件的`props`可以在第二个参数中直接传递，根组件的`emit`回调则需要改变为`onXXX`的形式来传递。

然后在调用的地方添加确认处理：<br>
index.ts
```ts
<script setup lang="ts">
import {confirmMessageBox} from "./components/message-box/index";

const remove = () => {
  confirmMessageBox({
    title: '确认删除？',
    message: '您确定要删除该数据？',
    confirm: () => {
      console.log('删掉它！')
    }
  })
}
</script>

<template>
  <el-button @click="remove">删除</el-button>
</template>
```

现在组件就会在关闭时移除dom，点击确认也会执行传入的处理函数。

![chrome-capture-2023-7-27 (3).gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dac250e33a4649218ed8ed39e47e6a92~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1000&h=627&e=gif&f=76&b=fefefe)

细心的朋友已经发现了，弹窗在出现时是有动画的，但是移除时立即就被删除了，这太不优雅。<br/>
* 方式一： 简单的解决办法是直接添加一个延时：
```ts
const app = createApp(MyMessageBox, {
  // ...
  onClosed: () => {
    setTimeout(() => {
      document.body.removeChild(div)
    }, 300)
  }
})
```
* 方式二：更好的办法是直接使用`el-dialog`的`closed`事件而不是`close`事件：<br/>
  修改MyMessageBox.vue：
```ts
<template>
<!-- 使用@closed来保证弹窗关闭动画结束后再移除dom -->
  <el-dialog v-model="visible" :title="title" @closed="emit('closed')">
    <h3>{{ message }}</h3>

    <template #footer>
      <el-button type="primary" @click="emit('confirm')">确认</el-button>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>
```
现在组件的加载、关闭、确认回调都已经完成了。

# 4. 弹窗的关闭时机
现在，当点击取消或<kbd>X</kbd>时弹窗就会关闭并从dom中移除。<br>
点击确认按钮就会打印"删掉它！"，我们还没有后续处理，所以点击确认后弹窗也不会关闭。<br/>

如果我们再点击了确认后直接移除弹窗，那动画又没了，**并且多数场景下我们不应该在`onConfirm`中关闭弹窗**，考虑这种场景： 点击确认后调用API，API成功了则关闭弹窗，失败了则保持弹窗的打开状态以方便用户重试。

所以需要将弹窗的关闭回调交给使用调用它的函数，由外部的函数来决定是否关闭弹窗：
1. 首先在MyMessageBox.vue中对外暴露关闭弹窗的方法
```ts
defineExpose({
  hide: () => {
    visible.value = false
  }
})
```
2. 然后将一个调用组件`hide`方法的回调提供给外部调用者：
```ts
export const confirmMessageBox = (props: MessageBoxProp & { confirm: (done: () => void) => void }) => {
  // 创建一个容器，用来装vue渲染的内容
  const div = document.createElement('div')
  // 根组件的实例
  let instance
  // 创建App实例
  // 第二个参数是将传递给实例的props参数
  const app = createApp(MyMessageBox, {
    title: props.title,
    message: props.message,
    onConfirm: () => {
      // 外部传入的确认回调
      props.confirm(() => {
        instance?.hide()
      })
    },
    onClosed: () => {
      document.body.removeChild(div)
    }
  })
  // 将实例渲染到容器中
  instance = app.mount(div)
  // 将渲染出的结果追加到页面
  document.body.appendChild(div)
}
```

**知识点：**<br>
`app.mount(div)`会返回根组件的实例，等同于对该组件的[模板引用](https://cn.vuejs.org/guide/essentials/template-refs.html)`ref="xxx"`。通过这个实例可以和组件进行通信，传递值或事件。

3. 调用者自由决定在合适的时机关闭弹窗<br>
```ts
const remove = () => {
  confirmMessageBox({
    title: '确认删除？',
    message: '您确定要删除该数据？',
    confirm: (done) => {
      console.log('删掉它！')
      // 调用API或其他什么事，在合适的时机关闭弹窗
      done()
    }
  })
}
```

# 5. 将函数改写为一个符合直觉的Promise
一般的使用回调就够了，但也可以将编程式调用改为Promise<br>
组件代码不用动，函数改为：<br>
```ts
export const confirmMessageBox = (props: MessageBoxProp) => {
  // 创建一个容器，用来装vue渲染的内容
  const div = document.createElement('div')
  // 根组件的实例
  let instance
  return new Promise(resolve => {
    // 创建App实例
    // 第二个参数是将传递给实例的props参数
    const app = createApp(MyMessageBox, {
      title: props.title,
      message: props.message,
      onConfirm: () => {
        resolve(() => {
          instance?.hide()
        })
      },
      onClosed: () => {
        document.body.removeChild(div)
      }
    })
    // 将实例渲染到容器中
    instance = app.mount(div)
    // 将渲染出的结果追加到页面
    document.body.appendChild(div)
  })
}
```
函数调用改为：<br>
```
const remove = () => {
  confirmMessageBox({title: '确认删除？', message: '您确定要删除该数据？'}).then((done) => {
    console.log('删掉它！')
    // 调用API或其他什么事，在合适的时机关闭弹窗
    done()
  })
}
```

![chrome-capture-2023-7-27 (4).gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a125135a74924fabbb86f62beeaabeb1~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1000&h=627&e=gif&f=77&b=fefefe)

# 完整代码
https://github.com/meitan-li/programmatic-comp-demo

# 最后
这个示例简单的介绍了如何与App实例进行通信。通过通信手段，可以在js中给组件传数据、接受vue组件的事件、调用vue组件的方法。<br>

除了二次确认弹窗，这也可以应用于在Echarts的Tooltip功能中使用Vue组件。请移步： [在ECharts的tooltip中使用Vue组件](https://juejin.cn/post/7262312427763990588)，这里面还介绍了用customElement的方式来实现编程式调用。<br>

与组件通信的方式还有不少，比如用`vuex/pinia`、用esm的特性等等
