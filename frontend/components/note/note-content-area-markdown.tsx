"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface NoteContentAreaProps {
  content: string; // store HTML (e.g., "<p>...</p>")
  handleContentChange: (event: { target: { value: string } }) => void;
}

const NoteContentArea = ({ content, handleContentChange }: NoteContentAreaProps) => {
  const editor = useEditor({
    content: content || "<p></p>",      // avoid empty -> layout shift
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Content",
        emptyEditorClass: "is-editor-empty", // used in CSS below
      }),
    ],
    editorProps: {
      attributes: {
        // Applied directly to the ProseMirror element
        class:
          [
            "tiptap",
            // typography + readable body
            "prose prose-base max-w-none dark:prose-invert",
            // sizing / spacing
            "min-h-[320px] px-3 py-2",
            // theming to match your Textarea
            "bg-gray-50 dark:bg-gray-800",
            "border border-input dark:border-gray-800",
            "rounded-none md:rounded-b-md", // you had rounded-b-none on small, md rounded
            "shadow-none",
            // text + focus
            "!text-lg leading-7 caret-current focus:outline-none",
            // wrapping
            "whitespace-pre-wrap break-words",
          ].join(" "),
        "aria-label": "Note content",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // adapt to your existing handler signature
      handleContentChange({ target: { value: html } });
    },
    // helps avoid Next.js hydration mismatches
    immediatelyRender: false,
  });

  // keep editor in sync if parent updates `content`
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== (content || "<p></p>")) {
      editor.commands.setContent(content || "<p></p>", false);
    }
  }, [content, editor]);

  return (
    <div
      className={[
        // outer shell to mirror your Textarea container look
        "flex-1 min-w-full",
        "bg-gray-50 dark:bg-gray-800 dark:border-gray-800",
        "border-t-0 rounded-t-none",
        "rounded-b-none md:rounded-b-md",
        "shadow-none",
        // show focus ring when inner editor is focused
        "focus-within:ring-0 focus-within:ring-primary/50 focus-within:ring-offset-0",
      ].join(" ")}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

export default NoteContentArea;
