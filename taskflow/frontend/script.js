
const API = "/api";

let tasks = [];
let projects = [];
let selectedProject = null;

const $ = (id) => document.getElementById(id);

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function request(url, options = {}) {
    const response = await fetch(API + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}

function showMessage(message = "") {
    $("message").textContent = message;
}

async function loadDashboard() {
    try {
        showMessage("");

        [projects, tasks] = await Promise.all([
            request("/projects"),
            request("/tasks")
        ]);

        renderProjects();
        renderProjectOptions();
        renderBoard();
    } catch (error) {
        showMessage(error.message);
    }
}

function renderProjects() {
    $("projectList").innerHTML = projects.map(project => `
        <button class="project-item ${
            selectedProject === project.id ? "selected" : ""
        }" onclick="selectProject(${project.id})">
            <span class="project-symbol">▦</span>
            <span>${escapeHTML(project.name)}</span>
        </button>
    `).join("");
}

function renderProjectOptions() {
    $("taskProject").innerHTML =
        '<option value="">No project</option>' +
        projects.map(project => `
            <option value="${project.id}">
                ${escapeHTML(project.name)}
            </option>
        `).join("");
}

function selectProject(id) {
    selectedProject = id;
    const project = projects.find(p => p.id === id);

    $("boardTitle").textContent = project
        ? project.name
        : "All Tasks";

    renderProjects();
    renderBoard();
}

function showAllTasks() {
    selectedProject = null;
    $("boardTitle").textContent = "All Tasks";
    renderProjects();
    renderBoard();
}

async function createProject() {
    const name = prompt("Enter project name:");
    if (!name || !name.trim()) return;

    const description = prompt("Enter project description:") || "";

    try {
        const project = await request("/projects", {
            method: "POST",
            body: JSON.stringify({ name, description })
        });

        await loadDashboard();
        selectProject(project.id);
    } catch (error) {
        alert(error.message);
    }
}

function openTaskModal(status = "todo") {
    $("taskForm").reset();
    $("taskStatus").value = status;
    $("formError").textContent = "";

    if (selectedProject !== null) {
        $("taskProject").value = String(selectedProject);
    }

    $("taskDialog").showModal();
}

function closeTaskModal() {
    $("taskDialog").close();
}

$("taskForm").addEventListener("submit", async event => {
    event.preventDefault();
    $("formError").textContent = "";

    const task = {
        title: $("taskTitle").value.trim(),
        description: $("taskDescription").value.trim(),
        project_id: $("taskProject").value || null,
        priority: $("taskPriority").value,
        status: $("taskStatus").value,
        due_date: $("taskDueDate").value || null
    };

    try {
        await request("/tasks", {
            method: "POST",
            body: JSON.stringify(task)
        });

        closeTaskModal();
        await loadDashboard();
    } catch (error) {
        $("formError").textContent = error.message;
    }
});

async function changeStatus(id, status) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    try {
        await request(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                project_id: task.project_id,
                priority: task.priority,
                status,
                due_date: task.due_date
                    ? String(task.due_date).slice(0, 10)
                    : null
            })
        });

        await loadDashboard();
    } catch (error) {
        showMessage(error.message);
    }
}

async function editTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    const title = prompt("Edit task title:", task.title);
    if (title === null) return;

    if (!title.trim()) {
        alert("Task title cannot be empty.");
        return;
    }

    const description = prompt(
        "Edit description:",
        task.description || ""
    );

    if (description === null) return;

    try {
        await request(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                title: title.trim(),
                description,
                project_id: task.project_id,
                status: task.status,
                priority: task.priority,
                due_date: task.due_date
                    ? String(task.due_date).slice(0, 10)
                    : null
            })
        });

        await loadDashboard();
    } catch (error) {
        showMessage(error.message);
    }
}

async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await request(`/tasks/${id}`, {
            method: "DELETE"
        });

        await loadDashboard();
    } catch (error) {
        showMessage(error.message);
    }
}

function renderBoard() {
    const query = $("searchInput").value.toLowerCase().trim();

    const visibleTasks = tasks.filter(task => {
        const matchesProject =
            selectedProject === null ||
            task.project_id === selectedProject;

        const matchesSearch =
            `${task.title} ${task.description || ""} ${
                task.project_name || ""
            }`.toLowerCase().includes(query);

        return matchesProject && matchesSearch;
    });

    const allVisible = tasks.filter(task =>
        selectedProject === null ||
        task.project_id === selectedProject
    );

    $("totalCount").textContent = allVisible.length;
    $("todoCount").textContent =
        allVisible.filter(t => t.status === "todo").length;
    $("progressCount").textContent =
        allVisible.filter(t => t.status === "progress").length;
    $("doneCount").textContent =
        allVisible.filter(t => t.status === "done").length;

    const columns = [
        { status: "todo", list: "todoList", badge: "todoBadge" },
        { status: "progress", list: "progressList", badge: "progressBadge" },
        { status: "done", list: "doneList", badge: "doneBadge" }
    ];

    columns.forEach(column => {
        const items = visibleTasks.filter(
            task => task.status === column.status
        );

        $(column.badge).textContent = items.length;

        $(column.list).innerHTML = items.length
            ? items.map(task => taskCard(task)).join("")
            : '<p class="empty">No tasks here yet.</p>';
    });
}

function taskCard(task) {
    const statusOptions = [
        ["todo", "To Do"],
        ["progress", "In Progress"],
        ["done", "Done"]
    ];

    const projectLabel = task.project_name
        ? escapeHTML(task.project_name)
        : "No project";

    const dueDate = task.due_date
        ? String(task.due_date).slice(0, 10)
        : "";

    return `
        <article class="task-card">
            <span class="priority ${escapeHTML(task.priority)}">
                ${escapeHTML(task.priority)} priority
            </span>

            <h4>${escapeHTML(task.title)}</h4>

            ${task.description
                ? `<p class="task-description">
                    ${escapeHTML(task.description)}
                   </p>`
                : ""}

            <div class="task-meta">
                <div>${projectLabel}</div>
                <div>${dueDate ? "Due: " + escapeHTML(dueDate) : "No deadline"}</div>
            </div>

            <div class="task-actions">
                <select aria-label="Change task status"
                    onchange="changeStatus(${task.id}, this.value)">
                    ${statusOptions.map(([value, label]) => `
                        <option value="${value}"
                            ${task.status === value ? "selected" : ""}>
                            ${label}
                        </option>
                    `).join("")}
                </select>
            </div>

            <div class="task-actions">
                <button onclick="editTask(${task.id})">Edit</button>
                <button class="delete-btn"
                    onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </article>
    `;
}

loadDashboard();
