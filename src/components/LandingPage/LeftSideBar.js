// components/LeftSideBar.js
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Box, Button, Grid, Tooltip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/ExitToApp";
import { useLogout } from "../Logout/helper";
import Swal from 'sweetalert2';
import Image from "next/image";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteIconImage from "../../../public/images/delete.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function LeftSideBar({ setSelectedTab, setSelectedSessionId }) {
  const logout = useLogout();
  const [username, setUsername] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [hoveredChat, setHoveredChat] = useState(null); // Track hovered chat

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
    if (uniqueId) {
      fetchChatHistoryByUserId(uniqueId); // Initial fetch

      const intervalId = setInterval(() => {
        fetchChatHistoryByUserId(uniqueId); // Poll every 10 seconds
      }, 10000); // 10000 milliseconds = 10 seconds

      return () => {
        clearInterval(intervalId); // Clean up interval on component unmount or uniqueId change
      };
    }
  }, [uniqueId]);

  async function fetchChatHistoryByUserId(uniqueId) {
    try {
      const userResponse = await axios.get(
        `${API_BASE_URL}/User/unique/${uniqueId}`
      );
      const userId = userResponse.data.id;
      const sessionsResponse = await axios.get(
        `${API_BASE_URL}/ChatHistory/user/${userId}`
      );
      const sessions = sessionsResponse.data;
      const sessionMessagesMap = new Map();
      await Promise.all(
        sessions.map(async (session) => {
          const chatResponse = await axios.get(
            `${API_BASE_URL}/ChatHistory/session/${session.sessionId}`
          );
          const chatHistory = chatResponse.data;

          const relevantMessage =
            chatHistory
              .filter((msg) => msg.role.toLowerCase() === "user")
              .sort(
                (a, b) =>
                  new Date(b.updatedDateTime) - new Date(a.updatedDateTime)
              )[0] || {};
          if (
            !sessionMessagesMap.has(session.sessionId) ||
            new Date(relevantMessage.updatedDateTime) >
              new Date(sessionMessagesMap.get(session.sessionId).timestamp)
          ) {
            sessionMessagesMap.set(session.sessionId, {
              sessionId: session.sessionId,
              message: relevantMessage.message,
              timestamp: relevantMessage.updatedDateTime,
            });
          }
        })
      );
      const recentChats = Array.from(sessionMessagesMap.values());
      recentChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setRecentChats(recentChats);
    } catch (error) {
      console.error("Error fetching chat history by user ID:", error);
    }
  }

  const handleChatSelect = (sessionId) => {
    setSelectedSessionId(sessionId);
    setSelectedTab("Chat");
  };

  const handleNewChat = async () => {
    try {
      const userResponse = await axios.get(
        `${API_BASE_URL}/User/unique/${uniqueId}`
      );
      const userId = userResponse.data.id;
      const response = await axios.put(
        `${API_BASE_URL}/Sessions/UpdateSessionIdByUserId/${userId}`
      );
      console.log("response", response.data.sessionId);
      if (response.status === 200) {
        setSelectedSessionId(response.data.sessionId);
        setSelectedTab("Chat");
      }
    } catch (error) {
      console.error("Error updating session ID:", error);
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (sessionId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ChatHistory/session/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            accept: "text/plain",
          },
        }
      );
      if (response && response.status == 204) {
        setRecentChats((prevChats) =>
          prevChats.filter((chat) => chat.sessionId !== sessionId)
        );
      } else {
        console.error("Failed to delete chat:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleDeleteConfirmation = (sessionId) => {
    Swal.fire({
      title: 'Delete chat?',
      text: "Are you sure you want to delete this chat?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteChat(sessionId);
      }
    });
  };

  return (
    <Box
      sx={{
        p: 2,
        height: "100vh",
        backgroundColor: "#f5f5f5",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #ada5a5",
      }}
    >
      <Grid variant="h6">
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
            width={163}
            height={59}
            alt="Aress logo"
          />
        </Box>
      </Grid>

      <Button variant="contained" sx={{ my: 2 }} onClick={handleNewChat}>
        New Chat
      </Button>

      <Grid sx={{ fontSize: "1rem", fontWeight: "600", my: 2, padding: "0px" }}>
        Recent
      </Grid>

      {/* Show only 5 recent chats by default */}
      {recentChats.slice(0, showAll ? recentChats.length : 5).map((chat) => (
        <Box
          key={chat.sessionId}
          sx={{
            padding: "1px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            "&:hover .delete-icon": { display: "block" }, // Show delete icon on hover
            mb: 1,
          }}
          onMouseEnter={() => setHoveredChat(chat.sessionId)} // Track which chat is hovered
          onMouseLeave={() => setHoveredChat(null)} // Reset hover state
        >
          <Box
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => handleChatSelect(chat.sessionId)}
          >
            <ChatBubbleOutlineIcon fontSize="small" sx={{ mr: 1, height:"18px",width:"18px",position:"relative",top:"2px"}} />

            {/* Display full message when not hovered, shortened message when hovered */}
            {hoveredChat === chat.sessionId
              ? chat.message
                ? chat.message.substring(0, 15) + "..."
                : "New Chat"
              : chat.message
              ? chat.message.substring(0, 20) + "..."
              : "New Chat"}
          </Box>

          <Image
            src={DeleteIconImage}
            alt="Delete Icon"
            width={18} 
            height={18}  
            style={{
              display: hoveredChat === chat.sessionId ? 'block' : 'none',
              cursor: 'pointer',
            }}
            onClick={() => handleDeleteConfirmation(chat.sessionId)}
          />
        </Box>
      ))}

      {/* Show "Show more" link if there are more than 5 chats */}
      {recentChats.length > 5 && (
        <Button onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? "Show less" : "Show more"}
        </Button>
      )}

      <Grid
        mt="auto"
        container
        spacing={0.1}
        rowSpacing={0.05}
        sx={{ marginBottom: "-10px", position: "relative" ,padding:"0px"}}
      >
        <Component className="css-73imaa" sx={{padding: "0px !important" }} icon={<PersonIcon />} label={username}  />
        <Component className="css-pc7201" sx={{padding:"0px !important"}}
          icon={<SettingsIcon />}
          label={"Settings"}
          onClick={() => setSelectedTab("Settings")}
        />
        <Component className="css-pc7201" sx={{padding:"0px !important"}} icon={<LogoutIcon />} label={"Logout"} onClick={logout} />
      </Grid>
    </Box>
  );
}

const Component = ({ icon, label, onClick, role }) => {
  return (
    <>
      <Grid
        container
        px={2}
        py={1}
        mb="1rem"
        columnGap={"1.0rem"}
        sx={{
          "&:Hover": { bgcolor: "lightgray" },
          borderRadius: "5px",
          maxWidth: "16rem",
          cursor: onClick ? "pointer" : "default",
        }}
        alignItems={"center"}
        onClick={onClick}
      >
        {icon && <Grid item>{icon}</Grid>}
        <Tooltip followCursor>
          <Grid
            item
            sx={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Grid>
        </Tooltip>
      </Grid>
    </>
  );
};
