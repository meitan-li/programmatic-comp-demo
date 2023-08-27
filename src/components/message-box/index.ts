import {createApp} from "vue";
import MyMessageBox from './MyMessageBox.vue'

export interface MessageBoxProp {
  title?: string;
  message: string;
}

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
