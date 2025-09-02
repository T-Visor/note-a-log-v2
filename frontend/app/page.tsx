import { Textarea } from "@/components/ui/textarea";

const Home = () => {
  return (
    <div
      className="
        flex flex-col justify-center items-center 
        bg-gray-50
      "
    >
      { /* Title Bar */}
      <Textarea
        className="
            h-6 border-b-0 rounded-b-none 
            !text-2xl resize-none
          "
        placeholder="Title"
      />

      { /* Content Area */}
      <Textarea
        className="
          min-w-150 min-h-130 
          border-t-0 rounded-t-none
          resize-none !text-lg
        "
        placeholder="Content"
      />
    </div>
  );
}

export default Home;