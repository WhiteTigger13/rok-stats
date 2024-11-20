document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");

    // List of available datasets
    const datasets = [
        { name: "Dataset 1", file: "data/dataset1.csv" },
        { name: "Dataset 2", file: "data/dataset2.csv" }
    ];

    // Generate upload date dynamically
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    // Populate dataset selector
    datasets.forEach((dataset, index) => {
        const option = document.createElement("option");
        option.value = dataset.file;
        option.textContent = `${dataset.name} (Uploaded: ${formattedDate})`;
        datasetSelect.appendChild(option);

        // Load the first dataset by default
        if (index === 0) loadDataset(dataset.file);
    });

    // Load dataset on change
    datasetSelect.addEventListener("change", (event) => {
        const selectedFile = event.target.value;
        loadDataset(selectedFile);
    });

    function loadDataset(file) {
        fetch(file)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                const headers = rows.shift();

                // Clear existing table
                tableHeaders.innerHTML = "";
                tableBody.innerHTML = "";

                // Add headers
                headers.forEach(header => {
                    const th = document.createElement("th");
                    th.textContent = header.trim(); // Trim to remove unnecessary spaces
                    tableHeaders.appendChild(th);
                });

                // Add rows
                rows.forEach(row => {
                    const tr = document.createElement("tr");
                    row.forEach((cell, columnIndex) => {
                        const td = document.createElement("td");

                        // Format numbers except for the Governor ID column
                        const columnName = headers[columnIndex].trim();
                        const formattedCell =
                            columnName === "Governor ID" ? cell.trim() : formatNumber(cell.trim());
                        
                        td.textContent = formattedCell;
                        tr.appendChild(td);
                    });
                    tableBody.appendChild(tr);
                });
            })
            .catch(err => console.error("Error loading CSV:", err));
    }

    // Function to format numbers with thousand separators
    function formatNumber(value) {
        // Check if the value is a number
        if (!isNaN(value) && value !== "") {
            return parseInt(value, 10).toLocaleString("de-DE"); // German format uses "." 
