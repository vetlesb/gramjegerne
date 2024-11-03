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

const LISTS_QUERY = `*[
  _type == "list"
]{name, image, days, weight, participants}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const lists = await client.fetch<SanityDocument[]>(LISTS_QUERY, {}, options);
  console.log(lists);
  return (
    <main className="container mx-auto min-h-screen p-8">
      <ul className="flex gap-x-4 flex-wrap">
        {lists.map((list) => (
          <li className="product" key={list._id}>
            <div className="flex flex-col gap-y-4">
              <div className="h-80 w-80">
                <img
                  className="rounded-md h-full w-full object-cover"
                  src={urlFor(list.image).url()}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <h2 className="text-2xl font-semibold">{list.name}</h2>
                <div className="flex flex-wrap gap-x-2">
                  <p className="text-m tag w-fit items-center gap-x-1 flex flex-wrap">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.29688 14.4453C0.773438 14.4453 -0.0078125 13.6719 -0.0078125 12.1641V2.58594C-0.0078125 1.07031 0.773438 0.296875 2.29688 0.296875H13.1641C14.6875 0.296875 15.4688 1.07812 15.4688 2.58594V12.1641C15.4688 13.6641 14.6875 14.4453 13.1641 14.4453H2.29688ZM2.22656 13.4766H13.2266C14.0312 13.4766 14.5 13.0469 14.5 12.2031V5.05469C14.5 4.21094 14.0312 3.77344 13.2266 3.77344H2.22656C1.40625 3.77344 0.960938 4.21094 0.960938 5.05469V12.2031C0.960938 13.0469 1.40625 13.4766 2.22656 13.4766ZM6.17969 6.55469C5.92969 6.55469 5.86719 6.49219 5.86719 6.25V5.78906C5.86719 5.54688 5.92969 5.48438 6.17969 5.48438H6.64062C6.88281 5.48438 6.95312 5.54688 6.95312 5.78906V6.25C6.95312 6.49219 6.88281 6.55469 6.64062 6.55469H6.17969ZM8.82812 6.55469C8.58594 6.55469 8.51562 6.49219 8.51562 6.25V5.78906C8.51562 5.54688 8.58594 5.48438 8.82812 5.48438H9.28906C9.53125 5.48438 9.60156 5.54688 9.60156 5.78906V6.25C9.60156 6.49219 9.53125 6.55469 9.28906 6.55469H8.82812ZM11.4766 6.55469C11.2344 6.55469 11.1641 6.49219 11.1641 6.25V5.78906C11.1641 5.54688 11.2344 5.48438 11.4766 5.48438H11.9375C12.1797 5.48438 12.25 5.54688 12.25 5.78906V6.25C12.25 6.49219 12.1797 6.55469 11.9375 6.55469H11.4766ZM3.53125 9.15625C3.28125 9.15625 3.21875 9.10156 3.21875 8.85938V8.39844C3.21875 8.15625 3.28125 8.09375 3.53125 8.09375H3.99219C4.23438 8.09375 4.30469 8.15625 4.30469 8.39844V8.85938C4.30469 9.10156 4.23438 9.15625 3.99219 9.15625H3.53125ZM6.17969 9.15625C5.92969 9.15625 5.86719 9.10156 5.86719 8.85938V8.39844C5.86719 8.15625 5.92969 8.09375 6.17969 8.09375H6.64062C6.88281 8.09375 6.95312 8.15625 6.95312 8.39844V8.85938C6.95312 9.10156 6.88281 9.15625 6.64062 9.15625H6.17969ZM8.82812 9.15625C8.58594 9.15625 8.51562 9.10156 8.51562 8.85938V8.39844C8.51562 8.15625 8.58594 8.09375 8.82812 8.09375H9.28906C9.53125 8.09375 9.60156 8.15625 9.60156 8.39844V8.85938C9.60156 9.10156 9.53125 9.15625 9.28906 9.15625H8.82812ZM11.4766 9.15625C11.2344 9.15625 11.1641 9.10156 11.1641 8.85938V8.39844C11.1641 8.15625 11.2344 8.09375 11.4766 8.09375H11.9375C12.1797 8.09375 12.25 8.15625 12.25 8.39844V8.85938C12.25 9.10156 12.1797 9.15625 11.9375 9.15625H11.4766ZM3.53125 11.7656C3.28125 11.7656 3.21875 11.7109 3.21875 11.4688V11.0078C3.21875 10.7656 3.28125 10.7031 3.53125 10.7031H3.99219C4.23438 10.7031 4.30469 10.7656 4.30469 11.0078V11.4688C4.30469 11.7109 4.23438 11.7656 3.99219 11.7656H3.53125ZM6.17969 11.7656C5.92969 11.7656 5.86719 11.7109 5.86719 11.4688V11.0078C5.86719 10.7656 5.92969 10.7031 6.17969 10.7031H6.64062C6.88281 10.7031 6.95312 10.7656 6.95312 11.0078V11.4688C6.95312 11.7109 6.88281 11.7656 6.64062 11.7656H6.17969ZM8.82812 11.7656C8.58594 11.7656 8.51562 11.7109 8.51562 11.4688V11.0078C8.51562 10.7656 8.58594 10.7031 8.82812 10.7031H9.28906C9.53125 10.7031 9.60156 10.7656 9.60156 11.0078V11.4688C9.60156 11.7109 9.53125 11.7656 9.28906 11.7656H8.82812Z"
                        fill="#EAFFE2"
                      />
                    </svg>
                    {list.days} dager
                  </p>
                  <p className="text-m tag w-fit items-center gap-x-1 flex flex-wrap">
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
                    {list.weight} kg
                  </p>
                  <p className="text-m tag w-fit items-center gap-x-1 flex flex-wrap">
                    <svg
                      width="14"
                      height="15"
                      viewBox="0 0 14 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.00781 7.32812C5.1875 7.32812 3.72656 5.73438 3.72656 3.74219C3.72656 1.80469 5.20312 0.234375 7.00781 0.234375C8.82031 0.234375 10.2891 1.78906 10.2891 3.73438C10.2891 5.73438 8.82812 7.32812 7.00781 7.32812ZM7.00781 6.41406C8.28906 6.41406 9.32031 5.24219 9.32031 3.73438C9.32031 2.28125 8.28125 1.14844 7.00781 1.14844C5.73438 1.14844 4.69531 2.29688 4.69531 3.74219C4.69531 5.25 5.73438 6.41406 7.00781 6.41406ZM1.95312 14.4922C0.8125 14.4922 0.265625 14.125 0.265625 13.3359C0.265625 11.3047 2.82812 8.39844 7 8.39844C11.1641 8.39844 13.7266 11.3047 13.7266 13.3359C13.7266 14.125 13.1875 14.4922 12.0391 14.4922H1.95312ZM1.71094 13.5781H12.2891C12.6406 13.5781 12.7656 13.4844 12.7656 13.2422C12.7656 11.7578 10.6719 9.3125 7 9.3125C3.32031 9.3125 1.23438 11.7578 1.23438 13.2422C1.23438 13.4844 1.35156 13.5781 1.71094 13.5781Z"
                        fill="#EAFFE2"
                      />
                    </svg>

                    {list.participants}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Dialog>
          <DialogTrigger className="btn-center flex flex-wrap items-center gap-x-2 text-lg">
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
            <p id="hidden">Ny tur</p>
          </DialogTrigger>
          <DialogContent className="dialog">
            <DialogHeader className="flex flex-col gap-y-8">
              <DialogTitle className="text-2xl flex flex-col gap-y-4">
                Legg til tur
              </DialogTitle>
              <DialogDescription>
                <ul className="flex flex-col">
                  <li className="form">
                    <div className="flex flex-col gap-y-8">
                      <div className="flex flex-col gap-y-2">
                        <label className="flex text-lg">Navn</label>
                        <input className="text-lg" name="query" />
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <label className="text-lg">Bilde</label>
                        <input type="file" className="text-md" name="query" />
                      </div>

                      <div className="flex flex-col gap-y-2">
                        <label className="text-lg">Antall deltakere</label>
                        <input className="text-lg" name="query" />
                      </div>
                      <div className="flex flex-col gap-y-4">
                        <button
                          className="button-primary text-lg"
                          type="submit"
                        >
                          Legg til
                        </button>
                        <button
                          className="button-secondary text-lg"
                          type="submit"
                        >
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
