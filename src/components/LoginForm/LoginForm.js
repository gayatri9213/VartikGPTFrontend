import axios from "axios";
import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Grid,
  Link,
  IconButton,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import { SiMicrosoftazure } from "react-icons/si";
import Image from "next/image";
import { loginRequest } from "../LoginForm/msalConfig";
import { useRouter } from "next/router";

export default function LoginForm() {
  const { instance } = useMsal();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: 0,
    name: "",
    uniqueAzureId: "",
    departmentId: "",
    departmentName: "",
    sessionId: "",
    llmVendor: "",
    llmModel: "",
    embLLMVendor: "",
    embLLMModel: "",
    chunkingType: "",
    cacheEnabled: false,
    routingEnabled: false,
    temp: parseFloat(0.0).toFixed(1),
    maxTokens: 0,
    vectorStore: "",
    vectorIndex: "",
  });

  const API_BASE_URL = "https://vartikgptbackend.azurewebsites.net/api";

  const getUser = async (uniqueAzureId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/User/unique/${uniqueAzureId}`
      );
      console.log("user response", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  const getSession = async (userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Sessions/GetSessionByUserId/${userId}`
      );
      console.log("session response", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching session data:", error);
      return null;
    }
  };

  const handleClick = async () => {
    // Marked the function as async
    setLoading(true);
    try {
      const response = await instance.loginPopup(loginRequest);
      localStorage.setItem("azureAccount", JSON.stringify(response));

      const uniqueAzureId = response.uniqueId;
      console.log("user uniqueAzureId", uniqueAzureId);
      const userData = await getUser(uniqueAzureId);
      if (userData) {
        // Fetch Department Name
        const fetchDepartmentName = await axios.get(
          `${API_BASE_URL}/Department/${userData.departmentId}`
        );

        const sessionData = await getSession(userData.id);
        console.log("user data", userData);
        if (sessionData) {
          // Set form data with fetched data
          setFormData((prevState) => {
            const updatedFormData = {
              ...prevState,
              userId: userData.id || 0,
              name: userData.name || "",
              uniqueAzureId: userData.uniqueAzureId || "",
              departmentId: userData.departmentId || "",
              departmentName: fetchDepartmentName.data.name || "",
              sessionId: sessionData?.sessionId || "",
              llmVendor: sessionData?.llmVendor || "",
              llmModel: sessionData?.llmModel || "",
              embLLMVendor: sessionData?.embLLMVendor || "",
              embLLMModel: sessionData?.embLLMModel || "",
              chunkingType: sessionData?.chunkingType || "",
              cacheEnabled: sessionData?.cacheEnabled || false,
              routingEnabled: sessionData?.routingEnabled || false,
              temp: parseFloat(sessionData?.temp || 0.0).toFixed(1),
              maxTokens: sessionData?.maxTokens || 0,
              vectorStore: sessionData?.vectorStore || "",
              vectorIndex: sessionData?.vectorIndex || "",
            };
            console.log("Updated Form Data:", updatedFormData);
            return updatedFormData;
          });
        }
      }

      router.push("/homepage");
    } catch (e) {
      console.error(e);
      alert("Login failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Store formData in localStorage whenever it updates
  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [formData]);
  return (
    <Box
      sx={{ bgcolor: "background.paper", p: 4, borderRadius: 2, boxShadow: 3 }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 2,
          objectFit: "cover",
        }}
      >
        <Image
          src="/images/aress-logo.png"
          width={100}
          height={50}
          alt="Aress logo"
        />
      </Box>
      <Grid variant="h5" align="center">
        Welcome to VartikGPT! 👋
      </Grid>
      <Grid variant="body2" align="center" sx={{ mb: 3 }}>
        Please sign-in to your account and start the adventure
      </Grid>
      <TextField fullWidth label="Email" margin="normal" />
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? "text" : "password"}
        margin="normal"
        InputProps={{
          endAdornment: (
            <Button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </Button>
          ),
        }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          my: 2,
        }}
      >
        <FormControlLabel control={<Checkbox />} label="Remember me" />
        <Link href="#" variant="body2">
          Forgot password?
        </Link>
      </Box>
      <Button fullWidth variant="contained" color="primary" size="large">
        Log In
      </Button>
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Grid variant="body2">
          New on our platform? <Link href="#">Create an account</Link>
        </Grid>
      </Box>
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Grid variant="body2">or</Grid>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <IconButton component={Link} href="https://github.com" target="_blank">
          <GitHubIcon style={{ color: "#000" }} />
        </IconButton>
        <IconButton component={Link} href="https://google.com" target="_blank">
          <GoogleIcon style={{ color: "#DB4437" }} />
        </IconButton>

        <IconButton
          component={Link}
          onClick={handleClick}
          target="_blank"
          sx={{ borderColor: "gray" }}
        >
          <SiMicrosoftazure style={{ color: "#0078D4" }} />
        </IconButton>
      </Box>
    </Box>
  );
}
