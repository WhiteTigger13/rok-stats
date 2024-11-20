document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");

    let tableData = []; // Store the currently loaded table data
    let currentHeaders = []; // Store the headers

    const fileEndpoint = "list_files.php"; // Replace with your server endpoint or static JSON file

    // Fetch available files dynamically
    function fetchAvailableFiles() {
        fetch(fileEndpoint)
            .then(response => response.json())
            .then(files => {
                populateDropdown(files);
            })
            .catch(err => console.error("Error fetching file list:", err));
    }

    // Populate the dropdown with file names
    function populateDropdown(files) {
        datasetSelect.innerHTML = ""; // Clear existing options
        files.forEach(file => {
            const option = document.createElement("option");
            option.value = `data/${file}`;
            option.textContent = file; // Use the file name as the display name
            datasetSelect.appendChild(option);
        });

        // Automatically load the first file
        if (files.length > 0) {
            loadDataset(`data/${files[0]}`);
        }
    }

    // Load dataset from CSV and render table
    function loadDataset(file) {
        fetch(file)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                currentHeaders = rows.shift(); // Extract headers
                tableData = rows; // Store table data
                renderTable(currentHeaders, tableData); // Render the table with all data
            })
            .catch(err => console.error("Error loading dataset:", err));
    }

    datasetSelect.addEventListener("change", (event) => {
        const selectedFile = event.target.value;
        loadDataset(selectedFile);
    });

    searchInput.addEventListener("input", (event) => {
        filterTable(event.target.value);
    });

    downloadButton.addEventListener("click", () => {
        downloadTableAsExcel();
    });

    // Initialize by fetching available files
    fetchAvailableFiles();
});
