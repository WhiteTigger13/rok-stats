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
        fetch(githubApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(files => {
                const csvFiles = files.filter(file => file.name.endsWith(".csv"));
                console.log("CSV Files:", csvFiles); // Debugging
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
        console.log("Loading dataset:", fileUrl); // Debugging

        fetch(fileUrl)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                currentHeaders = rows.shift(); // Extract headers
                tableData = rows; // Store table data
                console.log("Loaded Data:", tableData); // Debugging
                renderTable(currentHeaders, tableData); // Render the table with all data
                aggregateGovernorStats(fileUrl, rows); // Aggregate data for stats differences
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
            row.forEach((cell, index) => {
                const td = document.createElement("td");
                const columnName = currentHeaders[index].trim();

                // Apply number formatting if the column contains numeric data
                const formattedCell = formatNumberIfNeeded(cell.trim(), columnName);

                console.log("Formatted Cell:", formattedCell); // Debugging

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

    // Aggregate data for governor stats
    function aggregateGovernorStats(fileUrl, rows) {
        rows.forEach(row => {
            const governorName = row[currentHeaders.indexOf("Governor Name")]?.trim();
            if (!governorName) return;

            if (!governorStats[governorName]) {
                governorStats[governorName] = [];
            }

            const power = parseInt(row[currentHeaders.indexOf("Power")] || "0", 10);
            const killPoints = parseInt(row[currentHeaders.indexOf("Kill Points")] || "0", 10);
            const deaths = parseInt(row[currentHeaders.indexOf("Deaths")] || "0", 10);

            governorStats[governorName].push({ file: fileUrl, power, killPoints, deaths });
        });

        console.log("Aggregated Governor Stats:", governorStats); // Debugging
    }

    // Calculate stats differences for governors
    function calculateStatsDifferences() {
        statsDifferencesContainer.innerHTML = ""; // Clear previous results

        Object.keys(governorStats).forEach(governorName => {
            const stats = governorStats[governorName];
            if (stats.length < 2) return; // Skip if there's not enough data for comparison

            const latest = stats[stats.length - 1];
            const previous = stats[stats.length - 2];

            const powerChange = latest.power - previous.power;
            const killPointsChange = latest.killPoints - previous.killPoints;
            const deathsChange = latest.deaths - previous.deaths;

            const differenceElement = document.createElement("div");
            differenceElement.innerHTML = `
                <h4>${governorName}</h4>
                <p>Power Change: ${powerChange > 0 ? "+" : ""}${powerChange}</p>
                <p>Kill Points Change: ${killPointsChange > 0 ? "+" : ""}${killPointsChange}</p>
                <p>Deaths Change: ${deathsChange > 0 ? "+" : ""}${deathsChange}</p>
            `;
            statsDifferencesContainer.appendChild(differenceElement);
        });
    }

    // Tab switching logic
    function showTab(tabId) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    }

    // Apply filter and render the table with highlights
    function filterTable(query) {
        if (!query) {
            // If no query, render the full dataset without highlights
            renderTableBody(tableData, "");
            return;
        }

        // Filter rows based on query
        const filteredRows = tableData.filter(row =>
            row.some(cell => cell.toLowerCase().includes(query.toLowerCase()))
        );

        console.log("Filtered Rows:", filteredRows); // Debugging

        renderTableBody(filteredRows, query); // Highlight matches
    }

    // Format numbers with thousand separators if applicable
    function formatNumberIfNeeded(value, columnName) {
        if (!isNaN(value) && value !== "" && columnName !== "Governor ID") {
            // Apply thousand separators for numeric columns
            return parseInt(value, 10).toLocaleString("de-DE");
        }
        return value; // Return original value for non-numeric columns
    }

    // Download the visible table as CSV
    function downloadTableAsExcel() {
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

        console.log("Rows to Download:", rows); // Debugging

        // Convert rows to CSV format
        const csvContent = rows.map(row => row.join(",")).join("\n");

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "filtered_table_data.csv";
        link.click();
    }

    // Fetch and populate the dropdown on page load
    fetchAvailableFiles();
});
