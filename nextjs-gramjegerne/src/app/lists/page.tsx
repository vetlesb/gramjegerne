"use client";

import { useState, useEffect } from "react";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import AddListDialog from "../../components/addListDialog";
import ListItem from "../../components/ListItem";
import { ListDocument } from "@/types";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useSession } from "next-auth/react";

export default function Page() {
  const { data: session } = useSession();
  const [lists, setLists] = useState<ListDocument[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId]{
      _id, 
      slug, 
      name, 
      image, 
      days, 
      weight, 
      participants
    }`;

    // Initial fetch with user ID
    client
      .fetch(query, { userId: session.user.id })
      .then((data) => setLists(data));

    // Subscribe to real-time updates with user filter
    const subscription = client
      .listen(query, { userId: session.user.id })
      .subscribe({
        next: () => {
          client
            .fetch(query, { userId: session.user.id })
            .then((data) => setLists(data));
        },
        error: (error) => {
          console.error("Subscription error:", error);
        },
      });

    return () => subscription.unsubscribe();
  }, [session?.user?.id]);

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <h1 className="text-4xl md:text-6xl text-accent py-4 pb-12">
          lager pakklister
        </h1>
        <div className="flex flex-col gap-y-8">
          <AddListDialog />

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-4">
            {lists.map((list) => (
              <ListItem key={list._id} list={list} />
            ))}
          </ul>
        </div>
      </main>
    </ProtectedRoute>
  );
}
