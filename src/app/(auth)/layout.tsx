import Image from "next/image";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex size-6 items-center justify-center rounded-md">
              <span className="text-xs font-bold">O</span>
            </div>
            OneFlow
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          width={200}
          height={400}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default AuthLayout;
