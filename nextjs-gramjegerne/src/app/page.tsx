import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client);

// Then we like to make a simple function like this that gives the
// builder an image and returns the builder for you to specify additional
// parameters:
function urlFor(SanityImageSource: SanityImageSource) {
  return builder.image(SanityImageSource);
}

const ITEMS_QUERY = `*[
  _type == "item"
]{name, slug, image, category, size, weight, quantity, calories}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const items = await client.fetch<SanityDocument[]>(ITEMS_QUERY, {}, options);
  console.log(items);
  return (
    <main className="container mx-auto min-h-screen p-8">
      <ul className="flex flex-col">
        {items.map((item) => (
          <li className="product" key={item._id}>
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex flex-wrap gap-x-4">
                <div className="h-24 w-24">
                  <img
                    className="rounded-md h-full w-full object-cover"
                    src={urlFor(item.image).url()}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  <div className="flex flex-wrap gap-x-2">
                    {item.size ? (
                      <p className="text-s tag w-fit items-center gap-x-1 flex flex-wrap">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M15.3184 2.13477V5.41602C15.3184 6.48242 14.7383 7.05664 13.6602 7.05664H2.33398C1.25586 7.05664 0.675781 6.48242 0.675781 5.41602V2.13477C0.675781 1.0625 1.25 0.488281 2.32812 0.488281H13.6543C14.7324 0.488281 15.3184 1.0625 15.3184 2.13477ZM14.2109 2.31641C14.2109 1.8418 13.9531 1.58398 13.502 1.58398H13.4727V4.24414C13.4727 4.39648 13.3672 4.50781 13.2148 4.50781C13.0684 4.50781 12.9512 4.40234 12.9512 4.25V1.58398H12.4238V3.26562C12.4238 3.41797 12.3242 3.5293 12.1719 3.5293C12.0254 3.5293 11.9082 3.42383 11.9082 3.27148V1.58398H11.3809V3.26562C11.3809 3.41797 11.2754 3.5293 11.123 3.5293C10.9824 3.5293 10.8652 3.42383 10.8652 3.27148V1.58398H10.3379V3.26562C10.3379 3.41797 10.2383 3.5293 10.0801 3.5293C9.93945 3.5293 9.82227 3.42383 9.82227 3.27148V1.58398H9.29492V3.26562C9.29492 3.41797 9.18945 3.5293 9.03711 3.5293C8.89648 3.5293 8.77344 3.42383 8.77344 3.27148V1.58398H8.25195V4.24414C8.25195 4.39648 8.14648 4.50781 7.99414 4.50781C7.85352 4.50781 7.73633 4.40234 7.73633 4.25V1.58398H7.20312V3.26562C7.20312 3.41797 7.10352 3.5293 6.95117 3.5293C6.80469 3.5293 6.6875 3.42383 6.6875 3.27148V1.58398H6.16016V3.26562C6.16016 3.41797 6.05469 3.5293 5.90234 3.5293C5.76172 3.5293 5.64453 3.42383 5.64453 3.27148V1.58398H5.11719V3.26562C5.11719 3.41797 5.01758 3.5293 4.85938 3.5293C4.71875 3.5293 4.60156 3.42383 4.60156 3.27148V1.58398H4.08008V3.26562C4.08008 3.41797 3.97461 3.5293 3.82227 3.5293C3.67578 3.5293 3.55859 3.42383 3.55859 3.27148V1.58398H3.03125V4.24414C3.03125 4.39648 2.92578 4.50781 2.77344 4.50781C2.63281 4.50781 2.51562 4.40234 2.51562 4.25V1.58398H2.48633C2.03516 1.58398 1.77148 1.8418 1.77148 2.31641V5.23438C1.77148 5.70312 2.03516 5.96094 2.48047 5.96094H13.502C13.9531 5.96094 14.2109 5.70312 14.2109 5.23438V2.31641Z"
                            fill="#EAFFE2"
                          />
                        </svg>
                        {item.size}
                      </p>
                    ) : null}
                    <p className="text-s tag w-fit items-center gap-x-1 flex flex-wrap">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 13 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0.693374 11.0117L1.98244 5.79102C2.21095 4.86523 2.87892 4.34375 3.82228 4.34375H5.9258V3.79883C5.24025 3.55859 4.73634 2.90234 4.73634 2.14648C4.73634 1.17969 5.53908 0.376953 6.50001 0.376953C7.46095 0.376953 8.26955 1.17969 8.26955 2.14648C8.26955 2.90234 7.76564 3.55859 7.07423 3.79883V4.34375H9.17775C10.127 4.34375 10.7891 4.86523 11.0176 5.79102L12.3067 11.0117C12.6289 12.3066 12.0723 13.0625 10.8184 13.0625H2.18751C0.927749 13.0625 0.376968 12.3066 0.693374 11.0117ZM6.50001 2.9375C6.93947 2.9375 7.30275 2.57422 7.30275 2.14648C7.30275 1.70703 6.93361 1.33789 6.50001 1.33789C6.06642 1.33789 5.70314 1.71289 5.70314 2.14648C5.70314 2.57422 6.06642 2.9375 6.50001 2.9375ZM1.81251 11.0879C1.67189 11.6328 1.88283 11.9141 2.35158 11.9141H10.6543C11.1172 11.9141 11.3281 11.6328 11.1875 11.0879L9.93947 6.14844C9.82228 5.70898 9.56447 5.49219 9.12501 5.49219H3.87501C3.44142 5.49219 3.17775 5.70898 3.06642 6.14844L1.81251 11.0879Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                      {item.weight.weight} {item.weight.unit}
                    </p>
                    {item.calories ? (
                      <p className="text-s tag w-fit items-center gap-x-1 flex flex-wrap">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 11 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.10157 9.70702C1.72266 9.9453 1.37501 9.8242 1.15626 9.60545C0.910162 9.35936 0.824224 9.0078 1.05079 8.64842L4.33594 3.41795C5.08985 2.22264 6.23047 1.87889 7.19141 2.50389C7.11329 1.67967 7.39454 0.574204 7.98047 0.714829C8.30079 0.79686 8.36329 1.17186 8.28126 1.61327C8.75391 1.08592 9.31641 0.761704 9.66407 1.10936C10.0117 1.46092 9.68751 2.02733 9.16407 2.49999C9.60547 2.41405 9.98438 2.47655 10.0664 2.80467C10.207 3.39061 9.08204 3.67186 8.26172 3.58592C8.86719 4.54686 8.52344 5.67577 7.33985 6.41795L2.10157 9.70702ZM3.42579 7.39452C3.53907 7.28124 3.71094 7.27733 3.82813 7.39061L4.08594 7.64842L4.4961 7.39061L4.15235 7.05467C4.03516 6.93749 4.03516 6.76561 4.14844 6.65233C4.26563 6.53514 4.4336 6.53514 4.55079 6.64842L4.99219 7.08202L6.98438 5.83202C8.00782 5.18358 8.15235 4.37108 7.4336 3.64452L7.11329 3.3242C6.4961 2.6992 5.80469 2.71874 5.21094 3.3867L5.94922 4.11717C6.06641 4.23436 6.06641 4.40233 5.95313 4.51952C5.83985 4.6328 5.66797 4.6367 5.55079 4.52342L4.8711 3.85155L4.61719 4.2617L5.04297 4.67967C5.16016 4.79686 5.16016 4.97264 5.04688 5.08592C4.92579 5.1992 4.76172 5.20311 4.64454 5.08592L4.30469 4.75389L1.69922 8.89452C1.62501 9.0117 1.74219 9.12108 1.85938 9.05077L3.58985 7.96092L3.42969 7.79686C3.31251 7.67967 3.31251 7.5078 3.42579 7.39452Z"
                            fill="#EAFFE2"
                          />
                        </svg>
                        {item.calories} kcal
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex gap-x-1">
                <button
                  className="button-ghost flex gap-x-2 items-center"
                  type="submit"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.3281 1.82034L14.4219 0.914088L14.9375 0.406276C15.1719 0.171901 15.5 0.140651 15.7188 0.367213L15.8516 0.492213C16.0859 0.734401 16.0859 1.0469 15.8359 1.30471L15.3281 1.82034ZM6.17969 10.2266C6.0625 10.2735 5.92969 10.1328 5.98438 10.0235L6.625 8.72659L13.8984 1.44534L14.7969 2.34378L7.52344 9.62503L6.17969 10.2266ZM3.125 15.3985C1.60156 15.3985 0.820312 14.625 0.820312 13.1172V4.13284C0.820312 2.61721 1.60156 1.84378 3.125 1.84378H12.2109L11.25 2.81253H3.14062C2.26562 2.81253 1.78906 3.28128 1.78906 4.17971V13.0625C1.78906 13.9688 2.26562 14.4297 3.14062 14.4297H12.2031C12.9297 14.4297 13.4062 13.9688 13.4062 13.0625V5.01565L14.375 4.05471V13.1172C14.375 14.625 13.5938 15.3985 12.2266 15.3985H3.125Z"
                      fill="#EAFFE2"
                    />
                  </svg>
                </button>
                <button
                  className="button-ghost flex gap-x-2 items-center"
                  type="submit"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.125 17.3359C3.10938 17.3359 2.39844 16.6406 2.35156 15.6406L1.76562 3.97656H0.648438C0.40625 3.97656 0.195312 3.77344 0.195312 3.52344C0.195312 3.27344 0.40625 3.0625 0.648438 3.0625H4.32812V1.79688C4.32812 0.742188 5.00781 0.109375 6.13281 0.109375H9.1875C10.3125 0.109375 11 0.742188 11 1.79688V3.0625H14.6797C14.9297 3.0625 15.1328 3.26562 15.1328 3.52344C15.1328 3.77344 14.9375 3.97656 14.6797 3.97656H13.5703L12.9922 15.6406C12.9453 16.6406 12.2188 17.3359 11.2109 17.3359H4.125ZM5.28125 1.84375V3.0625H10.0391V1.84375C10.0391 1.32812 9.69531 1.00781 9.14062 1.00781H6.17969C5.63281 1.00781 5.28125 1.32812 5.28125 1.84375ZM4.20312 16.4219H11.125C11.625 16.4219 12.0156 16.0391 12.0391 15.5391L12.5938 3.97656H2.71094L3.29688 15.5391C3.32031 16.0391 3.71094 16.4219 4.20312 16.4219ZM5.33594 14.9141C5.10156 14.9141 4.95312 14.7656 4.94531 14.5469L4.6875 5.90625C4.6875 5.6875 4.84375 5.53906 5.07812 5.53906C5.29688 5.53906 5.45312 5.67969 5.46094 5.89844L5.71875 14.5469C5.72656 14.7578 5.57031 14.9141 5.33594 14.9141ZM7.67188 14.9141C7.4375 14.9141 7.27344 14.7656 7.27344 14.5469V5.90625C7.27344 5.6875 7.4375 5.53906 7.67188 5.53906C7.90625 5.53906 8.0625 5.6875 8.0625 5.90625V14.5469C8.0625 14.7656 7.90625 14.9141 7.67188 14.9141ZM10 14.9219C9.76562 14.9219 9.60938 14.7656 9.61719 14.5469L9.875 5.89844C9.88281 5.67969 10.0391 5.53906 10.2578 5.53906C10.4922 5.53906 10.6484 5.6875 10.6484 5.91406L10.3906 14.5547C10.3828 14.7734 10.2266 14.9219 10 14.9219Z"
                      fill="#EAFFE2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Dialog>
          <DialogTrigger className="btn-center flex flex-wrap items-center gap-x-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-0.0078125 7.35938C-0.0078125 6.88281 0.390625 6.48438 0.867188 6.48438H5.65625V1.69531C5.65625 1.21875 6.05469 0.820312 6.53125 0.820312C7.00781 0.820312 7.40625 1.21875 7.40625 1.69531V6.48438H12.1953C12.6719 6.48438 13.0703 6.88281 13.0703 7.35938C13.0703 7.84375 12.6719 8.23438 12.1953 8.23438H7.40625V13.0234C7.40625 13.5 7.00781 13.8984 6.53125 13.8984C6.05469 13.8984 5.65625 13.5 5.65625 13.0234V8.23438H0.867188C0.390625 8.23438 -0.0078125 7.84375 -0.0078125 7.35938Z"
                fill="#1f261c"
              />
            </svg>
            Legg til utstyr
          </DialogTrigger>
          <DialogContent className="dialog">
            <DialogHeader className="flex flex-col gap-y-8">
              <DialogTitle className="text-2xl flex flex-col gap-y-4">
                Legg til utstyr
              </DialogTitle>
              <DialogDescription>
                <ul className="flex flex-col">
                  <li className="form">
                    <div className="flex flex-col gap-y-8">
                      <div className="flex flex-col gap-y-2">
                        <label className="flex text-md">Navn</label>
                        <input name="query" />
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <label className="text-md">Bilde</label>
                        <input type="file" name="query" />
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <label className="text-md">Kategori</label>
                        <select className="minimal">
                          <option value="au">Klær</option>
                          <option value="ca">Næring</option>
                          <option value="usa">Paddling</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <label className="text-md">Vekt</label>
                        <input name="query" />
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <label className="text-md">Kalorier</label>
                        <input name="query" />
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <button className="button-primary" type="submit">
                          Legg til
                        </button>
                        <button className="button-secondary" type="submit">
                          Avbryt
                        </button>
                      </div>
                    </div>
                  </li>{" "}
                </ul>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
