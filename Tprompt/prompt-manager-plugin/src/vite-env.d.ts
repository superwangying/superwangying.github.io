/// <reference types="vite/client" />

// CSS imports
declare module '*.css' {
  const content: string
  export default content
}

// UnoCSS virtual module
declare module 'virtual:uno.css' {
  const content: string
  export default content
}
