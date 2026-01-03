"use client";

import dynamic from "next/dynamic";

const NoteEditor = dynamic(() => import("@/components/note/note-editor"), {
  ssr: false,
});

const Home = () => (
  <NoteEditor />
);

export default Home;