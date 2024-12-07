document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");
    const statsDifferencesContainer = document.getElementById("stats-differences");

    let tableData = []; // Store the currently loaded table data
    const governorStats = {}; // Store aggregated governor data

    const repoOwner = "WhiteTigger13"; // Your GitHub username
    const repoName = "rok-stats"; // Your GitHub repository name
    const branchName = "main"; // Your repository's branch name

    const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data?ref=${branchName}`;

    // Define extended headers
    const extendedHeaders = [
        "Rank",
        "Player ID",
        "Name",
        "Power at start",
        "Kill Score at start",
        "Unit Lost at start",
        "Power Pass 4",
        "Kill Score Pass 4",
        "Difference Pass 4",
        "Top Kills Pass 4",
        "Unit Lost Pass 4",
        "Difference Pass 4",
        "Top Deaths Pass 4",
        "Power Pass 5",
        "Difference Pass 5",
        "Kill Score Pass 5",
        "Difference Pass 5",
        "Unit Lost Pass 5",
        "Difference Pass 5",
        "Power Pass 6",
        "Difference Pass 6",
        "Kill Score Pass 6",
        "Difference Pass 6",
        "Unit Lost Pass 6",
        "Difference Pass 6",
        "Power Kingsland",
        "Difference Kingsland",
        "Kill Score Kingsland",
        "Difference Kingsland",
        "Unit Lost Kingsland",
        "Difference Kingsland",
        "Power KVK End",
        "Difference Power KVK End",
        "Kill Score Power KVK End",
        "Difference Power KVK End",
        "Unit Lost Power KVK End",
        "Difference Power KVK End"
    ];

    // Fetch available files from the GitHub repository
    function fetchAvailableFiles() {
        fetch(githubApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(files => {
                const csvFiles = files.filter(file => file.name.endsWith(".csv"));
                populateDropdown(csvFiles);
            })
            .catch(err => console.error("Error fetching file list:", err));
    }

    // Populate the dropdown with file names
    function populateDropdown(files) {
        datasetSelect.innerHTML = ""; // Clear existing options
        files.forEach(file => {
            const option = document.createElement("option");
            option.value = file.download_url; // Use the direct download URL
            option.textContent = file.name; // Use the file name as the display name
            datasetSelect.appendChild(option);
        });

        // Automatically load the first file if available
        if (files.length > 0) {
            loadDataset(files[0].download_url);
        }
    }

    // Load dataset from CSV and render table
    function loadDataset(fileUrl) {
        fetch(fileUrl)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                tableData = rows; // Store table data
                renderTable(extendedHeaders, tableData); // Render the table with extended headers
                aggregateGovernorStats(rows); // Aggregate data for stats differences
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

    // Render the table with headers and rows
    function renderTable(headers, rows) {
        renderTableHeaders(headers);
        renderTableBody(rows, ""); // Show all rows on initial load
    }

    // Render table headers
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
            extendedHeaders.forEach((header, index) => {
                const td = document.createElement("td");
                const cell = row[index] || ""; // Use empty string if data is missing
                const columnName = header.trim();

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

    // Apply filter and render the table with highlights
    function filterTable(query) {
        if (!query) {
            renderTableBody(tableData, "");
            return;
        }

        const filteredRows = tableData.filter(row =>
            row.some(cell => cell.toLowerCase().includes(query.toLowerCase()))
        );

        renderTableBody(filteredRows, query); // Highlight matches
    }

    // Format numbers with thousand separators if applicable
    function formatNumberIfNeeded(value, columnName) {
        // Trim the value to remove extra spaces
        value = value.trim();

        // Check if the value is a valid number
        if (!isNaN(value) && value !== "" && columnName !== "Governor ID") {
            // Remove any non-numeric characters (like commas or spaces)
            const numericValue = parseFloat(value.replace(/,/g, ""));
            // Apply thousand separators for numeric columns
            return numericValue.toLocaleString("de-DE");
        }
        return value; // Return original value for non-numeric columns
    }

    // Download the visible table as CSV
    function downloadTableAsExcel() {
        const rows = []; // Collect rows to export

        const headers = Array.from(tableHeaders.children).map(th => th.textContent);
        rows.push(headers);

        const visibleRows = Array.from(tableBody.querySelectorAll("tr"));
        visibleRows.forEach(tr => {
            const row = Array.from(tr.children).map(td => td.textContent);
            rows.push(row);
        });

        const csvContent = rows.map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "extended_table_data.csv";
        link.click();
    }

    fetchAvailableFiles();
});
