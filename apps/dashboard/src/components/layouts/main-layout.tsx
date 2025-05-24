import type { PropsWithChildren } from "react";

import { SignedIn } from "@clerk/clerk-react";

import { CreateBookmarkModal } from "../bookmarks/create-bookmark-modal.tsx";
import { UpdateBookmarkModal } from "../bookmarks/update-bookmark-modal.tsx";
import { Footer } from "../footer.tsx";
import { Navigation } from "../navigation.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <Navigation />
      <SignedIn>
        <main className="px-4 max-w-5xl mx-auto">{children}</main>
        <Footer />
        <CreateBookmarkModal />
        <UpdateBookmarkModal />
      </SignedIn>
    </>
  );
};
