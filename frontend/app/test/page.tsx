import { Button } from "@/components/ui/button";

import NoteSearchDialog from "@/components/note/note-search-dialog";

const Page = () => (
  <NoteSearchDialog
    button={<Button>Hello</Button>}
  />
)

export default Page;