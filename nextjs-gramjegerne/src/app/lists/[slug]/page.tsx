import { client } from "@/sanity/client";
import { groq } from "next-sanity";

// GROQ query to fetch the list data based on slug
const LIST_QUERY = groq`*[_type == "list" && slug.current == $slug][0]{
  name,
  image,
  days,
  weight,
  participants
}`;

type Params = Promise<{ slug: string[] }>;

export default async function ListItemPage({ params }: { params: Params }) {
  // Await the params to get the slug
  const { slug } = await params;

  // Fetch the data based on slug
  const listData = await client.fetch(LIST_QUERY, { slug });

  // Check if the listData exists
  if (!listData) {
    return <div>List not found</div>; // Render this if data is not found
  }

  // Render the JSX to display the list details
  return (
    <main className="container mx-auto min-h-screen">
      <ul className="flex flex-wrap gap-x-4">
        <li className="flex flex-wrap product">
          <h2 className="text-xl w-fit items-center gap-x-1 flex flex-wrap">
            {listData.name}
          </h2>
        </li>
        <li className="flex flex-wrap product">
          <p className="text-xl w-fit items-center gap-x-2 flex flex-wrap">
            <svg
              className="tag-icon"
              viewBox="0 0 13 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.693374 11.0117L1.98244 5.79102C2.21095 4.86523 2.87892 4.34375 3.82228 4.34375H5.9258V3.79883C5.24025 3.55859 4.73634 2.90234 4.73634 2.14648C4.73634 1.17969 5.53908 0.376953 6.50001 0.376953C7.46095 0.376953 8.26955 1.17969 8.26955 2.14648C8.26955 2.90234 7.76564 3.55859 7.07423 3.79883V4.34375H9.17775C10.127 4.34375 10.7891 4.86523 11.0176 5.79102L12.3067 11.0117C12.6289 12.3066 12.0723 13.0625 10.8184 13.0625H2.18751C0.927749 13.0625 0.376968 12.3066 0.693374 11.0117ZM6.50001 2.9375C6.93947 2.9375 7.30275 2.57422 7.30275 2.14648C7.30275 1.70703 6.93361 1.33789 6.50001 1.33789C6.06642 1.33789 5.70314 1.71289 5.70314 2.14648C5.70314 2.57422 6.06642 2.9375 6.50001 2.9375ZM1.81251 11.0879C1.67189 11.6328 1.88283 11.9141 2.35158 11.9141H10.6543C11.1172 11.9141 11.3281 11.6328 11.1875 11.0879L9.93947 6.14844C9.82228 5.70898 9.56447 5.49219 9.12501 5.49219H3.87501C3.44142 5.49219 3.17775 5.70898 3.06642 6.14844L1.81251 11.0879Z"
                fill="#EAFFE2"
              />
            </svg>
            {listData.weight} kg
          </p>
        </li>
        <li className="flex flex-wrap product">
          <p className="text-xl w-fit items-center gap-x-2 flex flex-wrap">
            <svg
              className="tag-icon"
              viewBox="0 0 11 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.10157 9.70702C1.72266 9.9453 1.37501 9.8242 1.15626 9.60545C0.910162 9.35936 0.824224 9.0078 1.05079 8.64842L4.33594 3.41795C5.08985 2.22264 6.23047 1.87889 7.19141 2.50389C7.11329 1.67967 7.39454 0.574204 7.98047 0.714829C8.30079 0.79686 8.36329 1.17186 8.28126 1.61327C8.75391 1.08592 9.31641 0.761704 9.66407 1.10936C10.0117 1.46092 9.68751 2.02733 9.16407 2.49999C9.60547 2.41405 9.98438 2.47655 10.0664 2.80467C10.207 3.39061 9.08204 3.67186 8.26172 3.58592C8.86719 4.54686 8.52344 5.67577 7.33985 6.41795L2.10157 9.70702ZM3.42579 7.39452C3.53907 7.28124 3.71094 7.27733 3.82813 7.39061L4.08594 7.64842L4.4961 7.39061L4.15235 7.05467C4.03516 6.93749 4.03516 6.76561 4.14844 6.65233C4.26563 6.53514 4.4336 6.53514 4.55079 6.64842L4.99219 7.08202L6.98438 5.83202C8.00782 5.18358 8.15235 4.37108 7.4336 3.64452L7.11329 3.3242C6.4961 2.6992 5.80469 2.71874 5.21094 3.3867L5.94922 4.11717C6.06641 4.23436 6.06641 4.40233 5.95313 4.51952C5.83985 4.6328 5.66797 4.6367 5.55079 4.52342L4.8711 3.85155L4.61719 4.2617L5.04297 4.67967C5.16016 4.79686 5.16016 4.97264 5.04688 5.08592C4.92579 5.1992 4.76172 5.20311 4.64454 5.08592L4.30469 4.75389L1.69922 8.89452C1.62501 9.0117 1.74219 9.12108 1.85938 9.05077L3.58985 7.96092L3.42969 7.79686C3.31251 7.67967 3.31251 7.5078 3.42579 7.39452Z"
                fill="#EAFFE2"
              />
            </svg>
            14 573 kcal
          </p>
        </li>
      </ul>
    </main>
  );
}
