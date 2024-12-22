document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");
    const statsDifferencesContainer = document.getElementById("stats-differences");

    let tableData = []; // Store the currently loaded table data
    let currentHeaders = []; // Store the headers
    const governorStats = {}; // Store aggregated governor data

    const repoOwner = "WhiteTigger13"; // Your GitHub username
    const repoName = "rok-stats"; // Your GitHub repository name
    const branchName = "main"; // Your repository's branch name

    const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data?ref=${branchName}`;

    // Fetch available files from the GitHub repository
    function fetchAvailableFiles() {
        fetch(githubApiUrl, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
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
        fetch(fileUrl, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.trim().split(/\r?\n/).map(row => row.split(","));
                if (rows.length > 0) {
                    currentHeaders = rows.shift().map(header => header.trim());
                    tableData = rows.filter(row => row.length === currentHeaders.length).map(row => row.map(cell => cell.trim()));
                    console.log("CSV Headers:", currentHeaders); // Debugging
                    console.log("CSV Data:", tableData); // Debugging
                    renderTable(currentHeaders, tableData); // Render the table with all data
                    aggregateGovernorStats(rows); // Aggregate data for stats differences
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
        console.log("Table Headers Element:", tableHeaders.innerHTML); // Debugging
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
        console.log("Table Body Element:", tableBody.innerHTML); // Debugging
    }

    // Aggregate data for governor stats dynamically
    function aggregateGovernorStats(rows) {
        Object.keys(governorStats).forEach(key => delete governorStats[key]); // Reset stats
        rows.forEach(row => {
            const governorNameIndex = currentHeaders.findIndex(header => header.toLowerCase().includes("governor name"));
            const powerIndex = currentHeaders.findIndex(header => header.toLowerCase().includes("power"));
            const killPointsIndex = currentHeaders.findIndex(header => header.toLowerCase().includes("kill"));
            const deathsIndex = currentHeaders.findIndex(header => header.toLowerCase().includes("dead"));

            if (governorNameIndex === -1) return;

            const governorName = row[governorNameIndex]?.trim();
            if (!governorName) return;

            if (!governorStats[governorName]) {
                governorStats[governorName] = [];
            }

            const power = parseInt(row[powerIndex]?.replace(/,/g, "") || "0", 10);
            const killPoints = parseInt(row[killPointsIndex]?.replace(/,/g, "") || "0", 10);
            const deaths = parseInt(row[deathsIndex]?.replace(/,/g, "") || "0", 10);

            governorStats[governorName].push({ power, killPoints, deaths });
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

    // Fetch and populate the dropdown on page load
    fetchAvailableFiles();
});
