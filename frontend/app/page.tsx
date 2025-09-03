import { Textarea } from "@/components/ui/textarea";

const Home = () => {
  return (
    <div
      className="
        h-full w-[65%]
        flex flex-col justify-center items-center 
      "
    >
      { /* Title Bar */}
      <Textarea
        className="
            h-6 
            bg-gray-50 dark:bg-gray-800 dark:border-gray-800
            border-b-0 rounded-b-none 
            !text-2xl font-semibold
            resize-none
          "
        placeholder="Title"
      />

      { /* Content Area */}
      <Textarea
        className="
          h-[85%]
          bg-gray-50 dark:bg-gray-800 dark:border-gray-800
          border-t-0 rounded-t-none
          !text-lg 
          resize-none
        "
        placeholder="Content"
      />
    </div>
  );
}

export default Home;