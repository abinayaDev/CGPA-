const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("excelFile");
const messageDiv = document.getElementById("message");
const previewContainer = document.getElementById("previewContainer");
const previewTableBody = document.querySelector("#previewTable tbody");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];

    if (!file) {
        messageDiv.innerHTML = "<div class='alert alert-danger'>Please select a file</div>";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (!currentUser) {
        messageDiv.innerHTML = "<div class='alert alert-danger'>You must be logged in</div>";
        return;
    }

    try {
        messageDiv.innerHTML = "<div class='alert alert-info'>Uploading...</div>";
        previewContainer.style.display = "none";
        previewTableBody.innerHTML = "";

        // Get JWT token from Supabase session
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;
        const formatGuide = document.getElementById("formatGuide");

        if (formatGuide) formatGuide.style.display = "none";

        if (!token) {
            messageDiv.innerHTML = "<div class='alert alert-danger'>Session expired. Please login again.</div>";
            return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/upload", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.errors) {
                throw new Error(result.errors.join("<br>"));
            }
            throw new Error(result.message);
        }

        messageDiv.innerHTML = `<div class='alert alert-success'>${result.message || "Success"}</div>`;

        if (result.data_preview && result.data_preview.length > 0) {
            result.data_preview.forEach(row => {
                const tr = document.createElement("tr");

                const completedStr = row.completed_semesters
                    .map(sem => `S${sem.semester}: ${sem.cgpa}`)
                    .join(", ");

                const missingStr = row.missing_semesters.join(", ");

                tr.innerHTML = `
                    <td>${row.student_name}</td>
                    <td>${row.roll_no}</td>
                    <td>${completedStr}</td>
                    <td>${missingStr || "None"}</td>
                `;
                previewTableBody.appendChild(tr);
            });
            previewContainer.style.display = "block";
        }

    } catch (error) {
        messageDiv.innerHTML = `<div class='alert alert-danger'>${error.message}</div>`;
    }
});

// Export All Logic
const btnExportAll = document.getElementById("btnExportAll");
if (btnExportAll) {
    btnExportAll.addEventListener("click", async () => {
        if (!currentUser) {
            messageDiv.innerHTML = "<div class='alert alert-danger'>Please log in first.</div>";
            return;
        }

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                messageDiv.innerHTML = "<div class='alert alert-danger'>Session expired. Please login again.</div>";
                return;
            }

            // Create a temporary form to download file
            const downloadUrl = `http://127.0.0.1:5000/api/export_all`;

            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'all_students_prediction.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (e) {
            messageDiv.innerHTML = `<div class='alert alert-danger'>Export failed: ${e.message}</div>`;
        }
    });
}
