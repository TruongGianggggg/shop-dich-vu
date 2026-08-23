"use client";

import {
  Bold,
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Columns3,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Merge,
  Quote,
  Redo2,
  Rows3,
  Split,
  Strikethrough,
  Table2,
  Trash2,
  Undo2,
  Unlink,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { useEffect } from "react";

const MAX_HTML_LENGTH = 3000;

type RichTextEditorProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function RichTextEditor({ disabled = false, onChange, value }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
          openOnClick: false,
        },
      }),
      TableKit.configure({
        table: { resizable: true },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const currentValue = editor.isEmpty ? "" : editor.getHTML();
    if (currentValue !== value) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  function editLink() {
    if (!editor) return;
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Nhập đường dẫn liên kết:", currentHref ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  if (!editor) return <div className="rich-text-editor rich-text-editor-loading">Đang tải trình soạn thảo...</div>;

  const htmlLength = value.length;
  return (
    <div className={`rich-text-editor${disabled ? " is-disabled" : ""}`}>
      <div aria-label="Công cụ định dạng nội dung" className="rich-text-toolbar" role="toolbar">
        <ToolbarButton active={editor.isActive("bold")} label="In đậm" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={17} /></ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} label="In nghiêng" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={17} /></ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} label="Gạch ngang" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={17} /></ToolbarButton>
        <span className="rich-text-toolbar-divider" />
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} label="Tiêu đề" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} label="Danh sách" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={17} /></ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} label="Danh sách đánh số" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} label="Trích dẫn" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={17} /></ToolbarButton>
        <span className="rich-text-toolbar-divider" />
        <ToolbarButton active={editor.isActive("link")} label="Thêm liên kết" onClick={editLink}><LinkIcon size={17} /></ToolbarButton>
        <ToolbarButton label="Bỏ liên kết" onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}><Unlink size={17} /></ToolbarButton>
        <span className="rich-text-toolbar-divider" />
        <ToolbarButton label="Tạo bảng 3 × 3" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().addRowAfter()} label="Thêm hàng bên dưới" onClick={() => editor.chain().focus().addRowAfter().run()}><BetweenHorizontalEnd size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().deleteRow()} label="Xóa hàng hiện tại" onClick={() => editor.chain().focus().deleteRow().run()}><Rows3 size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().addColumnAfter()} label="Thêm cột bên phải" onClick={() => editor.chain().focus().addColumnAfter().run()}><BetweenVerticalEnd size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().deleteColumn()} label="Xóa cột hiện tại" onClick={() => editor.chain().focus().deleteColumn().run()}><Columns3 size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().mergeCells()} label="Gộp các ô đã chọn" onClick={() => editor.chain().focus().mergeCells().run()}><Merge size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().splitCell()} label="Tách ô" onClick={() => editor.chain().focus().splitCell().run()}><Split size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().deleteTable()} label="Xóa bảng" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={17} /></ToolbarButton>
        <span className="rich-text-toolbar-spacer" />
        <ToolbarButton disabled={!editor.can().chain().focus().undo().run()} label="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={17} /></ToolbarButton>
        <ToolbarButton disabled={!editor.can().chain().focus().redo().run()} label="Làm lại" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={17} /></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <div className={`rich-text-counter${htmlLength > MAX_HTML_LENGTH ? " is-over-limit" : ""}`}>
        {htmlLength.toLocaleString("vi-VN")}/{MAX_HTML_LENGTH.toLocaleString("vi-VN")} ký tự HTML
      </div>
    </div>
  );
}

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={active ? "is-active" : ""}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
