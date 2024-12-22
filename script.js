document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");
    const statsDifferencesContainer = document.getElementById("stats-differences");

    let tableData = []; // Store the currently loaded table data
    let currentHeaders = []; // Store the headers
    const basePath = "https://whitetigger13.github.io/rok-stats/data/"; // Path to CSV files

    // List of CSV files (manually maintained or fetched from GitHub)
    const csvFiles = [
        "1599_November_Progress_Tracker.csv",
        "1599_December_Progress_Tracker.csv",
        // Add more files here as needed
    ];

    // Populate the dropdown with file names
    function populateDropdown() {
        datasetSelect.innerHTML = ""; // Clear existing options
        csvFiles.forEach(file => {
            const option = document.createElement("option");
            option.value = basePath + file; // Full URL of the CSV file
            option.textContent = file.replace(/_/g, " ").replace(".csv", ""); // Pretty name
            datasetSelect.appendChild(option);
        });

        // Automatically load the first file if available
        if (csvFiles.length > 0) {
            loadDataset(basePath + csvFiles[0]);
        }
    }

    // Load dataset from CSV and render table
    function loadDataset(fileUrl) {
        fetch(fileUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                return response.text();
            })
            .then(csvText => {
                const rows = csvText.trim().split(/\r?\n/).map(row => row.split(","));
                if (rows.length > 0) {
                    currentHeaders = rows.shift().map(header => header.trim());
                    tableData = rows.filter(row => row.length === currentHeaders.length).map(row => row.map(cell => cell.trim()));
                    renderTable(currentHeaders, tableData);
                } else {
                    console.error("No data found in the CSV file.");
                }
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
        downloadTableAsCSV();
    });

    // Render the table with headers and rows
    function renderTable(headers, rows) {
        renderTableHeaders(headers);
        renderTableBody(rows, ""); // Show all rows on initial load
    }

    // Render table headers dynamically
    function renderTableHeaders(headers) {
        tableHeaders.innerHTML = ""; // Clear existing headers
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header.trim();
            tableHeaders.appendChild(th);
        });
    }

    // Render table body with optional highlighting and formatting
    function renderTableBody(rows, query) {
        tableBody.innerHTML = ""; // Clear existing rows

        rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach((cell, index) => {
                const td = document.createElement("td");
                const columnName = currentHeaders[index]?.trim();

                // Apply number formatting if the column contains numeric data
                const formattedCell = formatNumberIfNeeded(cell.trim(), columnName);

                // Highlight matching cells
                if (query && formattedCell.toLowerCase().includes(query.toLowerCase())) {
                    td.innerHTML = `<span style="background-color: yellow;">${formattedCell}</span>`;
                } else {
                    td.innerHTML = formattedCell;
                }

                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    // Format numbers with thousand separators if applicable
    function formatNumberIfNeeded(value, columnName) {
        if (!isNaN(value) && value !== "" && columnName && !columnName.toLowerCase().includes("id")) {
            return parseInt(value, 10).toLocaleString("de-DE");
        }
        return value; // Return original value for non-numeric columns
    }

    // Download the visible table as CSV
    function downloadTableAsCSV() {
        const rows = []; // Collect rows to export

        // Add headers as the first row
        const headers = Array.from(tableHeaders.children).map(th => th.textContent);
        rows.push(headers);

        // Add visible rows (those currently in the DOM)
        const visibleRows = Array.from(tableBody.querySelectorAll("tr"));
        visibleRows.forEach(tr => {
            const row = Array.from(tr.children).map(td => td.textContent);
            rows.push(row);
        });

        // Convert rows to CSV format
        const csvContent = rows.map(row => row.join(",")).join("\n");

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "filtered_table_data.csv";
        link.click();
    }

    // Apply filter and render the table with highlights
    function filterTable(query) {
        if (!query) {
            renderTableBody(tableData, ""); // Show all rows without highlights
            return;
        }

        // Filter rows based on query
        const filteredRows = tableData.filter(row =>
            row.some(cell => cell.toLowerCase().includes(query.toLowerCase()))
        );

        renderTableBody(filteredRows, query); // Highlight matches
    }

    // Initialize the dropdown and load the first dataset
    populateDropdown();
});
