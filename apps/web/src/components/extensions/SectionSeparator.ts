import { Node, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export interface SectionSeparatorOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sectionSeparator: {
      /**
       * Add a section separator (three dots)
       */
      setSectionSeparator: () => ReturnType;
    };
  }
}

export const SectionSeparator = Node.create<SectionSeparatorOptions>({
  name: "sectionSeparator",

  group: "block",

  parseHTML() {
    return [
      {
        tag: 'div[data-type="section-separator"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "section-separator",
        class: "section-separator",
      }),
      ["span", {}, "•"],
      ["span", {}, "•"],
      ["span", {}, "•"],
    ];
  },

  addCommands() {
    return {
      setSectionSeparator:
        () =>
        ({ chain, editor }) => {
          return chain()
            .insertContent({ type: this.name })
            .command(({ tr, dispatch }) => {
              if (dispatch) {
                const { doc, selection } = tr;
                const position = doc.resolve(selection.to).end();

                tr.insert(position, editor.schema.nodes.paragraph.create());
                tr.setSelection(
                  TextSelection.create(tr.doc, position + 1)
                );
              }
              return true;
            })
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setSectionSeparator(),
    };
  },
});

export default SectionSeparator;
