import React, { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import Swal from "sweetalert2";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const INJECT_API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://dataingestion.eastus.azurecontainer.io:80/v1/dataingestion/ingest"
    : process.env.REACT_APP_INJECT_API_BASE_URL;
const VECTOR_STORE_API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://dataingestion.eastus.azurecontainer.io:80/v1/index"
    : process.env.REACT_APP_VECTORDB_API_BASE_URL;

export default function App() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Container sx={{ mt: 2 }}>
      <ToastContainer />
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="Data Ingestion Tabs"
      >
        <Tab label="Data Ingestion" />
        <Tab label="Status" />
      </Tabs>
      <Box sx={{ mt: 2 }}>
        {tabIndex === 0 && <DataIngetion />}
        {tabIndex === 1 && <StatusTable />}
      </Box>
    </Container>
  );
}

function DataIngetion() {
  const [formData, setFormData] = useState({
    vectorStore: "",
    vectorIndex: "",
    filesContainer: "",
    chunkingType: "",
    embLLMType: "",
    embLLMName: "",
    departmentId: "",
    status: 0,
  });
  const [embLLMTypes, setEmbLLMTypes] = useState([]);
  const [embLLMNames, setEmbLLMNames] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedVectorStore, setSelectedVectorStore] = useState("");
  const [vectorIndexes, setVectorIndexes] = useState([]);
  const [selectedVectorIndex, setSelectedVectorIndex] = useState("");

  // Function to save form data to localStorage
  const saveFormDataToLocalStorage = (data) => {
    localStorage.setItem("dataIngestionForm", JSON.stringify(data));
  };

  // Handle change for Vector Store selection
  const handleVectorStoreChange = (event) => {
    const value = event.target.value;
    setSelectedVectorStore(value);
    setFormData((prevState) => ({
      ...prevState,
      vectorStore: value,
    }));
    saveFormDataToLocalStorage({
      ...JSON.parse(localStorage.getItem("dataIngestionForm") || "{}"),
      vectorStore: value,
    });
    if (value === "Pinecone") {
      fetchPineconeIndexes();
    } else if (value === "Qdrant") {
      fetchQdrantIndexes();
    } else if (value === "AzureOpenAI") {
      fetchAzureAISearchIndexes();
    } else {
      setVectorIndexes([]);
    }
  };

  // Handle change for Vector Index selection
  const handleVectorIndexChange = (event) => {
    const value = event.target.value;
    setSelectedVectorIndex(value);
    setFormData((prevState) => ({
      ...prevState,
      vectorIndex: value,
    }));
    saveFormDataToLocalStorage({
      ...JSON.parse(localStorage.getItem("dataIngestionForm") || "{}"),
      vectorIndex: value,
    });
  };

  // Function to fetch Pinecone indexes
  const fetchPineconeIndexes = async () => {
    try {
      const response = await axios.post(
        `${VECTOR_STORE_API_BASE_URL}/pinecone/listindexes`
      );
      const parsedData = JSON.parse(response.data);
      const pineconeIndexes = parsedData.message.map((item) => item.name);
      setVectorIndexes(pineconeIndexes);
    } catch (error) {
      console.error("Error fetching Pinecone indexes:", error);
      setVectorIndexes([]);
    }
  };

  // Function to fetch Qdrant indexes
  const fetchQdrantIndexes = async () => {
    try {
      const response = await axios.post(
        `${VECTOR_STORE_API_BASE_URL}/qdrant/listcollection`
      );
      const parsedData = JSON.parse(response.data);
      const qdrantIndexes = parsedData.message.map((item) => item.name);
      setVectorIndexes(qdrantIndexes);
    } catch (error) {
      console.error("Error fetching Qdrant indexes:", error);
      setVectorIndexes([]);
    }
  };

  // Function to fetch Azure indexes
  const fetchAzureAISearchIndexes = async () => {
    try {
      const response = await axios.post(
        `${VECTOR_STORE_API_BASE_URL}/azuresearch/listindexes`
      );
      const azureIndexes = response.data;
      setVectorIndexes(azureIndexes);
    } catch (error) {
      console.error("Error fetching Azure AI Search indexes:", error);
      setVectorIndexes([]);
    }
  };

  useEffect(() => {
    const formDataObject = JSON.parse(localStorage.getItem("formData"));
    const formDataUserId = formDataObject.userId;
    console.log(formDataUserId);
    if (formDataUserId) {
      setUserId(parseInt(formDataUserId, 10));
    }

    // Function to fetch Embedded LLM Reference Data
    const fetchEmbLLMRefData = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/EmbLLMRef`);
        setEmbLLMTypes(Array.from(new Set(data.map((item) => item.type))));
        setEmbLLMNames(data);
      } catch (error) {
        console.error("Failed to fetch EmbLLMRef data:", error);
      }
    };

    // Function to fetch Departments
    const fetchDepartments = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/Department`);
        setDepartments(data);
        console.log("Departments", data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };

    fetchEmbLLMRefData();
    fetchDepartments();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    saveFormDataToLocalStorage(updatedFormData);
  };

  const handleSubmit = async () => {
    try {
      if (!userId) {
        throw new Error("User ID is not available.");
      }

      // Ensure formData is up-to-date
      const formDataToSubmit = {
        ...formData,
        vectorStore: selectedVectorStore,
        vectorIndex: selectedVectorIndex,
      };
      // 1st API payload
      const firstApiPayload = {
        userId,
        departmentId: formDataToSubmit.departmentId,
        vectorStore: formDataToSubmit.vectorStore,
        vectorIndex: formDataToSubmit.vectorIndex,
        filesContainer: formDataToSubmit.filesContainer,
        chunkingType: formDataToSubmit.chunkingType,
        updatedDateTime: new Date().toISOString(),
        embLLMType: formDataToSubmit.embLLMType,
        embLLMName: formDataToSubmit.embLLMName,
        status: formDataToSubmit.status,
      };

      // 1st API call
      const firstApiResponse = await axios.post(
        `${API_BASE_URL}/DataIngestion`,
        JSON.stringify(firstApiPayload),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("1st API Response:", firstApiResponse.data);

      // 2nd API payload
      const secondApiPayload = {
        ingestion_id: firstApiResponse.data.id,
        files_container: formDataToSubmit.filesContainer,
        index_name: formDataToSubmit.vectorIndex,
        vector_store_name: formDataToSubmit.vectorStore,
        chunking_type: formDataToSubmit.chunkingType,
      };

      console.log(secondApiPayload);

      // 2nd API call
      const secondApiResponse = await axios.post(
        `${INJECT_API_BASE_URL}`,
        JSON.stringify(secondApiPayload),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("2nd API Response:", secondApiResponse.data);

      setFormData({
        vectorStore: "",
        vectorIndex: "",
        filesContainer: "",
        chunkingType: "",
        embLLMType: "",
        embLLMName: "",
        departmentId: "",
        status: 0,
      });

      toast.success("Data saved successfully!");
    } catch (error) {
      toast.error(
        "Failed to save data. Please try again.",
        error.response ? error.response.data : error.message
      );
      console.error(
        "Failed to save data:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const filteredEmbLLMNames = embLLMNames.filter(
    (item) => item.type === formData.embLLMType
  );

  return (
    <Container
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        Data Ingestion Settings
      </Typography>

      <Stack
        spacing={3}
        sx={{
          width: "80%",
          marginRight: "200px",
          flex: 1,
          overflowY: "auto",
          padding: 2,
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <TextField
          name="filesContainer"
          label="Files Container"
          variant="outlined"
          size="small"
          value={formData.filesContainer}
          onChange={handleChange}
        />

        <FormControl size="small">
          <InputLabel> Vector Store</InputLabel>

          <Select
            label="Vector Store"
            fullWidth
            value={selectedVectorStore}
            onChange={handleVectorStoreChange}
          >
            <MenuItem value="Pinecone">Pinecone</MenuItem>
            <MenuItem value="Qdrant">Qdrant</MenuItem>
            <MenuItem value="AzureOpenAI">AzureOpenAI</MenuItem>
            <MenuItem value="chromadb">ChromaDB</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="select-chunking-type-label"> Vector Index</InputLabel>
          <Select
            labelId="select-chunking-type-label"
            id="select-chunking-type"
            name="VectorIndex"
            label="Vector Index"
            fullWidth
            value={selectedVectorIndex}
            onChange={handleVectorIndexChange}
          >
            {vectorIndexes.map((index) => (
              <MenuItem key={index} value={index}>
                {index}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="select-chunking-type-label">Chunking Type</InputLabel>
          <Select
            labelId="select-chunking-type-label"
            id="select-chunking-type"
            name="chunkingType"
            value={formData.chunkingType}
            onChange={handleChange}
            label="Chunking Type"
          >
            <MenuItem value="Recursive character">Recursive character</MenuItem>
            <MenuItem value="Semantic">Semantic </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="select-department-label">Department</InputLabel>
          <Select
            labelId="select-department-label"
            id="select-department"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            label="Department"
          >
            {departments.map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="select-emb-llm-type-label">Embedding Type</InputLabel>
          <Select
            labelId="select-emb-llm-type-label"
            id="select-emb-llm-type"
            name="embLLMType"
            value={formData.embLLMType}
            onChange={handleChange}
            label="Embedding Type"
          >
            {embLLMTypes.map((type, index) => (
              <MenuItem key={index} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="select-emb-llm-name-label">
            Embedding Model
          </InputLabel>
          <Select
            labelId="select-emb-llm-name-label"
            id="select-emb-llm-name"
            name="embLLMName"
            value={formData.embLLMName}
            onChange={handleChange}
            label="Embedding Model"
            disabled={!formData.embLLMType}
          >
            {filteredEmbLLMNames.map((item, index) => (
              <MenuItem key={index} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <LoadingButton
        size="large"
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2, textAlign: "left" }}
        onClick={handleSubmit}
      >
        Submit
      </LoadingButton>
    </Container>
  );
}

function StatusTable() {
  const [statusData, setStatusData] = useState([]);
  const [departments, setDepartments] = useState({});
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from DataIngestion API
        const dataIngestionResponse = await axios.get(
          `${API_BASE_URL}/DataIngestion`,
          {
            headers: {
              accept: "text/plain",
            },
          }
        );
        const data = dataIngestionResponse.data;
        console.log(data.error);

        // Extract department IDs
        const deptIds = Array.from(
          new Set(data.map((item) => item.departmentId))
        );

        // Fetch department names in parallel
        const deptRequests = deptIds.map((id) =>
          axios
            .get(`${API_BASE_URL}/Department/${id}`, {
              headers: {
                accept: "text/plain",
              },
            })
            .then((response) => ({
              id,
              name: response.data.name,
            }))
        );

        const deptResponses = await Promise.all(deptRequests);
        const deptMap = deptResponses.reduce((acc, dept) => {
          acc[dept.id] = dept.name;
          return acc;
        }, {});
        console.log(data);
        setDepartments(deptMap);
        setStatusData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleCheckStatus = (status, errorMessage) => {
    console.log(status);
    if (status === 1) {
      Swal.fire({
        title: "Success",
        text: "Data Ingestion Successfully Done!",
        icon: "success",
        confirmButtonText: "Okay",
      });
    } else if (status === 2) {
      const errorText = errorMessage || "Error during Data Ingestion.";
      Swal.fire({
        title: "Error",
        text: errorText,
        icon: "error",
        confirmButtonText: "Okay",
      });
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow sx={{ textAlign: "center" }}>
                <TableCell>Department</TableCell>
                <TableCell>Vector Store</TableCell>
                <TableCell>Vector Index</TableCell>
                <TableCell>Chunking Type</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statusData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center" }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                statusData.map((row, index) => (
                  <TableRow sx={{ textAlign: "center" }} key={index}>
                    <TableCell>
                      {departments[row.departmentId] || "Loading..."}
                    </TableCell>
                    <TableCell>{row.vectorStore}</TableCell>
                    <TableCell>{row.vectorIndex}</TableCell>
                    <TableCell>{row.chunkingType}</TableCell>
                    <TableCell>
                      <LoadingButton
                        size="small"
                        variant="contained"
                        color="primary"
                        sx={{
                          mt: 2,
                          textAlign: "left",
                          lineHeight: "1rem",
                          marginTop: "5px",
                        }}
                        disabled={row.status === 0}
                        onClick={() => handleCheckStatus(row.status, row.error)}
                      >
                        Check Status
                      </LoadingButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
