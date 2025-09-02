import { Textarea } from "@/components/ui/textarea";

const Home = () => {
  return (
    <div className="
            flex flex-col justify-center items-center 
            bg-gray-50
          "
    >
      <div className="
            h-full w-full 
            flex justify-start items-center
          "
      >
        <Textarea 
          className="border-b-0 rounded-b-none !text-2xl h-6 resize-none" 
          placeholder="Title"
        />
      </div>
      <Textarea 
        className="
          min-w-150 min-h-120 
          border-t-0 rounded-t-none
          resize-none !text-lg
        "
        placeholder="Content"
      />
    </div>
  );
}

export default Home;