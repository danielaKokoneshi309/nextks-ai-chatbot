import * as React from "react";
import Link from "next/link";
import { IconSeparator } from "@/components/ui/icons";
import EnvCard from "./cards/envcard";

export async function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-white ">
      <EnvCard />
      <Link href="/" rel="nofollow" className="mr-2 font-bold">
        GermanLegalGPT
      </Link>
    </header>
  );
}
