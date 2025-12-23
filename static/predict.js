const predictBtn = document.getElementById("btnPredict");
const predictInput = document.getElementById("predictRollNo");
const predictionMessage = document.getElementById("predictionMessage");
const resultContainer = document.getElementById("resultContainer");
const ctx = document.getElementById("cgpaChart").getContext("2d");

Chart.register(ChartDataLabels);

let chartInstance = null;
let currentRollNo = "";

predictBtn.addEventListener("click", async () => {
    const rollNo = predictInput.value.trim();
    if (!rollNo) {
        predictionMessage.innerHTML = "<div class='alert alert-warning'>Please enter a Register Number</div>";
        return;
    }

    currentRollNo = rollNo; // Store for export

    try {
        predictionMessage.innerHTML = "<div class='alert alert-info'>Analyzing...</div>";
        resultContainer.style.display = "none";

        if (!currentUser) {
            predictionMessage.innerHTML = "<div class='alert alert-danger'>Please log in first</div>";
            return;
        }

        // Get JWT token
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            predictionMessage.innerHTML = "<div class='alert alert-danger'>Session expired. Please login again.</div>";
            return;
        }

        const response = await fetch(`http://127.0.0.1:5000/api/predict/${rollNo}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!response.ok) {
            // Handle 404 specially as a Warning, not an Error
            if (response.status === 404) {
                predictionMessage.innerHTML = `<div class='alert alert-warning'>${result.message}</div>`;
                return;
            }
            throw new Error(result.message);
        }

        predictionMessage.innerHTML = "";
        resultContainer.style.display = "block";

        renderChart(result);

    } catch (error) {
        predictionMessage.innerHTML = `<div class='alert alert-danger'>${error.message}</div>`;
    }
});

function renderChart(data) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const completed = data.completed_semesters;
    const predicted = data.predicted_semesters;

    // --- Simulation UI Logic ---
    const simContainer = document.getElementById("simulationContainer");

    // Check if user is allowed to see Simulation (NOT studentit@gmail.com)
    const isRestricted = currentUser && currentUser.email === "studentit@gmail.com";

    if (completed.length > 0 && simContainer && !isRestricted) {
        simContainer.style.display = "block";
        renderSimulationInputs(completed, predicted);
    } else if (simContainer) {
        simContainer.style.display = "none";
    }
    // ---------------------------

    const labels = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // Updated to 0-8

    const actualData = new Array(9).fill(null);
    const predictedData = new Array(9).fill(null);

    completed.forEach(d => {
        actualData[d.semester] = d.cgpa;
    });

    // Anchor predicted line to last actual point
    if (completed.length > 0) {
        const lastActual = completed[completed.length - 1];
        predictedData[lastActual.semester] = lastActual.cgpa;
    }

    predicted.forEach(d => {
        predictedData[d.semester] = d.predicted_cgpa;
    });

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Achieved CGPA',
                    data: actualData,
                    borderColor: '#2e7d32', // Academic Green
                    backgroundColor: '#2e7d32',
                    borderWidth: 2,
                    tension: 0.4, // Smooth curve
                    pointRadius: 5,
                    pointBackgroundColor: '#2e7d32'
                },
                {
                    label: 'Proposed CGPA',
                    data: predictedData,
                    borderColor: '#dc3545', // Red
                    backgroundColor: '#dc3545',
                    borderWidth: 2,
                    borderDash: [5, 5], // Dashed
                    tension: 0.1, // Straighter line
                    pointRadius: 5,
                    pointBackgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            layout: {
                padding: {
                    top: 50, // More space at the top
                    right: 30,
                    left: 20
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: (data.student_name ? data.student_name + " :- " : "") + "Semester wise CGPA progress",
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: getChartTheme().textColor,
                    padding: {
                        top: 10,
                        bottom: 40 // Push chart down from title
                    }
                },
                legend: {
                    position: 'bottom',
                    align: 'end', // Align to right (end)
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        padding: 30,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                datalabels: {
                    align: 'top',
                    offset: 8,
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value) => value ? value.toFixed(2) : '',
                    // Prevent labels from being cut off
                    clip: false
                }
            },
            scales: {
                y: {
                    // dynamic range
                    max: 10.0, // Strictly end at 10
                    beginAtZero: false,
                    ticks: {
                        count: 11, // 11 ticks gives us 10 intervals (e.g. 8.0, 8.2, ..., 10.0)
                        precision: 2 // Show decimals
                    },
                    title: {
                        display: true,
                        text: 'CGPA',
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    },
                    grid: {
                        color: getChartTheme().gridColor
                    },
                    ticks: {
                        color: getChartTheme().textColor,
                        count: 11,
                        precision: 2
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'SEMESTER',
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Store current simulation state
let simulationState = {
    actual: [],
    predicted: []
};

function renderSimulationInputs(completed, predicted) {
    // Initialize simulation state
    simulationState.actual = JSON.parse(JSON.stringify(completed));
    simulationState.predicted = predicted ? JSON.parse(JSON.stringify(predicted)) : [];

    renderSimulationUI();
}

function renderSimulationUI() {
    const actualContainer = document.getElementById("actualSemesters");
    const predictedContainer = document.getElementById("predictedSemesters");

    if (!actualContainer || !predictedContainer) return;

    // Render Actual Semesters (Read-only)
    actualContainer.innerHTML = "";
    simulationState.actual.forEach(item => {
        const col = document.createElement("div");
        col.className = "col-6 col-md-3";

        col.innerHTML = `
            <label class="form-label small fw-bold text-success">Sem ${item.semester}</label>
            <input type="number" class="form-control form-control-sm locked-semester-input" 
                   value="${item.cgpa}" readonly>
        `;
        actualContainer.appendChild(col);
    });

    // Render Predicted Semesters (Editable with Lock button)
    predictedContainer.innerHTML = "";
    simulationState.predicted.forEach(item => {
        const col = document.createElement("div");
        col.className = "col-6 col-md-4";

        col.innerHTML = `
            <label class="form-label small fw-bold text-warning">Sem ${item.semester}</label>
            <div class="input-group input-group-sm">
                <input type="number" step="0.01" min="0" max="10" 
                       class="form-control predicted-input" 
                       data-sem="${item.semester}" 
                       value="${item.predicted_cgpa.toFixed(2)}">
                <button class="btn btn-sm btn-outline-success lock-btn" 
                        data-sem="${item.semester}" 
                        title="Lock this CGPA as actual">
                    🔓 Lock
                </button>
            </div>
        `;
        predictedContainer.appendChild(col);
    });

    // Attach lock button handlers
    document.querySelectorAll(".lock-btn").forEach(btn => {
        btn.addEventListener("click", handleLockSemester);
    });

    // Attach input change handlers for live update
    document.querySelectorAll(".predicted-input").forEach(input => {
        input.addEventListener("change", handlePredictedChange);
    });
}

async function handlePredictedChange(event) {
    const semester = parseInt(event.target.dataset.sem);
    const newValue = parseFloat(event.target.value);

    // Update simulation state only (don't recalculate yet)
    const predItem = simulationState.predicted.find(p => p.semester === semester);
    if (predItem) {
        predItem.predicted_cgpa = newValue;
    }
}

async function handleLockSemester(event) {
    const semester = parseInt(event.target.dataset.sem);

    // Find the predicted item
    const predIndex = simulationState.predicted.findIndex(p => p.semester === semester);
    if (predIndex === -1) return;

    const predItem = simulationState.predicted[predIndex];

    // Save to database first
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            alert("Session expired. Please login again.");
            return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/lock_semester", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                roll_no: currentRollNo,
                semester: predItem.semester,
                cgpa: predItem.predicted_cgpa,
                student_name: chartInstance.options.plugins.title.text.split(" :- ")[0] || "Unknown"
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        // Move to actual in local state
        simulationState.actual.push({
            semester: predItem.semester,
            cgpa: predItem.predicted_cgpa
        });

        // Remove from predicted
        simulationState.predicted.splice(predIndex, 1);

        // Sort actual by semester
        simulationState.actual.sort((a, b) => a.semester - b.semester);

        // Recalculate predictions for remaining semesters
        await recalculateFromState();

    } catch (e) {
        // Show error near the button if possible, or use global message
        // For simplicity and visibility, using global message and scrolling up
        predictionMessage.innerHTML = `<div class='alert alert-danger'>Failed to lock semester: ${e.message}</div>`;
        document.documentElement.scrollTop = 0;
    }
}

async function recalculateFromState() {
    if (simulationState.actual.length < 2) {
        predictionMessage.innerHTML = "<div class='alert alert-warning'>Need at least 2 actual semesters to predict.</div>";
        document.documentElement.scrollTop = 0;
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            alert("Session expired. Please login again.");
            return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/simulate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ completed_semesters: simulationState.actual })
        });

        const result = await response.json();

        if (result.message) throw new Error(result.message);

        // Update predicted state
        simulationState.predicted = result.predicted_semesters;

        // Re-render UI
        renderSimulationUI();

        // Update chart
        const simulatedData = {
            student_name: chartInstance.options.plugins.title.text.split(" :- ")[0] || "Simulated Student",
            completed_semesters: simulationState.actual,
            predicted_semesters: simulationState.predicted
        };

        renderChart(simulatedData);

    } catch (e) {
        predictionMessage.innerHTML = `<div class='alert alert-danger'>Recalculation Error: ${e.message}</div>`;
        document.documentElement.scrollTop = 0;
    }
}

function getChartTheme() {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    return {
        textColor: isDark ? '#f8f9fa' : '#212529',
        gridColor: isDark ? '#495057' : '#e0e0e0'
    };
}

window.addEventListener('themeChanged', () => {
    if (chartInstance) {
        const theme = getChartTheme();

        // Update Title - Check structure
        if (chartInstance.options.plugins.title) {
            chartInstance.options.plugins.title.color = theme.textColor;
        }

        // Update Legend
        if (chartInstance.options.plugins.legend && chartInstance.options.plugins.legend.labels) {
            chartInstance.options.plugins.legend.labels.color = theme.textColor;
        }

        // Update Scales
        if (chartInstance.options.scales.y) {
            chartInstance.options.scales.y.grid.color = theme.gridColor;
            if (chartInstance.options.scales.y.ticks) chartInstance.options.scales.y.ticks.color = theme.textColor;
            if (chartInstance.options.scales.y.title) chartInstance.options.scales.y.title.color = theme.textColor;
        }

        if (chartInstance.options.scales.x) {
            if (chartInstance.options.scales.x.ticks) chartInstance.options.scales.x.ticks.color = theme.textColor;
            if (chartInstance.options.scales.x.title) chartInstance.options.scales.x.title.color = theme.textColor;
        }

        chartInstance.update();
    }
});

// Filter Export Logic
const btnFilterExport = document.getElementById("btnFilterExport");
if (btnFilterExport) {
    btnFilterExport.addEventListener("click", async () => {
        const startRoll = document.getElementById("startRoll").value.trim();
        const endRoll = document.getElementById("endRoll").value.trim();
        const minCgpa = document.getElementById("minCgpa").value;
        const maxCgpa = document.getElementById("maxCgpa").value;
        const sortOrder = document.getElementById("sortOrder").value;
        const filterMessage = document.getElementById("filterMessage");

        if (!currentUser) {
            filterMessage.innerHTML = "<div class='alert alert-danger'>Please log in first.</div>";
            return;
        }

        try {
            filterMessage.innerHTML = "<div class='text-info'>Generating Report...</div>";
            const { data: { session } } = await supabaseClient.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                filterMessage.innerHTML = "<div class='alert alert-danger'>Session expired.</div>";
                return;
            }

            const response = await fetch("http://127.0.0.1:5000/api/export_filtered", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_roll: startRoll,
                    end_roll: endRoll,
                    min_cgpa: minCgpa,
                    max_cgpa: maxCgpa,
                    sort_order: sortOrder
                })
            });

            if (!response.ok) {
                const result = await response.json();
                if (response.status === 404) {
                    filterMessage.innerHTML = `<div class='alert alert-warning'>${result.message}</div>`;
                    return;
                }
                throw new Error(result.message);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'filtered_report.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            filterMessage.innerHTML = "<div class='text-success'>Export Successful!</div>";
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('filterExportModal'));
                if (modal) modal.hide();
                filterMessage.innerHTML = "";
            }, 2000);

        } catch (e) {
            filterMessage.innerHTML = `<div class='alert alert-danger'>Export Failed: ${e.message}</div>`;
        }
    });
}
