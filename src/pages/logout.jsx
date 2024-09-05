import { useMsal } from "@azure/msal-react";
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutView() {
  const { instance } = useMsal();
  const navigate = useNavigate();

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
