"use client";
import { useState, useEffect } from "react";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import AddListDialog from "../../components/addListDialog";
import ListItem from "../../components/ListItem";
import { ListDocument } from "@/types";

export default function Page() {
  const [lists, setLists] = useState<ListDocument[]>([]);

  useEffect(() => {
    const query = groq`*[_type == "list"]{_id, slug, name, image, days, weight, participants}`;

    // Initial fetch
    client.fetch(query).then((data) => setLists(data));

    // Subscribe to real-time updates
    const subscription = client.listen(query).subscribe({
      next: () => {
        // Removed 'update' parameter
        // Re-fetch the lists when there's a mutation
        client.fetch(query).then((data) => setLists(data));
      },
      error: (error) => {
        console.error("Subscription error:", error);
      },
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return (
    <main className="container mx-auto min-h-screen p-16">
      <div className="flex flex-col gap-y-8">
        <AddListDialog />

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-4">
          {lists.map((list) => (
            <ListItem key={list._id} list={list} />
          ))}
        </ul>
      </div>
    </main>
  );
}
