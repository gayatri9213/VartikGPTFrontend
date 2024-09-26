import { LoadingButton } from "@mui/lab";
import {
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Fetch category data from API
const fetchCategories = async () => {
  const response = await fetch(
    `${API_BASE_URL}/Category`,
    {
      method: "GET",
      headers: { accept: "text/plain" },
    }
  );
  return response.json();
};

// Fetch department data from API
const fetchDepartments = async () => {
  const response = await fetch(
    `${API_BASE_URL}/Department`,
    {
      method: "GET",
      headers: { accept: "text/plain" },
    }
  );
  return response.json();
};

// Post a new category
const postCategory = async (data) => {
    const response = await fetch(`${API_BASE_URL}/Category`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  };
  
  // Post a new department
  const postDepartment = async (data) => {
    const response = await fetch(`${API_BASE_URL}/Department`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.ok;
  };

  const deleteCategory = async (id) => {
    const response = await fetch(`${API_BASE_URL}/Category/${id}`, {
      method: 'DELETE',
      headers: { 'accept': '*/*' },
    });
    return response.ok;
  };
  
  const deleteDepartment = async (id) => {
    const response = await fetch(`${API_BASE_URL}/Department/${id}`, {
      method: 'DELETE',
      headers: { 'accept': '*/*' },
    });
    return response.ok;
  };
  

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
        aria-label="Departments Tabs"
      >
        <Tab label="Department" />
        <Tab label="View Departments" />
      </Tabs>
      <Box sx={{ mt: 2 }}>
        {tabIndex === 0 && <Department />}
        {tabIndex === 1 && <ShowTable />}
      </Box>
    </Container>
  );
}

function Department() {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
      departmentName: "",
      categoryName: "",
      promptFile: "",
    });

  
    useEffect(() => {
      // Fetch categories when the component mounts
      const fetchData = async () => {
        const categoryData = await fetchCategories();
        setCategories(categoryData);
      };
      fetchData();
    }, []);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    };
  
    const handleSubmit = async () => {
      let category = categories.find(cat => cat.name === formData.categoryName);
      
      if (!category) {
        const newCategory = await postCategory({
          name: formData.categoryName,
          promptFile: formData.promptFile,
        });
        if (newCategory.id) {
          category = newCategory;
          setCategories((prevCategories) => [...prevCategories, category]);
          toast.success("Category created successfully");
        } else {
          toast.error("Failed to create category");
          return;
        }
      }
  
      const departmentData = {
        name: formData.departmentName,
        categoryId: category.id,
      };
  
      const success = await postDepartment(departmentData);
      if (success) {
        toast.success("Department created successfully");
        setFormData({ departmentName: "", categoryName: "", promptFile: "" });
      } else {
        toast.error("Failed to create department");
      }
    };
  
    
  
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
          Create Department
        </Typography>
        <Stack
          spacing={3}
          sx={{
            width: "80%",
            flex: 1,
            overflowY: "auto",
            padding: 2,
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <TextField
            name="departmentName"
            label="Department Name"
            variant="outlined"
            size="small"
            value={formData.departmentName}
            onChange={handleChange}
          />
          <TextField
            name="categoryName"
            label="Category Name"
            variant="outlined"
            size="small"
            value={formData.categoryName}
            onChange={handleChange}
          />
          <TextField
            name="promptFile"
            label="Prompt File"
            variant="outlined"
            size="small"
            value={formData.promptFile}
            onChange={handleChange}
          />
        </Stack>
        <LoadingButton
          size="large"
          type="button"
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
  
  function ShowTable() {
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
  
    useEffect(() => {
      // Fetch categories and departments on component mount
      const fetchData = async () => {
        const categoryData = await fetchCategories();
        const departmentData = await fetchDepartments();
       
        console.log("Fetched Departments:", departmentData); // Debugging line
        const filteredDepartments = departmentData.filter(dep => dep.name.toLowerCase() !== "admin");
        console.log("Filtered Departments:", filteredDepartments); // Debugging line

        setCategories(categoryData);
        setDepartments(filteredDepartments);
      };
      fetchData();
    }, []);
  
    const handleDelete = async (id) => {
      // Find the department to delete
      const departmentToDelete = departments.find(dep => dep.id === id);
      
      if (departmentToDelete) {
        // Confirm deletion
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: "This will delete the department and its associated category.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        });
  
        if (result.isConfirmed) {
          // Delete the department
          const deleteDeptSuccess = await deleteDepartment(id);
  
          if (deleteDeptSuccess) {
            // Now delete the associated category
            const categoryId = departmentToDelete.categoryId;
            const deleteCatSuccess = await deleteCategory(categoryId);
  
            if (deleteCatSuccess) {
              Swal.fire('Deleted!', 'The department and category have been deleted.', 'success');
              setDepartments(prevDepartments => prevDepartments.filter(dep => dep.id !== id));
              setCategories(prevCategories => prevCategories.filter(cat => cat.id !== categoryId));
            } else {
              Swal.fire('Error!', 'Failed to delete the category.', 'error');
            }
          } else {
            Swal.fire('Error!', 'Failed to delete the department.', 'error');
          }
        }
      }
    };
  
    const getCategoryName = (categoryId) => {
      const category = categories.find((cat) => cat.id === categoryId);
      return category ? category.name : "Unknown";
    };
  
    const getPromptFile = (categoryId) => {
      const category = categories.find((cat) => cat.id === categoryId);
      return category ? category.promptFile : "Unknown";
    };
  
    return (
      <div>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Prompt File</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{getCategoryName(row.categoryId)}</TableCell>
                  <TableCell>{getPromptFile(row.categoryId)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(row.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
  