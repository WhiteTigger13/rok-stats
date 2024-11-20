document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");

    // List of available datasets with upload dates
    const datasets = [
        { name: "Dataset 1", file: "data/dataset1.csv", uploadDate: "2024-11-20" },
        { name: "Dataset 2", file: "data/dataset2.csv", uploadDate: "2024-11-21" }
    ];

    // Populate dataset selector
    datasets.forEach((dataset, index) => {
        const option = document.createElement("option");
        option.value = dataset.file;
        option.textContent = `${dataset.name} (Uploaded: ${dataset.uploadDate})`;
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
                    row.forEach(cell => {
                        const td = document.createElement("td");

                        // Format numbers
                        const formattedCell = formatNumber(cell.trim());
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
            return parseInt(value, 10).toLocaleString("de-DE"); // German format uses "." as thousand separator
        }
        return value; // Return original value if it's not a number
    }
});
