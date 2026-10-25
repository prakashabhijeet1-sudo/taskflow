
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./db");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Test database and API
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({ message: "TaskFlow API and database are running" });
    } catch (error) {
        res.status(500).json({ message: "Database connection failed" });
    }
});

// Get all projects
app.get("/api/projects", async (req, res) => {
    try {
        const [projects] = await db.query(
            `SELECT p.*,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.project_id = p.id) AS task_count,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.project_id = p.id
                 AND t.status = 'done') AS completed_count
             FROM projects p
             ORDER BY p.created_at DESC`
        );
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch projects" });
    }
});

// Create a project
app.post("/api/projects", async (req, res) => {
    try {
        const { name, description = "" } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Project name is required" });
        }

        const [result] = await db.query(
            "INSERT INTO projects (name, description) VALUES (?, ?)",
            [name.trim(), description]
        );

        res.status(201).json({
            id: result.insertId,
            name: name.trim(),
            description
        });
    } catch (error) {
        res.status(500).json({ message: "Could not create project" });
    }
});

// Delete a project
app.delete("/api/projects/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM projects WHERE id = ?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({ message: "Project deleted" });
    } catch (error) {
        res.status(500).json({ message: "Could not delete project" });
    }
});

// Get tasks, optionally filtered by project
app.get("/api/tasks", async (req, res) => {
    try {
        let sql = `
            SELECT t.*, p.name AS project_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
        `;
        const params = [];

        if (req.query.projectId) {
            sql += " WHERE t.project_id = ?";
            params.push(req.query.projectId);
        }

        sql += " ORDER BY t.created_at DESC";

        const [tasks] = await db.query(sql, params);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch tasks" });
    }
});

// Create a task
app.post("/api/tasks", async (req, res) => {
    try {
        const {
            title,
            description = "",
            project_id = null,
            status = "todo",
            priority = "medium",
            due_date = null
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Task title is required" });
        }

        if (!["todo", "progress", "done"].includes(status)) {
            return res.status(400).json({ message: "Invalid task status" });
        }

        if (!["low", "medium", "high"].includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const [result] = await db.query(
            `INSERT INTO tasks
             (title, description, project_id, status, priority, due_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description,
                project_id || null,
                status,
                priority,
                due_date || null
            ]
        );

        res.status(201).json({
            id: result.insertId,
            title: title.trim(),
            description,
            project_id,
            status,
            priority,
            due_date
        });
    } catch (error) {
        res.status(500).json({ message: "Could not create task" });
    }
});

// Update a task
app.put("/api/tasks/:id", async (req, res) => {
    try {
        const {
            title,
            description,
            project_id,
            status,
            priority,
            due_date
        } = req.body;

        if (title !== undefined && !title.trim()) {
            return res.status(400).json({ message: "Task title is required" });
        }

        if (status !== undefined &&
            !["todo", "progress", "done"].includes(status)) {
            return res.status(400).json({ message: "Invalid task status" });
        }

        if (priority !== undefined &&
            !["low", "medium", "high"].includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const [result] = await db.query(
            `UPDATE tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                project_id = ?,
                status = COALESCE(?, status),
                priority = COALESCE(?, priority),
                due_date = ?
             WHERE id = ?`,
            [
                title === undefined ? null : title.trim(),
                description === undefined ? null : description,
                project_id ?? null,
                status ?? null,
                priority ?? null,
                due_date || null,
                req.params.id
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({ message: "Task updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Could not update task" });
    }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM tasks WHERE id = ?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Could not delete task" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`TaskFlow running at http://localhost:${PORT}`);
});
