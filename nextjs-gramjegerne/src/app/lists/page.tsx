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
      <ul className="flex flex-col">
        {lists.map((list) => (
          <li className="product" key={list._id}>
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex flex-wrap gap-x-4">
                <div className="h-24 w-24">
                  {list.image ? (
                    <img
                      className="rounded-md h-full w-full object-cover"
                      src={urlFor(list.image).url()}
                    />
                  ) : (
                    <div className="h24 w-24 flex items-center placeholder_image">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 29 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.85938 23.4961C1.32812 23.4961 0.015625 22.1836 0.015625 19.6875V7.39453C0.015625 4.89844 1.32812 3.58594 3.85938 3.58594H7.01172C7.92578 3.58594 8.23047 3.42188 8.78125 2.83594L9.71875 1.82812C10.3281 1.19531 10.9375 0.867188 12.1328 0.867188H16.7969C17.9922 0.867188 18.6016 1.19531 19.2109 1.82812L20.1484 2.83594C20.7109 3.43359 21.0039 3.58594 21.918 3.58594H25.1289C27.6602 3.58594 28.9727 4.89844 28.9727 7.39453V19.6875C28.9727 22.1836 27.6602 23.4961 25.1289 23.4961H3.85938ZM4 21.1992H25C26.0781 21.1992 26.6758 20.625 26.6758 19.4883V7.59375C26.6758 6.45703 26.0781 5.88281 25 5.88281H21.25C20.207 5.88281 19.6562 5.69531 19.0703 5.05078L18.168 4.05469C17.5117 3.35156 17.1602 3.16406 16.1289 3.16406H12.8008C11.7695 3.16406 11.418 3.35156 10.7617 4.06641L9.85938 5.05078C9.27344 5.70703 8.72266 5.88281 7.67969 5.88281H4C2.92188 5.88281 2.3125 6.45703 2.3125 7.59375V19.4883C2.3125 20.625 2.92188 21.1992 4 21.1992ZM14.5 19.6406C10.9844 19.6406 8.17188 16.8281 8.17188 13.3008C8.17188 9.77344 10.9844 6.94922 14.5 6.94922C18.0156 6.94922 20.8281 9.77344 20.8281 13.3008C20.8281 16.8281 18.0039 19.6406 14.5 19.6406ZM21.2266 9.08203C21.2266 8.27344 21.9297 7.57031 22.7617 7.57031C23.5703 7.57031 24.2734 8.27344 24.2734 9.08203C24.2734 9.92578 23.5703 10.5938 22.7617 10.5938C21.918 10.5938 21.2266 9.9375 21.2266 9.08203ZM14.5 17.543C16.8438 17.543 18.7422 15.6562 18.7422 13.3008C18.7422 10.9336 16.8438 9.04688 14.5 9.04688C12.1562 9.04688 10.2578 10.9336 10.2578 13.3008C10.2578 15.6562 12.1562 17.543 14.5 17.543Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-y-2">
                  <h2 className="text-xl font-semibold truncate">
                    {list.name}
                  </h2>
                  <div className="flex flex-wrap gap-x-2">
                    {list.weight ? (
                      <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
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
                        {list.weight}
                      </p>
                    ) : null}
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      <svg
                        className="tag-icon"
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
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      <svg
                        className="tag-icon"
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
              <div className="flex gap-x-1">
                <button
                  className="button-ghost flex gap-x-2 items-center"
                  type="submit"
                >
                  <svg
                    className="tag-icon"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.74805 14.5391C2.61133 14.5391 1.68555 13.6133 1.68555 12.4766C1.68555 11.3281 2.61133 10.4141 3.74805 10.4141C4.89648 10.4141 5.82227 11.3281 5.82227 12.4766C5.82227 13.6133 4.89648 14.5391 3.74805 14.5391ZM12.1035 14.5391C10.9551 14.5391 10.0293 13.6133 10.0293 12.4766C10.0293 11.3281 10.9551 10.4141 12.1035 10.4141C13.2402 10.4141 14.166 11.3281 14.166 12.4766C14.166 13.6133 13.2402 14.5391 12.1035 14.5391ZM20.4473 14.5391C19.2988 14.5391 18.3848 13.6133 18.3848 12.4766C18.3848 11.3281 19.2988 10.4141 20.4473 10.4141C21.584 10.4141 22.5098 11.3281 22.5098 12.4766C22.5098 13.6133 21.584 14.5391 20.4473 14.5391Z"
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
