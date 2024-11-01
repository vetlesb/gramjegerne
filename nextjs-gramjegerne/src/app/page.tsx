import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from '@sanity/image-url';
import { client } from "@/sanity/client";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client)

// Then we like to make a simple function like this that gives the
// builder an image and returns the builder for you to specify additional
// parameters:
function urlFor(SanityImageSource: SanityImageSource) {
  return builder.image(SanityImageSource)
}

const ITEMS_QUERY = `*[
  _type == "item"
]{name, slug, image, category, size, weight, quantity, calories}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const items = await client.fetch<SanityDocument[]>(ITEMS_QUERY, {}, options);
console.log (items)
  return (
    <main className="container mx-auto min-h-screen p-8">
    
      <ul className="flex flex-col">
        {items.map((item) => (
          <li className="product" key={item._id}>
             <div className="flex flex-wrap items-center justify-between">
              <div className="flex flex-wrap gap-x-4">
              <div className="h-24 w-24">
  <img className="rounded-md h-full w-full object-cover" src={urlFor(item.image).url()} />
</div>
              <div className="flex flex-col gap-y-2">
              <h2 className="text-xl font-semibold">{item.name}</h2>
              <div className="flex flex-wrap gap-x-2">
              <p className="text-xs tag w-fit">{item.category.category}</p>
              <p className="text-xs tag w-fit flex flex-wrap">{item.size}</p>
              <p className="text-xs tag w-fit">{item.weight.weight} {item.weight.unit}</p>
              <p className="text-xs tag w-fit">{item.calories} kcal</p>
              </div>
              </div>
              </div>
              <div className="flex gap-x-2">
                <button className="button-ghost flex gap-x-2 items-center" type="submit">
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.3281 1.82034L14.4219 0.914088L14.9375 0.406276C15.1719 0.171901 15.5 0.140651 15.7188 0.367213L15.8516 0.492213C16.0859 0.734401 16.0859 1.0469 15.8359 1.30471L15.3281 1.82034ZM6.17969 10.2266C6.0625 10.2735 5.92969 10.1328 5.98438 10.0235L6.625 8.72659L13.8984 1.44534L14.7969 2.34378L7.52344 9.62503L6.17969 10.2266ZM3.125 15.3985C1.60156 15.3985 0.820312 14.625 0.820312 13.1172V4.13284C0.820312 2.61721 1.60156 1.84378 3.125 1.84378H12.2109L11.25 2.81253H3.14062C2.26562 2.81253 1.78906 3.28128 1.78906 4.17971V13.0625C1.78906 13.9688 2.26562 14.4297 3.14062 14.4297H12.2031C12.9297 14.4297 13.4062 13.9688 13.4062 13.0625V5.01565L14.375 4.05471V13.1172C14.375 14.625 13.5938 15.3985 12.2266 15.3985H3.125Z" fill="#EAFFE2"/>
</svg>
                  </button>
                <button className="button-ghost flex gap-x-2 items-center" type="submit">
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.125 17.3359C3.10938 17.3359 2.39844 16.6406 2.35156 15.6406L1.76562 3.97656H0.648438C0.40625 3.97656 0.195312 3.77344 0.195312 3.52344C0.195312 3.27344 0.40625 3.0625 0.648438 3.0625H4.32812V1.79688C4.32812 0.742188 5.00781 0.109375 6.13281 0.109375H9.1875C10.3125 0.109375 11 0.742188 11 1.79688V3.0625H14.6797C14.9297 3.0625 15.1328 3.26562 15.1328 3.52344C15.1328 3.77344 14.9375 3.97656 14.6797 3.97656H13.5703L12.9922 15.6406C12.9453 16.6406 12.2188 17.3359 11.2109 17.3359H4.125ZM5.28125 1.84375V3.0625H10.0391V1.84375C10.0391 1.32812 9.69531 1.00781 9.14062 1.00781H6.17969C5.63281 1.00781 5.28125 1.32812 5.28125 1.84375ZM4.20312 16.4219H11.125C11.625 16.4219 12.0156 16.0391 12.0391 15.5391L12.5938 3.97656H2.71094L3.29688 15.5391C3.32031 16.0391 3.71094 16.4219 4.20312 16.4219ZM5.33594 14.9141C5.10156 14.9141 4.95312 14.7656 4.94531 14.5469L4.6875 5.90625C4.6875 5.6875 4.84375 5.53906 5.07812 5.53906C5.29688 5.53906 5.45312 5.67969 5.46094 5.89844L5.71875 14.5469C5.72656 14.7578 5.57031 14.9141 5.33594 14.9141ZM7.67188 14.9141C7.4375 14.9141 7.27344 14.7656 7.27344 14.5469V5.90625C7.27344 5.6875 7.4375 5.53906 7.67188 5.53906C7.90625 5.53906 8.0625 5.6875 8.0625 5.90625V14.5469C8.0625 14.7656 7.90625 14.9141 7.67188 14.9141ZM10 14.9219C9.76562 14.9219 9.60938 14.7656 9.61719 14.5469L9.875 5.89844C9.88281 5.67969 10.0391 5.53906 10.2578 5.53906C10.4922 5.53906 10.6484 5.6875 10.6484 5.91406L10.3906 14.5547C10.3828 14.7734 10.2266 14.9219 10 14.9219Z" fill="#EAFFE2"/>
</svg>
                  </button>
              </div>
              </div>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col">
        <li className="form">
        <div className="flex flex-col gap-y-8">
        <h2 className="text-2xl font-semibold">Add item</h2>
        <div className="flex flex-col gap-y-2">
        <label className="flex text-s">Navn</label>
        <input name="query" />
        </div>
        <div className="flex flex-col gap-y-2">
        <label className="text-s">Bilde</label>
        <input type="file" name="query" />
        </div>
        <div className="flex flex-col gap-y-2">
        <label className="text-s">Kategori</label>
        <select className="minimal">
        <option value="au">Clothing</option>
        <option value="ca">Nutrition</option>
        <option value="usa">Paddling</option>
        </select>
        </div>
        <div className="flex flex-col gap-y-2">
        <label className="text-s">Vekt</label>
        <input name="query" />
        </div>
        <div className="flex flex-col gap-y-2">
        <label className="text-s">Kalorier</label>
        <input name="query"/>
        </div>
        <button type="submit">Add item</button>
        <button className="button-secondary" type="submit">Cancel</button>
        </div>
        </li> </ul>
    </main>

    
  );
}

