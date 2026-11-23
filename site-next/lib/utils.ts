import { type ClassValue } from "cn"
import { createCn } from "cn/config"

// Os tamanhos de texto (text-small, text-body...) e as alturas (h-control...) do DESIGN.md não
// existem no Tailwind padrão. Aqui o `cn` aprende os nomes, para não confundir tamanho com cor.
export const cn: (...entradas: ClassValue[]) => string = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["caption", "small", "body", "prose", "lead", "title", "heading", "page", "display"] },
      ],
    },
    theme: { spacing: ["control-sm", "control", "control-lg"] },
  },
})
