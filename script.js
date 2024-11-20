document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");

    let tableData = []; // Store the currently loaded table data
    let currentHeaders = []; // Store the headers

    const datasets = [
        { name: "Dataset 1", file: "data/dataset1.csv", uploadDate: "2024-11-20" },
        { name: "Dataset 2", file: "data/dataset2.csv", uploadDate: "2024-11-20" }
       
    ];

    // Populate dropdown menu with datasets
    datasets.forEach((dataset, index) => {
        const option = document.createElement("option");
        option.value = dataset.file;
        option.textContent = `${dataset.name} (Uploaded: ${dataset.uploadDate})`;
        datasetSelect.appendChild(option);

        if (index === 0) loadDataset(dataset.file); // Load the first dataset on page load
    });

    // Event listeners
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

    // Load dataset from CSV and render table
    function loadDataset(file) {
        fetch(file)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                currentHeaders = rows.shift(); // Extract headers
                tableData = rows; // Store table data
                console.log("Loaded Data:", tableData); // Debugging
                renderTable(currentHeaders, tableData); // Render the table with all data
            })
            .catch(err => console.error("Error loading dataset:", err));
    }

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
});
