"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const Wrapper = (props: P) => {
    const { user, session } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!session) {
        router.replace("/auth/login");
      }
    }, [session, router]);

    if (!session) {
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;
