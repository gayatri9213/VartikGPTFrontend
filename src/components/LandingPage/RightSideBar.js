import axios from "axios";
import {
  Button,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Slider,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import TuneIcon from "@mui/icons-material/Tune";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const selectSx = { fontSize: "14px", height: "2rem" };
const menuItemSx = { fontSize: "14px", fontWeight: "300" };

const API_BASE_URL = "https://vartikgptbackend.azurewebsites.net/api";
const VECTOR_STORE_API_BASE_URL = "http://dataingestion.eastus.azurecontainer.io:8011/v1/index";

export default function RightSideBar({
  openRightSideBar,
  setOpenRightSideBar,
}) {
  const [llmVendors, setLlmVendors] = useState([]);
  const [llmModels, setLlmModels] = useState({});
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [temperatureValue, setTemperatureValue] = useState(0);
  const [maxTokens, setMaxTokens] = useState(0);
  const [selectedVectorStore, setSelectedVectorStore] = useState("");
  const [vectorIndexes, setVectorIndexes] = useState([]);
  const [selectedVectorIndex, setSelectedVectorIndex] = useState("");

  const saveFormDataToLocalStorage = (data) => {
    const formattedData = {
      ...data,
      temp: parseFloat(data.temp).toFixed(1),
      maxTokens: parseInt(data.maxTokens, 10),
    };
    localStorage.setItem("formData", JSON.stringify(formattedData));
  };

  // Fetch vector store data from the backend
  const fetchVectorStoreData = async (vectorStore, departmentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/VectorStore/GetByTypeAndDepartmentId?type=${vectorStore}&departmentId=${departmentId}`
      );
      console.log("vector store data:", response.data);
      return response.data;
    } catch (error) {
      toast.error(`Error fetching vector store data for ${vectorStore}`);
      //  console.error("Error fetching vector store data:", error);
      return [];
    }
  };

  const handleSliderChange = (value, type) => {
    if (type === "temperature") {
      const temperatureValue = parseFloat(value).toFixed(1);
      setTemperatureValue(temperatureValue);
      saveFormDataToLocalStorage({
        ...JSON.parse(localStorage.getItem("formData") || "{}"),
        temp: temperatureValue,
      });
    } else if (type === "max tokens") {
      const maxTokensValue = parseInt(value, 10);
      setMaxTokens(maxTokensValue);
      saveFormDataToLocalStorage({
        ...JSON.parse(localStorage.getItem("formData") || "{}"),
        maxTokens: maxTokensValue,
      });
    }
  };

  const fetchIndexes = async (vectorStore) => {
    switch (vectorStore) {
      case "Pinecone":
        return await fetchPineconeIndexes();
      case "Qdrant":
        return await fetchQdrantIndexes();
      case "AzureOpenAI":
        return await fetchAzureAISearchIndexes();
      default:
        return [];
    }
  };

  const handleVectorStoreChange = async (event) => {
    const value = event.target.value;
    setSelectedVectorStore(value);
    const indexes = await fetchIndexes(value);
    console.log("indexes", indexes);
    saveFormDataToLocalStorage({
      ...JSON.parse(localStorage.getItem("formData") || "{}"),
      vectorStore: value,
    });

    const departmentId = JSON.parse(
      localStorage.getItem("formData") || "{}"
    ).departmentId;
    if (departmentId) {
      try {
        const vectorStoreData = await fetchVectorStoreData(value, departmentId);
        if (vectorStoreData && Array.isArray(vectorStoreData)) {
          // Filter the vectorStoreData to find matches with indexes
          const matchedIndexes = vectorStoreData
            .filter((item) => indexes.includes(item.vectorIndex))
            .map((item) => item.vectorIndex);
          console.log(matchedIndexes);
          if (matchedIndexes.length > 0) {
            console.log("Matched indexes found:", matchedIndexes);
            // Display the matched vectorStoreData values as needed
            setVectorIndexes(matchedIndexes);
          } else {
            console.log("No matching indexes found.");
            setVectorIndexes([]);
          }
        } else {
          toast.error(`No data found for vector store ${value}`);
          setVectorIndexes([]);
        }
        //   if(vectorStoreData){
        //      // Check if the vectorIndex in vectorStoreData is in the indexes array
        //   const isIndexMatched = indexes.includes(vectorStoreData.vectorIndex);
        //   console.log("isIndexMatched",isIndexMatched)
        //   if (isIndexMatched) {
        //     console.log("Matched index found:", vectorStoreData.vectorIndex);
        //     // Display the vectorStoreData values as needed
        //     setVectorIndexes([vectorStoreData.vectorIndex]);
        //   } else {
        //     console.log("No matching index found.");
        //     setVectorIndexes([]);
        //   }

        // } else {
        //     toast.error(`No data found for vector store ${value}`);
        //     setVectorIndexes([]);
        //   }
      } catch (error) {
        toast.error(`Error fetching vector store data for ${value}`);
        console.error(`Error fetching vector store data for ${value}:`, error);
        setVectorIndexes([]);
      }
    } else {
      toast.error("Department ID is not available in local storage");
      setVectorIndexes([]);
    }
  };

  const handleVectorIndexChange = (event) => {
    const value = event.target.value;
    setSelectedVectorIndex(value);
    saveFormDataToLocalStorage({
      ...JSON.parse(localStorage.getItem("formData") || "{}"),
      vectorIndex: value,
    });
  };

  const fetchPineconeIndexes = async () => {
    try {
      const response = await axios.post(
        `${VECTOR_STORE_API_BASE_URL}/pinecone/listindexes`
      );
      const parsedData = JSON.parse(response.data);
      return parsedData.message.map((item) => item.name);
    } catch (error) {
      toast.error("Error fetching Pinecone indexes");
      console.error("Error fetching Pinecone indexes:", error);
      setVectorIndexes([]);
    }
  };

  const fetchQdrantIndexes = async () => {
    try {
      const response = await axios.post(
        `${VECTOR_STORE_API_BASE_URL}/qdrant/listcollection`
      );
      const parsedData = JSON.parse(response.data);
      return parsedData.message.map((item) => item.name);
    } catch (error) {
      toast.error("Error fetching Qdrant indexes");
      console.error("Error fetching Qdrant indexes:", error);
      setVectorIndexes([]);
    }
  };

  const fetchAzureAISearchIndexes = async () => {
    try {
      const response = await axios.post(
        `${VECTOR_STORE_API_BASE_URL}/azuresearch/listindexes`
      );
      return response.data;
    } catch (error) {
      toast.error("Error fetching Azure AI Search indexes");
      console.error("Error fetching Azure AI Search indexes:", error);
      setVectorIndexes([]);
    }
  };

  const getLLMRefData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/LLMRef`, {
        headers: {
          Accept: "text/plain",
        },
      });
      return { data: response.data, error: null };
    } catch (error) {
      toast.error("Error fetching LLM Ref data");
      console.error("Error fetching LLM Ref data:", error);
      return { data: null, error: error.message };
    }
  };

  useEffect(() => {
    const fetchLLMData = async () => {
      const { data, error } = await getLLMRefData();
      if (data) {
        const groupedByType = data.reduce((acc, item) => {
          if (!acc[item.type]) {
            acc[item.type] = [];
          }
          acc[item.type].push(item.name);
          return acc;
        }, {});

        setLlmVendors(Object.keys(groupedByType));
        setLlmModels(groupedByType);
      } else {
        console.error("Error fetching LLM data:", error);
      }
    };

    fetchLLMData();

    // Initialize state from localStorage
    const savedFormData = JSON.parse(localStorage.getItem("formData")) || {};
    setSelectedVendor(savedFormData.llmVendor || "");
    setSelectedModel(savedFormData.llmModel || "");
    setTemperatureValue(
      parseFloat(savedFormData.temp).toFixed(1) || parseFloat(0.0).toFixed(1)
    );
    setMaxTokens(parseInt(savedFormData.maxTokens) || parseInt(0));
    setSelectedVectorStore(savedFormData.vectorStore || "");
    setSelectedVectorIndex(savedFormData.vectorIndex || "");
  }, []);

  const handleVendorChange = (event) => {
    const newVendor = event.target.value;
    setSelectedVendor(newVendor);
    setSelectedModel("");
    saveFormDataToLocalStorage({
      ...JSON.parse(localStorage.getItem("formData") || "{}"),
      llmVendor: newVendor,
    });
  };

  const handleModelChange = (event) => {
    const newModel = event.target.value;
    setSelectedModel(newModel);
    saveFormDataToLocalStorage({
      ...JSON.parse(localStorage.getItem("formData") || "{}"),
      llmModel: newModel,
    });
  };

  const handleSaveSettings = async () => {
    let formData = JSON.parse(localStorage.getItem("formData")) || {};
    formData = {
      ...formData,
      temp: parseFloat(temperatureValue).toFixed(1),
      llmVendor: selectedVendor,
      llmModel: selectedModel,
      maxTokens: maxTokens,
      vectorStore: selectedVectorStore,
      vectorIndex: selectedVectorIndex,
    };
    console.log("formData :", formData);
    localStorage.setItem("formData", JSON.stringify(formData));

    try {
      // const userResponse = await axios.get(
      //   `${API_BASE_URL}/User/unique/${formData.UniqueAzureId}`
      // );
      const userId = formData.userId;
      if (!userId) {
        console.error("User ID not found in local storage.");
        return;
      }
      await axios.put(
        `${API_BASE_URL}/Sessions/UpdateSessionByUserIdForParameters/${userId}`,
        {
          llmVendor: selectedVendor,
          llmModel: selectedModel,
          temp: temperatureValue,
          maxTokens: maxTokens,
          vectorStore: selectedVectorStore,
          vectorIndex: selectedVectorIndex,
        }
      );
      toast.success("Settings saved successfully.");
    } catch (error) {
      toast.error("Error saving settings:", error);
    }
  };

  return (
    <>
      <ToastContainer />
      {openRightSideBar ? (
        <Drawer
          sx={{
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 300,
              border: "none",
              p: "1rem 2rem",
              boxSizing: "border-box",
              fontSize: "0.75rem",
              borderLeft: "1px solid #ada5a5",
            },
          }}
          variant="permanent"
          anchor="right"
        >
          <Grid
            container
            justifyContent={"space-between"}
            alignItems={"center"}
            mb={2}
          >
            <Grid item sx={{ fontSize: "1.25rem", fontWeight: "500" }}>
              Parameters
            </Grid>
            <Tooltip title="Close">
              <IconButton
                onClick={() => setOpenRightSideBar(false)}
                sx={{ color: "#2b2b2b" }}
              >
                <VerticalSplitOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid container flexDirection={"column"} gap={3}>
            <Grid item>
              <Tooltip
                title="Select appropriate LLM Vendor"
                arrow
                placement="left"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "#F7F7F8",
                      color: "black",
                      fontSize: "0.775rem",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      maxWidth: "260px", // Adjust the maxWidth as needed
                      textAlign: "left", // Center the text
                      padding: 1,
                      outline: "2px solid transparent",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#F7F7F8",
                    },
                  },
                }}
              >
                <Grid
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: "light",
                    mb: "0.5rem",
                  }}
                >
                  LLM Vendor
                </Grid>
              </Tooltip>
              <Select
                fullWidth
                sx={selectSx}
                value={selectedVendor}
                onChange={handleVendorChange}
                IconComponent={KeyboardArrowDownOutlinedIcon}
              >
                {Array.isArray(llmVendors) &&
                  llmVendors.map((vendor) => (
                    <MenuItem key={vendor} sx={menuItemSx} value={vendor}>
                      {vendor}
                    </MenuItem>
                  ))}
              </Select>
            </Grid>

            <Grid item>
              <Tooltip
                title="Select an LLM Model based on the chosen vendor"
                arrow
                placement="left"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "#F7F7F8",
                      color: "black",
                      fontSize: "0.775rem",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      maxWidth: "260px", // Adjust the maxWidth as needed
                      textAlign: "left", // Center the text
                      padding: 1,
                      outline: "2px solid transparent",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#F7F7F8",
                    },
                  },
                }}
              >
                <Grid
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: "light",
                    mb: "0.5rem",
                  }}
                >
                  LLM Model
                </Grid>
              </Tooltip>
              <Select
                sx={selectSx}
                fullWidth
                value={selectedModel}
                onChange={handleModelChange}
                IconComponent={KeyboardArrowDownOutlinedIcon}
                disabled={!selectedVendor}
              >
                {llmModels[selectedVendor] &&
                  llmModels[selectedVendor].map((model) => (
                    <MenuItem key={model} sx={menuItemSx} value={model}>
                      {model}
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
            <Grid item>
              <SliderComponent
                value={temperatureValue}
                heading={"Temperature"}
                min={0.0}
                max={1.0}
                step={0.1}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item>
              <SliderComponent
                value={maxTokens}
                heading={"Max Tokens"}
                min={0}
                max={8192}
                step={50}
                onChange={handleSliderChange}
              />
            </Grid>
            <Grid item>
              <Tooltip
                title="Select the vector store for data storage."
                arrow
                placement="left"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "#F7F7F8",
                      color: "black",
                      fontSize: "0.775rem",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      maxWidth: "260px", // Adjust the maxWidth as needed
                      textAlign: "left", // Center the text
                      padding: 1,
                      outline: "2px solid transparent",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#F7F7F8",
                    },
                  },
                }}
              >
                <Grid
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: "light",
                    mb: "0.5rem",
                  }}
                >
                  Vector Store
                </Grid>
              </Tooltip>
              <Select
                sx={selectSx}
                fullWidth
                value={selectedVectorStore}
                onChange={handleVectorStoreChange}
                IconComponent={KeyboardArrowDownOutlinedIcon}
                // disabled={vectorStoreDisabled}
              >
                {["Pinecone", "Qdrant", "AzureOpenAI"].map((store) => (
                  <MenuItem key={store} value={store} sx={menuItemSx}>
                    {store}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid item>
              <Tooltip
                title="Select the vector index based on the chosen vector store"
                arrow
                placement="left"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "#F7F7F8",
                      color: "black",
                      fontSize: "0.775rem",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      maxWidth: "260px", // Adjust the maxWidth as needed
                      textAlign: "left", // Center the text
                      padding: 1,
                      outline: "2px solid transparent",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "#F7F7F8",
                    },
                  },
                }}
              >
                <Grid
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: "light",
                    mb: "0.5rem",
                  }}
                >
                  Vector Index
                </Grid>
              </Tooltip>
              <Select
                sx={selectSx}
                fullWidth
                value={selectedVectorIndex}
                onChange={handleVectorIndexChange}
                IconComponent={KeyboardArrowDownOutlinedIcon}
                // disabled={vectorIndexDisabled}
              >
                {vectorIndexes &&
                  Array.isArray(vectorIndexes) &&
                  vectorIndexes.map((index) => (
                    <MenuItem key={index} value={index} sx={menuItemSx}>
                      {index}
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
            <Grid item> </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                sx={{ marginLeft: "40px" }}
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </Grid>
          </Grid>
        </Drawer>
      ) : (
        <Drawer
          sx={{
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 60,
              border: "none",
              boxSizing: "border-box",
              borderLeft: "1px solid #ada5a5",
            },
          }}
          variant="permanent"
          anchor="right"
        >
          <Grid container sx={{ p: 1.5 }} alignItems={"center"}>
            <Tooltip title="Open">
              <IconButton
                onClick={() => setOpenRightSideBar(true)}
                sx={{ color: "#2b2b2b" }}
              >
                <TuneIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Drawer>
      )}
    </>
  );
}

const SliderComponent = ({ value, heading, max, min, step, onChange }) => {
  const getTooltipText = (heading) => {
    switch (heading) {
      case "Temperature":
        return "Controls randomness: lowering results in less random completions.";
      case "Max Tokens":
        return "The maximum number of tokens to generate. Requests can use up to 8192 tokens shared between prompt and completion.";
      default:
        return `Adjust the ${heading}`;
    }
  };
  return (
    <>
      <Grid container justifyContent={"space-between"} alignItems={"center"}>
        <Grid sx={{ fontSize: "0.875rem", fontWeight: "light" }}>
          <Tooltip
            title={getTooltipText(heading)}
            arrow
            placement="left"
            componentsProps={{
              tooltip: {
                sx: {
                  backgroundColor: "#F7F7F8",
                  color: "black",
                  fontSize: "0.775rem",
                  borderRadius: "8px",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  maxWidth: "260px", // Adjust the maxWidth as needed
                  textAlign: "left", // Center the text
                  padding: 1,
                  outline: "2px solid transparent",
                },
              },
              arrow: {
                sx: {
                  color: "#F7F7F8",
                },
              },
            }}
          >
            <span>{heading}</span>
          </Tooltip>
        </Grid>
        <TextField
          value={value}
          size="small"
          type="number"
          sx={{
            width: "5rem",
            fontSize: "0.75rem",
            "& .MuiOutlinedInput-root": {
              height: "1.75rem",
              borderRadius: "5px",
              fontSize: "0.75rem",
              fontWeight: "light",
            },
          }}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value).toFixed(1);
            onChange(newValue, heading.toLowerCase());
          }}
        />
      </Grid>
      <Slider
        sx={{
          mx: "auto",
          "& .MuiSlider-thumb": {
            color: "#ffffff",
            border: "3px solid #2b2b2b",
          },
          "& .MuiSlider-track": {
            color: "#2b2b2b",
          },
          "& .MuiSlider-rail": {
            color: "#ada5a5",
          },
        }}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e, sliderValue) => {
          onChange(sliderValue, heading.toLowerCase());
        }}
      />
    </>
  );
};