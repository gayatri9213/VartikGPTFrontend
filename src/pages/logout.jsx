import { useMsal } from "@azure/msal-react";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";

export default function LogoutView() {
  const { instance } = useMsal();
  const navigate = useRouter();

  const handleClick = useCallback(() => {
    instance.logoutPopup().then(() => {
      navigate("/");
    });
  }, [instance, navigate]);

  useEffect(() => {
    handleClick();
  }, [handleClick]);

  return (
    <>
      <p>Logging out...</p>
    </>
  );
}
