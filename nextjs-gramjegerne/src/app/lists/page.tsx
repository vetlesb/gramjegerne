"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchLists = useCallback(async () => {
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId]{
      _id, 
      slug, 
      name, 
      image, 
      days, 
      weight, 
      participants,
      "items": items[] {
        _key,
        quantity,
        "item": item->{
          _id,
          name,
          weight,
          calories
        }
      }
    }`;

    const data = await client.fetch(query, { userId: session.user.id });
    setLists(data);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchLists();

    // Subscribe to real-time updates
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId]`;
    const subscription = client
      .listen(query, { userId: session.user.id })
      .subscribe({
        next: fetchLists,
        error: (error) => {
          console.error("Subscription error:", error);
        },
      });

    return () => subscription.unsubscribe();
  }, [session?.user?.id, fetchLists]);

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-col gap-y-8">
          <AddListDialog onSuccess={fetchLists} />

          {lists.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Opprett en pakkliste for å jakte den letteste sekken til neste
              tur.
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-4">
              {lists.map((list) => (
                <ListItem key={list._id} list={list} onDelete={fetchLists} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
