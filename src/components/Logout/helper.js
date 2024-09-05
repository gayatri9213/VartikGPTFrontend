import { useMsal } from "@azure/msal-react";
import { useCallback } from "react";
import { useRouter } from "next/router";

export function useLogout() {
  const { instance } = useMsal();
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("formData");
    instance.logoutPopup().then(() => {
      router.push("/");
    });
  }, [instance, router]);

  return logout;
}
