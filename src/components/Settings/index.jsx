import { useState } from "react";
import { Tabs, Tab, Box, Grid } from "@mui/material";
import General from "./General";
import VectorDB from "./VectorDB";
import DataIngetion from "./DataIngetion";

export default function Settings() {
  const [value, setValue] = useState(0);
  const [showVectorDBTab, setshowVectorDBTab] = useState(false);
  const [showDataIngestionTab, setShowDataIngestionTab] = useState(false);

  // Handle Settings tab change
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Handle Department change (According to department tabs will handle)
  const handleDepartmentNameChange = (departmentName) => {
    if (departmentName === "ADMIN") {
      setShowDataIngestionTab(true);
      setshowVectorDBTab(true);
    } else {
      setShowDataIngestionTab(false);
      setshowVectorDBTab(false);
    }
  };

  function tabProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  return (
    <Grid container>
      <Grid item xs={2}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            height: "100vh",
            overflow: "auto",
            padding: 2,
          }}
        >
          <Tabs
            orientation="vertical"
            value={value}
            onChange={handleChange}
            aria-label="Settings Tabs"
            sx={{ height: "100%" }}
          >
            <Tab label="General" {...tabProps(0)} />
            {showVectorDBTab && <Tab label="Vector DB" {...tabProps(1)} />}
            {showDataIngestionTab && (
              <Tab label="Data Ingestion" {...tabProps(2)} />
            )}
          </Tabs>
        </Box>
      </Grid>
      <Grid item xs={10} sx={{ padding: 2 }}>
        {value === 0 && (
          <General onDepartmentNameChange={handleDepartmentNameChange} />
        )}
        {value === 1 && showVectorDBTab && <VectorDB />}
        {value === 2 && showDataIngestionTab && <DataIngetion />}
      </Grid>
    </Grid>
  );
}