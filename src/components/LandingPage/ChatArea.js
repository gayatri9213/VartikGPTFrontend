import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_CHAT_URL =
  process.env.NODE_ENV === "development"
    ? "http://vartikgpt.eastus.azurecontainer.io:80/v1/vartikgpt/chat"
    : process.env.REACT_APP_API_CHAT_URL;

const userIcon = "/images/user (1).png";
const assistantIcon = "/images/bot (1).png";

export default function ChatArea({ selectedSessionId, setSelectedSessionId }) {
  const [username, setUsername] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cachingEnabled, setCachingEnabled] = useState(null);
  const [routingEnabled, setRoutingEnabled] = useState(null);

  useEffect(() => {
    const storedResponse = localStorage.getItem("azureAccount");
    if (storedResponse) {
      const response = JSON.parse(storedResponse);
      const account = response.account;
      if (account) {
        setUsername(account.name);
      }
      if (response) {
        setUniqueId(response.uniqueId);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchChatHistory(selectedSessionId);
      fetchSettingsFromDB(selectedSessionId);
    } else {
      const localStorageData =
        JSON.parse(localStorage.getItem("formData")) || {};
      const cachingEnabled = localStorageData.cacheEnabled?.toString();
      const routingEnabled = localStorageData.routingEnabled?.toString();
      setCachingEnabled(cachingEnabled);
      setRoutingEnabled(routingEnabled);
      setMessages([]);
    }
  }, [selectedSessionId]);

  const fetchChatHistory = async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ChatHistory/session/${sessionId}`
      );
      const chatHistory = response.data;
      setMessages(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const fetchSettingsFromDB = async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ChatHistory/session/${sessionId}`
      );
      const settingsArray = response.data;
      const sortedSettings = settingsArray.sort(
        (a, b) => new Date(b.updatedDateTime) - new Date(a.updatedDateTime)
      );
      const latestSettings = sortedSettings[0];
      const { cachingEnabled, routingEnabled } = latestSettings;
      setCachingEnabled(cachingEnabled);
      setRoutingEnabled(routingEnabled);
    } catch (error) {
      const localStorageData =
        JSON.parse(localStorage.getItem("formData")) || {};
      const cachingEnabled = localStorageData.cacheEnabled?.toString();
      const routingEnabled = localStorageData.routingEnabled?.toString();
      setCachingEnabled(cachingEnabled);
      setRoutingEnabled(routingEnabled);
    }
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setLoading(true);
    const newMessage = message.trim();

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "User", message: newMessage },
    ]);

    try {
      const userResponse = await axios.get(
        `${API_BASE_URL}/User/unique/${uniqueId}`
      );
      const userId = userResponse.data.id;
      const localStorageData =
        JSON.parse(localStorage.getItem("formData")) || {};

      // Check if a valid sessionId is available
      if (!selectedSessionId) {
        try {
          const userResponse = await axios.get(
            `${API_BASE_URL}/User/unique/${uniqueId}`
          );
          const userId = userResponse.data.id;
          const response = await axios.put(
            `${API_BASE_URL}/Sessions/UpdateSessionIdByUserId/${userId}`
          );
          console.log("response", response.data.sessionId);
          selectedSessionId = response.data.sessionId;
          if (response.status === 200) {
            setSelectedSessionId(selectedSessionId);
          }
        } catch (error) {
          console.error("Error updating session ID:", error);
        }
      }
      // Save the message to the server
      const a= await axios.post(`${API_BASE_URL}/ChatHistory`, {
        userId: userId,
        sessionId: selectedSessionId,
        role: "User",
        message: newMessage,
        updatedDateTime: new Date(),
        cachingEnabled: cachingEnabled,
        routingEnabled: routingEnabled,
      });
      console.log("a",a)
      // Create request body with fixed indexwise order
      const requestBody = {
        user_id: userId.toString(),
        user_sessionid: selectedSessionId,
        department: localStorageData.departmentName,
        user_query: newMessage,
        embedding_mode: localStorageData.embLLMVendor,
        embedding_model: localStorageData.embLLMModel,
        vector_store: localStorageData.vectorStore,
        index_name: localStorageData.vectorIndex,
        llm_type: localStorageData.llmVendor,
        llm_model: localStorageData.llmModel,
        llm_deployment:localStorageData.llmModel,
        vartikgpt_temp: parseFloat(localStorageData.temp).toFixed(1),
        max_tokens: localStorageData.maxTokens,
        caching_enabled: cachingEnabled,
        routing_enabled: routingEnabled,
      };
      console.log("requestBody :", requestBody);
      const response = await fetch(`${API_CHAT_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify(requestBody),
      });
      console.log("response",response)
      if (response.ok) {
        if (
          response.headers.get("Content-Type")?.includes("application/json")
        ) {
          const jsonData = await response.json();
          console.log("Parsed JSON Data:", jsonData);

          const json = JSON.parse(jsonData);
          console.log("json", json);

          if (json && json.message) {
            const message = json.message;
            console.log("Message:", message);
            const assistantResponse = message || `No data in indexes`;

            setMessages((prevMessages) => [
              ...prevMessages,
              { role: "assistant", message: assistantResponse },
            ]);

            await axios.post(`${API_BASE_URL}/ChatHistory`, {
              userId: userId,
              sessionId: selectedSessionId,
              role: "assistant",
              message: assistantResponse,
              updatedDateTime: new Date(),
              cachingEnabled: cachingEnabled,
              routingEnabled: routingEnabled,
            });
          } else {
            console.error(
              "Message key is undefined or not found in JSON data."
            );
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                role: "assistant",
                message: `Error: No message found in response`,
              },
            ]);
          }
        } else {
          console.error("Response is not in JSON format.");
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: "assistant", message: `Error: Invalid response format` },
          ]);
        }
      } else if (response.status === 500) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            message: `Server Error: ${response.statusText},Please contact Admin`,
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", message: `Error: ${response.statusText}` },
        ]);
      }
      // If this is a new session, update the selectedSessionId
      if (!selectedSessionId) {
        setSelectedSessionId(data.session_id);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", message: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  // Function to format messages with newlines
  const formatMessage = (msg) => {
    return msg.split("\n").map((line, index) => (
      <div key={index} style={{ marginTop: "7px" }}>
        {line}
      </div>
    ));
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "space-between",
        p: 2,
        paddingBottom: 5,
      }}
    >
      {/* Header */}
      <Box sx={{ padding: 2, textAlign: "left" }}>
        <Typography variant="h6" sx={{ fontSize: "1.5rem" }}>
          Hello{" "}
          <span style={{ fontWeight: "500", color: "#1976d2" }}>
            {username}
          </span>
        </Typography>
        <Typography variant="h6">How can I help you today?</Typography>
      </Box>

      {/* Chat Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          padding: 2,
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        {messages.map((msg, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  mr: 1,
                  width: 35,
                  height: 35,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                <img
                  src={msg.role === "User" ? userIcon : assistantIcon}
                  alt={`${msg.role} icon`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </Box>
              <Box
                sx={{
                  bgcolor: "#ffffff",
                  color: "black",
                  p: 1.5,
                  //borderRadius: "15px 15px 15px 15px",
                  maxWidth: "70%",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: "1",
                  //boxShadow: 1,
                }}
              >
                <Typography variant="body2">
                  {/* {msg.message} */}

                  {formatMessage(msg.message)}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Input Field and Button (Sticky) */}
      <Box
        sx={{
          padding: 2,
          display: "flex",
          alignItems: "center",
          position: "sticky",
          bottom: 0,
          backgroundColor: "#fff",
          zIndex: 1,
        }}
      >
        <TextField
          sx={{
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-root": {
              height: "2.5rem",
              borderRadius: "5px",
              fontSize: "0.875rem",
              fontWeight: "light",
            },
          }}
          fullWidth
          variant="outlined"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type your message here..."
        />
        <LoadingButton
          type="submit"
          variant="contained"
          color="primary"
          style={{ marginLeft: "8px", position: "relative", height: "2.4rem" }}
          onClick={handleSubmit}
          loading={loading}
        >
          SEND
        </LoadingButton>
      </Box>
    </Box>
  );
}