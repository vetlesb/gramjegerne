import { client } from "@/sanity/client";
import AddListDialog from "../../components/addListDialog";
import ListItem from "../../components/ListItem";
import { ListDocument } from "@/types";

const LISTS_QUERY = `*[_type == "list"]{_id, slug, name, image, days, weight, participants}`;

export default async function ListsPage() {
  const lists = await client.fetch<ListDocument[]>(LISTS_QUERY);

  return (
    <main className="container mx-auto min-h-screen p-16">
      <AddListDialog />
      <ul className="flex flex-col">
        {lists.map((list) => (
          <ListItem key={list._id} list={list} />
        ))}
      </ul>
    </main>
  );
}
